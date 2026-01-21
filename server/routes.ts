
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import { uploadToImageKit, deleteFromImageKit } from "./imagekit";
import OpenAI from "openai";
import axios from "axios";

async function parsePDF(buffer: Buffer): Promise<string> {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("parsePDF expected a Buffer");
  }

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  // Extract text from all pages
  let fullText = "";
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

/**
 * Fetches a PDF from ImageKit and converts it to base64 for OpenAI Vision API
 */
async function fetchDocumentForVision(fileUrl: string): Promise<string> {
  try {
    console.log(`Fetching document from ImageKit: ${fileUrl}`);

    // Fetch the PDF from ImageKit
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    // Check for HTTP errors
    if (response.status === 404) {
      console.error(`Document not found at ImageKit URL: ${fileUrl}`);
      throw new Error(`Document file not found (404). The file may have been deleted from storage.`);
    } else if (response.status >= 400) {
      console.error(`HTTP ${response.status} error fetching document: ${fileUrl}`);
      throw new Error(`Failed to fetch document (HTTP ${response.status})`);
    }

    // Convert to base64
    const base64 = Buffer.from(response.data).toString('base64');

    // Return as data URI for PDFs
    // OpenAI Vision API supports PDFs directly with GPT-4o
    return `data:application/pdf;base64,${base64}`;
  } catch (error) {
    console.error("Error fetching document from ImageKit:", error);
    if (error instanceof Error) {
      throw error; // Re-throw with existing message
    }
    throw new Error("Failed to fetch document for analysis");
  }
}

/**
 * Creates a vision-enabled prompt with document context
 */
async function createVisionMessages(
  userMessage: string,
  referencedDocs: { name: string; fileUrl: string }[],
  conversationHistory: { role: string; content: string; referencedDocs: string[] | null }[]
): Promise<OpenAI.Chat.ChatCompletionMessageParam[]> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  // Add system message
  messages.push({
    role: "system",
    content: "You are a helpful AI assistant that analyzes documents and answers questions about them. When documents are referenced, carefully examine their content and provide accurate, detailed answers based on what you see in the documents. If you cannot find the answer in the provided documents, clearly state that."
  });

  // Add conversation history (last 5 messages for context)
  const recentHistory = conversationHistory.slice(-5);
  for (const msg of recentHistory) {
    if (msg.role === "user") {
      messages.push({
        role: "user",
        content: msg.content
      });
    } else if (msg.role === "assistant") {
      messages.push({
        role: "assistant",
        content: msg.content
      });
    }
  }

  // Add current user message with document images
  if (referencedDocs.length > 0) {
    // Create content array with text and images
    const content: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: "text",
        text: `${userMessage}\n\nReferenced documents: ${referencedDocs.map(d => d.name).join(", ")}`
      }
    ];

    // Add each document as an image/PDF
    const failedDocs: string[] = [];
    for (const doc of referencedDocs) {
      try {
        const base64Data = await fetchDocumentForVision(doc.fileUrl);
        content.push({
          type: "image_url",
          image_url: {
            url: base64Data,
            detail: "high" // Use high detail for better accuracy
          }
        });
      } catch (error) {
        console.error(`Failed to fetch document ${doc.name}:`, error);
        failedDocs.push(doc.name);
        // Continue with other documents
      }
    }

    // If some documents failed to load, add a note to the prompt
    if (failedDocs.length > 0) {
      content.push({
        type: "text",
        text: `\n\nNote: The following documents could not be loaded: ${failedDocs.join(", ")}. They may have been deleted from storage.`
      });
    }

    messages.push({
      role: "user",
      content: content
    });
  } else {
    // No documents, just text
    messages.push({
      role: "user",
      content: userMessage
    });
  }

  return messages;
}

const upload = multer({ storage: multer.memoryStorage() });

/**
 * Get database schema information for Clippy
 */
function getDatabaseSchema() {
  return {
    collections: {
      folders: {
        description: "Desktop folders that contain items",
        fields: {
          id: "Unique identifier",
          name: "Folder name",
          x: "X position on desktop",
          y: "Y position on desktop"
        }
      },
      folderItems: {
        description: "Items inside folders (files, bookmarks, notes)",
        fields: {
          id: "Unique identifier",
          folderId: "ID of parent folder",
          type: "Type of item: 'file', 'bookmark', or 'note'",
          name: "Item name",
          x: "X position in folder",
          y: "Y position in folder",
          fileUrl: "(for files) URL of uploaded file",
          originalName: "(for files) Original filename",
          mimeType: "(for files) MIME type",
          fileSize: "(for files) Size in bytes",
          url: "(for bookmarks) Bookmark URL",
          faviconUrl: "(for bookmarks) Favicon URL",
          content: "(for notes) Note content",
          createdAt: "Creation timestamp",
          updatedAt: "Last update timestamp"
        }
      },
      documents: {
        description: "PDF documents uploaded for AI chat analysis",
        fields: {
          id: "Unique identifier",
          name: "Document name",
          originalName: "Original filename",
          content: "Extracted text content from PDF",
          fileUrl: "URL of uploaded PDF",
          fileId: "ImageKit file ID",
          createdAt: "Upload timestamp"
        }
      },
      docMessages: {
        description: "Chat messages related to document analysis",
        fields: {
          id: "Unique identifier",
          documentId: "Related document ID (null for general chat)",
          role: "'user' or 'assistant'",
          content: "Message content",
          referencedDocs: "Array of document names referenced",
          createdAt: "Message timestamp"
        }
      },
      mailingLists: {
        description: "Email mailing lists",
        fields: {
          id: "Unique identifier",
          name: "Mailing list name",
          emails: "Array of email addresses",
          createdAt: "Creation timestamp"
        }
      }
    }
  };
}

/**
 * Generates context by collecting all data from database and sending to OpenAI
 */
async function generateContext(): Promise<string> {
  try {
    // Collect all data from database
    const [folders, documents, docMessages, mailingLists] = await Promise.all([
      storage.getFolders(),
      storage.getDocuments(),
      storage.getDocMessages(),
      storage.getMailingLists(),
    ]);

    // Collect all folder items
    const folderItemsData = [];
    for (const folder of folders) {
      const items = await storage.getFolderItems(folder.id);
      folderItemsData.push({
        folderId: folder.id,
        folderName: folder.name,
        items,
      });
    }

    // Compile all data
    const allData = {
      folders,
      folderItems: folderItemsData,
      documents: documents.map(d => ({
        id: d.id,
        name: d.name,
        originalName: d.originalName,
        createdAt: d.createdAt,
        contentPreview: d.content.substring(0, 500), // Limit content to avoid token limits
      })),
      docMessages: docMessages.slice(-20), // Last 20 messages
      mailingLists,
    };

    // Send to OpenAI to generate context summary
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a context analyzer. Given all the data from a user's desktop system, create a comprehensive but concise context summary that captures:
- What folders exist and what's in them
- What documents have been uploaded and their general topics
- What conversations the user has had with the AI assistant
- What mailing lists exist
- Any patterns or key information that would be useful for answering future questions

Format the context as a structured summary that can be easily referenced. Be concise but informative. Focus on the most important and useful information.`
        },
        {
          role: "user",
          content: `Here is all the data from the system:\n\n${JSON.stringify(allData, null, 2)}\n\nPlease create a comprehensive context summary.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const contextSummary = completion.choices[0]?.message?.content;
    if (!contextSummary) {
      throw new Error("Failed to generate context");
    }

    return contextSummary;
  } catch (error) {
    console.error("Error generating context:", error);
    throw error;
  }
}

/**
 * Handles a question from Clippy by analyzing database schema and querying data
 */
async function handleClippyQuestion(question: string): Promise<string> {
  const schema = getDatabaseSchema();

  // Get context if available
  const contextData = await storage.getContext();

  // Step 1: Use OpenAI to determine what data we need to query
  const analysisCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Fast and cheap model
    messages: [
      {
        role: "system",
        content: `You are a database query planner. Given a user question and database schema, determine what data needs to be queried.

Database Schema:
${JSON.stringify(schema, null, 2)}

Available query operations:
- getFolders(): Get all folders
- getFolder(id): Get specific folder
- getFolderItems(folderId): Get items in a folder
- getDocuments(): Get all documents
- getDocument(id): Get specific document
- getDocMessages(): Get all chat messages
- getMailingLists(): Get all mailing lists
- getMailingList(id): Get specific mailing list

Respond with a JSON object specifying what queries to run:
{
  "queries": ["queryName1", "queryName2"],
  "reasoning": "why these queries are needed"
}

If the question cannot be answered with available data, respond with:
{
  "queries": [],
  "reasoning": "explanation of why data is not available"
}`
      },
      {
        role: "user",
        content: question
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const analysisText = analysisCompletion.choices[0]?.message?.content;
  if (!analysisText) {
    throw new Error("Failed to analyze question");
  }

  const analysis = JSON.parse(analysisText);

  // Step 2: Execute the determined queries
  const queryResults: Record<string, any> = {};

  for (const queryName of analysis.queries) {
    try {
      switch (queryName) {
        case "getFolders":
          queryResults.folders = await storage.getFolders();
          break;
        case "getFolderItems":
          // Get all folders first, then get items for each
          const folders = await storage.getFolders();
          queryResults.folderItems = [];
          for (const folder of folders) {
            const items = await storage.getFolderItems(folder.id);
            queryResults.folderItems.push({
              folderId: folder.id,
              folderName: folder.name,
              items
            });
          }
          break;
        case "getDocuments":
          queryResults.documents = await storage.getDocuments();
          break;
        case "getDocMessages":
          queryResults.docMessages = await storage.getDocMessages();
          break;
        case "getMailingLists":
          queryResults.mailingLists = await storage.getMailingLists();
          break;
      }
    } catch (error) {
      console.error(`Error executing query ${queryName}:`, error);
      queryResults[queryName] = { error: "Failed to execute query" };
    }
  }

  // Step 3: Use OpenAI to formulate a natural language answer
  const systemPrompt = `You are Clippy, a helpful desktop assistant from the Windows 95 era. You're friendly, enthusiastic, and love to help users with their questions. Use a warm, conversational tone.

When answering:
- Be concise and direct
- Use the data provided to give specific, accurate information
- If the data doesn't contain the answer, politely explain what information is available
- Add a touch of personality but stay professional
- Use bullet points for lists when appropriate${contextData ? '\n\nYou have access to a context summary that provides an overview of the user\'s system. Use it to provide more informed answers.' : ''}`;

  const userPrompt = contextData
    ? `Context Summary:
${contextData.contextData}

Question: ${question}

Query Results:
${JSON.stringify(queryResults, null, 2)}

Please provide a helpful answer based on the context and data above.`
    : `Question: ${question}

Query Results:
${JSON.stringify(queryResults, null, 2)}

Please provide a helpful answer based on the data above.`;

  const answerCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Fast and cheap model
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const answer = answerCompletion.choices[0]?.message?.content;
  if (!answer) {
    throw new Error("Failed to generate answer");
  }

  return answer;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === API ROUTES ===

  // List folders
  app.get(api.folders.list.path, async (req, res) => {
    const folders = await storage.getFolders();
    res.json(folders);
  });

  // Get single folder
  app.get(api.folders.get.path, async (req, res) => {
    const id = req.params.id;
    const folder = await storage.getFolder(id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    res.json(folder);
  });

  // Create folder
  app.post(api.folders.create.path, async (req, res) => {
    try {
      const input = api.folders.create.input.parse(req.body);
      // Basic duplicate check handled by DB constraint, but could check here too
      const folder = await storage.createFolder(input);
      res.status(201).json(folder);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      // Handle unique constraint error (MongoDB error 11000)
      if ((err as any).code === 11000) {
        return res.status(400).json({ message: "A folder with this name already exists" });
      }
      throw err;
    }
  });

  // Update folder
  app.put(api.folders.update.path, async (req, res) => {
    try {
      const id = req.params.id;
      const input = api.folders.update.input.parse(req.body);
      const updated = await storage.updateFolder(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      // Handle not found logic if storage throws
      res.status(404).json({ message: "Folder not found" });
    }
  });

  // Delete folder
  app.delete(api.folders.delete.path, async (req, res) => {
    const id = req.params.id;
    await storage.deleteFolder(id);
    res.status(204).end();
  });

  // === DOCUMENT ROUTES ===

  // List documents
  app.get(api.documents.list.path, async (req, res) => {
    const docs = await storage.getDocuments();
    res.json(docs);
  });

  // Get single document
  app.get(api.documents.get.path, async (req, res) => {
    const id = req.params.id;
    const doc = await storage.getDocument(id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(doc);
  });

  // Upload PDF document
  app.post(api.documents.upload.path, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: "Only PDF files are allowed" });
      }

      // Parse PDF content
      const content = await parsePDF(req.file.buffer);

      // Upload to ImageKit
      const imagekitResult = await uploadToImageKit(req.file.buffer, req.file.originalname);

      // Use original filename without extension as the document name
      const name = req.file.originalname.replace(/\.pdf$/i, '');

      const doc = await storage.createDocument({
        name: name,
        originalName: req.file.originalname,
        content: content,
        fileUrl: imagekitResult.url,
        fileId: imagekitResult.fileId,
      });

      res.status(201).json(doc);
    } catch (err) {
      console.error("Error uploading document:", err);
      res.status(500).json({ message: "Failed to process document" });
    }
  });

  // Rename document
  app.patch(api.documents.rename.path, async (req, res) => {
    try {
      const id = req.params.id;
      const input = api.documents.rename.input.parse(req.body);
      const updated = await storage.updateDocument(id, { name: input.name });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Document not found" });
    }
  });

  // Delete document
  app.delete(api.documents.delete.path, async (req, res) => {
    const id = req.params.id;

    // Get document first to check for ImageKit file
    const doc = await storage.getDocument(id);
    if (doc?.fileId) {
      try {
        await deleteFromImageKit(doc.fileId);
      } catch (err) {
        console.log("Failed to delete from ImageKit:", err);
      }
    }
    
    await storage.deleteDocument(id);
    res.status(204).end();
  });

  // === CHAT ROUTES ===

  // Get chat messages
  app.get(api.chat.messages.path, async (req, res) => {
    const messages = await storage.getDocMessages();
    res.json(messages);
  });

  // Send chat message with document references
  app.post(api.chat.send.path, async (req, res) => {
    try {
      const input = api.chat.send.input.parse(req.body);

      // Fetch referenced documents
      const referencedDocs = input.referencedDocIds
        ? await storage.getDocumentsByIds(input.referencedDocIds)
        : [];

      // Get conversation history for context
      const conversationHistory = await storage.getDocMessages();

      // Save user message
      const userMsg = await storage.createDocMessage({
        documentId: null,
        role: "user",
        content: input.content,
        referencedDocs: referencedDocs.map(d => d.name),
      });

      let aiContent: string;

      try {
        // Check if OpenAI is configured
        if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
          throw new Error("OpenAI API not configured");
        }

        // Prepare documents for vision API (only those with fileUrl)
        const docsWithImages = referencedDocs
          .filter(doc => doc.fileUrl)
          .map(doc => ({
            name: doc.name,
            fileUrl: doc.fileUrl!
          }));

        // Create messages with vision support
        const messages = await createVisionMessages(
          input.content,
          docsWithImages,
          conversationHistory
        );

        // Determine which model to use based on whether we have documents
        const model = docsWithImages.length > 0
          ? "gpt-4o" // Use GPT-4o for vision (supports PDFs)
          : "gpt-4"; // Use regular GPT-4 for text-only

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
          model: model,
          messages: messages,
          max_tokens: 2048,
          temperature: 0.7,
        });

        aiContent = completion.choices[0]?.message?.content ||
          "I apologize, but I couldn't generate a response. Please try again.";

      } catch (error) {
        console.error("Error calling OpenAI Vision API:", error);

        // Provide helpful error messages
        if (error instanceof Error) {
          if (error.message.includes("API key") || error.message.includes("not configured")) {
            aiContent = "AI chat is not configured. Please contact the administrator to set up OpenAI API keys.";
          } else if (error.message.includes("fetch document")) {
            aiContent = "I encountered an error loading one or more documents. Please try again or contact support if the issue persists.";
          } else if (error.message.includes("rate limit")) {
            aiContent = "The AI service is currently experiencing high demand. Please try again in a moment.";
          } else {
            aiContent = `I encountered an error while processing your request: ${error.message}`;
          }
        } else {
          aiContent = "An unexpected error occurred. Please try again.";
        }
      }

      // Save AI message
      const aiMsg = await storage.createDocMessage({
        documentId: null,
        role: "assistant",
        content: aiContent,
        referencedDocs: null,
      });

      res.json({ userMessage: userMsg, aiMessage: aiMsg });
    } catch (err) {
      console.error("Error in chat:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // === MAILING LISTS ===
  app.get(api.mailingLists.list.path, async (_req, res) => {
    try {
      const lists = await storage.getMailingLists();
      res.json(lists);
    } catch (err) {
      console.error("Error fetching mailing lists:", err);
      res.status(500).json({ message: "Failed to fetch mailing lists" });
    }
  });

  app.get(api.mailingLists.get.path, async (req, res) => {
    try {
      const { id } = req.params;
      const list = await storage.getMailingList(id);
      if (!list) {
        return res.status(404).json({ message: "Mailing list not found" });
      }
      res.json(list);
    } catch (err) {
      console.error("Error fetching mailing list:", err);
      res.status(500).json({ message: "Failed to fetch mailing list" });
    }
  });

  app.post(api.mailingLists.create.path, async (req, res) => {
    try {
      const input = api.mailingLists.create.input.parse(req.body);
      const list = await storage.createMailingList(input);
      res.status(201).json(list);
    } catch (err) {
      console.error("Error creating mailing list:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err instanceof Error && err.message.includes("duplicate key")) {
        return res.status(400).json({ message: "A mailing list with this name already exists" });
      }
      res.status(500).json({ message: "Failed to create mailing list" });
    }
  });

  app.put(api.mailingLists.update.path, async (req, res) => {
    try {
      const { id } = req.params;
      const input = api.mailingLists.update.input.parse(req.body);
      const list = await storage.updateMailingList(id, input);
      res.json(list);
    } catch (err) {
      console.error("Error updating mailing list:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err instanceof Error && err.message.includes("not found")) {
        return res.status(404).json({ message: "Mailing list not found" });
      }
      res.status(500).json({ message: "Failed to update mailing list" });
    }
  });

  app.delete(api.mailingLists.delete.path, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMailingList(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting mailing list:", err);
      res.status(500).json({ message: "Failed to delete mailing list" });
    }
  });

  // === FOLDER ITEM ROUTES ===

  // Helper function to fetch favicon URL
  function getFaviconUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      return `https://www.google.com/s2/favicons?domain=default&sz=64`;
    }
  }

  // List folder items
  app.get(api.folderItems.list.path, async (req, res) => {
    try {
      const { folderId } = req.params;
      const items = await storage.getFolderItems(folderId);
      res.json(items);
    } catch (err) {
      console.error("Error fetching folder items:", err);
      res.status(500).json({ message: "Failed to fetch folder items" });
    }
  });

  // Upload file to folder
  app.post(api.folderItems.createFile.path, upload.single('file'), async (req, res) => {
    try {
      const { folderId } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (req.file.size > maxSize) {
        return res.status(400).json({ message: "File size exceeds 50MB limit" });
      }

      // Upload to ImageKit in folder-specific path
      const { url, fileId } = await uploadToImageKit(
        req.file.buffer,
        req.file.originalname,
        `/folders/${folderId}`
      );

      // Parse x, y from request body if provided
      const x = req.body.x ? parseInt(req.body.x) : 0;
      const y = req.body.y ? parseInt(req.body.y) : 0;

      const folderItem = await storage.createFolderItem({
        folderId,
        type: 'file',
        name: req.file.originalname,
        x,
        y,
        fileUrl: url,
        fileId,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        url: null,
        faviconUrl: null,
        content: null,
      });

      res.status(201).json(folderItem);
    } catch (err) {
      console.error("Error uploading file:", err);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Create bookmark in folder
  app.post(api.folderItems.createBookmark.path, async (req, res) => {
    try {
      const { folderId } = req.params;
      const input = api.folderItems.createBookmark.input.parse(req.body);

      const faviconUrl = getFaviconUrl(input.url);

      const folderItem = await storage.createFolderItem({
        folderId,
        type: 'bookmark',
        name: input.name,
        x: input.x,
        y: input.y,
        url: input.url,
        faviconUrl,
        fileUrl: null,
        fileId: null,
        originalName: null,
        mimeType: null,
        fileSize: null,
        content: null,
      });

      res.status(201).json(folderItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Error creating bookmark:", err);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  // Create note in folder
  app.post(api.folderItems.createNote.path, async (req, res) => {
    try {
      const { folderId } = req.params;
      const input = api.folderItems.createNote.input.parse(req.body);

      const folderItem = await storage.createFolderItem({
        folderId,
        type: 'note',
        name: input.name,
        x: input.x,
        y: input.y,
        content: input.content,
        fileUrl: null,
        fileId: null,
        originalName: null,
        mimeType: null,
        fileSize: null,
        url: null,
        faviconUrl: null,
      });

      res.status(201).json(folderItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Error creating note:", err);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  // Update folder item
  app.patch(api.folderItems.update.path, async (req, res) => {
    try {
      const { folderId, itemId } = req.params;
      const input = api.folderItems.update.input.parse(req.body);

      const updated = await storage.updateFolderItem(folderId, itemId, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Error updating folder item:", err);
      res.status(404).json({ message: "Folder item not found" });
    }
  });

  // Delete folder item
  app.delete(api.folderItems.delete.path, async (req, res) => {
    try {
      const { folderId, itemId } = req.params;
      await storage.deleteFolderItem(folderId, itemId);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting folder item:", err);
      res.status(500).json({ message: "Failed to delete folder item" });
    }
  });

  // === CLIPPY ASSISTANT ===
  app.post(api.clippy.ask.path, async (req, res) => {
    try {
      const input = api.clippy.ask.input.parse(req.body);

      // Check if OpenAI is configured
      if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
        return res.status(500).json({
          message: "AI service is not configured. Please contact the administrator."
        });
      }

      const answer = await handleClippyQuestion(input.question);
      res.json({ answer });
    } catch (err) {
      console.error("Error in Clippy assistant:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to process question"
      });
    }
  });

  app.post(api.clippy.updateContext.path, async (req, res) => {
    try {
      // Check if OpenAI is configured
      if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
        return res.status(500).json({
          message: "AI service is not configured. Please contact the administrator."
        });
      }

      // Generate context from all data
      const contextSummary = await generateContext();

      // Save to database
      await storage.createOrUpdateContext(contextSummary);

      res.json({ message: "Context updated successfully!" });
    } catch (err) {
      console.error("Error updating context:", err);
      res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to update context"
      });
    }
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const folders = await storage.getFolders();
    if (folders.length === 0) {
      console.log("Seeding database with initial folders...");
      await storage.createFolder({ name: "Projects", x: 20, y: 20 });
      await storage.createFolder({ name: "Documents", x: 20, y: 120 });
      await storage.createFolder({ name: "Photos", x: 20, y: 220 });
      console.log("Seeding complete.");
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}
