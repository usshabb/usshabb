
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import OpenAI from "openai";
import { uploadToImageKit, deleteFromImageKit } from "./imagekit";

async function parsePDF(buffer: Buffer): Promise<string> {
  const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
  const pdfParse = pdfParseModule.default;
  const data = await pdfParse(buffer);
  return data.text;
}

const upload = multer({ storage: multer.memoryStorage() });

function getOpenAIClient() {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  
  if (!baseURL || !apiKey) {
    throw new Error("OpenAI integration not configured");
  }
  
  return new OpenAI({ baseURL, apiKey });
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
    const id = Number(req.params.id);
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
      // Handle unique constraint error (Postgres error 23505)
      if ((err as any).code === '23505') {
        return res.status(400).json({ message: "A folder with this name already exists" });
      }
      throw err;
    }
  });

  // Update folder
  app.put(api.folders.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
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
    const id = Number(req.params.id);
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
    const id = Number(req.params.id);
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
      
      // Upload to ImageKit if configured
      let fileUrl: string | null = null;
      let fileId: string | null = null;
      
      try {
        const imagekitResult = await uploadToImageKit(req.file.buffer, req.file.originalname);
        fileUrl = imagekitResult.url;
        fileId = imagekitResult.fileId;
      } catch (imagekitErr: any) {
        console.log("ImageKit upload skipped:", imagekitErr.message);
      }
      
      // Generate AI name for the document
      const openai = getOpenAIClient();
      const nameResponse = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are a document naming assistant. Given the content of a PDF document, generate a short, descriptive, and intuitive name (3-6 words max). Only respond with the name, nothing else."
          },
          {
            role: "user",
            content: `Generate a name for this document based on its content:\n\n${content.slice(0, 2000)}`
          }
        ],
        max_tokens: 30,
      });
      
      const aiName = nameResponse.choices[0]?.message?.content?.trim() || req.file.originalname;
      
      const doc = await storage.createDocument({
        name: aiName,
        originalName: req.file.originalname,
        content: content,
        fileUrl: fileUrl,
        fileId: fileId,
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
      const id = Number(req.params.id);
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
    const id = Number(req.params.id);
    
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
      
      // Build context from referenced documents
      let context = "";
      if (referencedDocs.length > 0) {
        context = "Here are the documents the user is referencing:\n\n";
        for (const doc of referencedDocs) {
          context += `=== ${doc.name} ===\n${doc.content.slice(0, 4000)}\n\n`;
        }
      }
      
      // Save user message
      const userMsg = await storage.createDocMessage({
        documentId: null,
        role: "user",
        content: input.content,
        referencedDocs: referencedDocs.map(d => d.name),
      });
      
      // Get AI response
      const openai = getOpenAIClient();
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that answers questions about documents. Be concise and helpful. ${context}`
          },
          {
            role: "user",
            content: input.content
          }
        ],
      });
      
      const aiContent = aiResponse.choices[0]?.message?.content || "I couldn't generate a response.";
      
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
