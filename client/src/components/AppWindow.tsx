import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FileText, Upload, Trash2, Send, AtSign, MessageSquare, Loader2, Pencil, Check, X, Mail, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Document, DocMessage, MailingList } from "@shared/schema";
import { useMailingLists, useCreateMailingList, useDeleteMailingList } from "@/hooks/use-mailing-lists";

interface AppWindowProps {
  appId: string;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
  width?: string;
  height?: string;
}

export function AppWindow({ appId, title, onClose, children, width = "600px", height = "500px" }: AppWindowProps) {
  return (
    <div 
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden shadow-2xl z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/30 dark:border-gray-700/30"
      style={{ width, height }}
      data-testid={`window-${appId}`}
    >
      <div className="h-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur flex items-center px-3 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            data-testid={`button-close-${appId}`}
          />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="flex-1 text-center text-sm font-medium text-gray-700 dark:text-gray-200">{title}</span>
        <div className="w-16" />
      </div>
      <div className="h-[calc(100%-2.5rem)] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function DocsApp({ onClose }: { onClose: () => void }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [message, setMessage] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: documents = [], isLoading: docsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const { data: chatMessages = [], isLoading: messagesLoading } = useQuery<DocMessage[]>({
    queryKey: ['/api/chat/messages'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/documents/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      if (selectedDoc?.id === deletedId) {
        setSelectedDoc(null);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; referencedDocIds?: string[] }) => {
      return apiRequest('POST', '/api/chat/send', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      setMessage("");
      setSelectedDocs([]);
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }): Promise<Document> => {
      const res = await apiRequest('PATCH', `/api/documents/${id}/rename`, { name });
      return res.json();
    },
    onSuccess: (updatedDoc: Document) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      if (selectedDoc?.id === updatedDoc.id) {
        setSelectedDoc(updatedDoc);
      }
      setEditingDocId(null);
      setEditingName("");
    },
  });

  const startRename = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDocId(doc.id);
    setEditingName(doc.name);
  };

  const cancelRename = () => {
    setEditingDocId(null);
    setEditingName("");
  };

  const submitRename = (id: string) => {
    if (editingName.trim()) {
      renameMutation.mutate({ id, name: editingName.trim() });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate({
      content: message,
      referencedDocIds: selectedDocs.length > 0 ? selectedDocs : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '@' && !showMentions) {
      const input = e.currentTarget;
      setMentionStartPos(input.selectionStart || 0);
      setShowMentions(true);
      setMentionQuery("");
    } else if (e.key === 'Escape') {
      setShowMentions(false);
      setMentionStartPos(null);
      setMentionQuery("");
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!showMentions) {
        handleSendMessage();
      }
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // If mention dropdown is open, extract query after @
    if (showMentions && mentionStartPos !== null) {
      const afterMention = value.substring(mentionStartPos + 1);
      // Check if @ still exists or user backspaced past it
      if (mentionStartPos > value.length || value[mentionStartPos] !== '@') {
        setShowMentions(false);
        setMentionStartPos(null);
        setMentionQuery("");
      } else {
        // Extract query until space or end of string
        const queryMatch = afterMention.match(/^([^\s]*)/);
        const query = queryMatch ? queryMatch[1] : "";
        setMentionQuery(query);
      }
    }
  };

  const addDocMention = (doc: Document) => {
    if (!selectedDocs.includes(doc.id)) {
      setSelectedDocs([...selectedDocs, doc.id]);
    }

    // Replace the @query with @documentName in the message
    if (mentionStartPos !== null) {
      const before = message.substring(0, mentionStartPos);
      const after = message.substring(mentionStartPos + 1 + mentionQuery.length);
      setMessage(`${before}@${doc.name} ${after}`);
    }

    setShowMentions(false);
    setMentionStartPos(null);
    setMentionQuery("");
  };

  const removeDocMention = (id: string) => {
    setSelectedDocs(selectedDocs.filter(d => d !== id));
  };

  const filteredDocuments = useMemo(() => {
    if (!mentionQuery.trim()) {
      return documents;
    }
    const query = mentionQuery.toLowerCase();
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(query) ||
      doc.originalName.toLowerCase().includes(query)
    );
  }, [documents, mentionQuery]);

  return (
    <AppWindow appId="docs" title="Docs" onClose={onClose} width="1000px" height="650px">
      <div className="flex h-full relative">
        <div className="w-64 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200/50 dark:border-gray-700/50">
          <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              data-testid="button-upload-pdf"
            >
              {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-file-upload"
            />
            <div className="flex-1" />
            <Button
              size="icon"
              variant={chatOpen ? "default" : "ghost"}
              onClick={() => setChatOpen(!chatOpen)}
              data-testid="button-toggle-chat"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-2">
            {docsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <FileText className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-xs">No documents</p>
              </div>
            ) : (
              <div className="space-y-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => editingDocId !== doc.id && setSelectedDoc(doc)}
                    onDoubleClick={(e) => startRename(doc, e)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                      selectedDoc?.id === doc.id
                        ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                        : "bg-white dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-100 dark:hover:bg-gray-600/50"
                    )}
                    data-testid={`doc-item-${doc.id}`}
                  >
                    <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingDocId === doc.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitRename(doc.id);
                              if (e.key === 'Escape') cancelRename();
                            }}
                            className="h-6 text-xs px-1"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`input-rename-doc-${doc.id}`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-5 h-5"
                            onClick={(e) => { e.stopPropagation(); submitRename(doc.id); }}
                            disabled={renameMutation.isPending}
                          >
                            <Check className="w-3 h-3 text-green-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-5 h-5"
                            onClick={(e) => { e.stopPropagation(); cancelRename(); }}
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{doc.name}</p>
                      )}
                    </div>
                    {editingDocId !== doc.id && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6"
                          onClick={(e) => startRename(doc, e)}
                          data-testid={`button-rename-doc-${doc.id}`}
                        >
                          <Pencil className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6"
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(doc.id); }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-doc-${doc.id}`}
                        >
                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className={cn("flex-1 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-700/50", chatOpen && "flex-1")}>
          {selectedDoc ? (
            <>
              <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{selectedDoc.name}</h3>
                <p className="text-xs text-gray-400">{selectedDoc.originalName}</p>
              </div>
              <div className="flex-1 overflow-hidden">
                {selectedDoc.fileUrl ? (
                  <iframe
                    src={selectedDoc.fileUrl}
                    className="w-full h-full border-none"
                    title={selectedDoc.name}
                  />
                ) : (
                  <ScrollArea className="flex-1 p-4">
                    <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedDoc.content}
                    </pre>
                  </ScrollArea>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
              <FileText className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm">Select a document to view</p>
              <p className="text-xs mt-1">or upload a new PDF</p>
            </div>
          )}
        </div>

        {chatOpen && (
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
            <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ask about your documents</h3>
              <p className="text-xs text-gray-400">Use @ to reference specific documents</p>
            </div>

            <ScrollArea className="flex-1 p-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Start a conversation about your documents</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] p-3 rounded-lg",
                          msg.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        )}
                        data-testid={`chat-message-${msg.id}`}
                      >
                        {msg.referencedDocs && msg.referencedDocs.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {msg.referencedDocs.map((docName, i) => (
                              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-blue-400/30 dark:bg-blue-600/30">
                                @{docName}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {selectedDocs.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-200/50 dark:border-gray-700/50 flex flex-wrap gap-1">
                {selectedDocs.map((docId) => {
                  const doc = documents.find(d => d.id === docId);
                  return doc ? (
                    <span
                      key={docId}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    >
                      @{doc.name}
                      <button onClick={() => removeDocMention(docId)} className="hover:text-red-500">&times;</button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {showMentions && filteredDocuments.length > 0 && (
              <div className="absolute bottom-16 left-1/3 right-4 mx-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-48 overflow-auto z-50">
                {filteredDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => addDocMention(doc)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                    data-testid={`mention-doc-${doc.id}`}
                  >
                    <AtSign className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{doc.name}</span>
                  </button>
                ))}
              </div>
            )}

            {showMentions && filteredDocuments.length === 0 && mentionQuery && (
              <div className="absolute bottom-16 left-1/3 right-4 mx-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50">
                <p className="text-sm text-gray-500 dark:text-gray-400">No documents found matching "{mentionQuery}"</p>
              </div>
            )}

            <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowMentions(!showMentions)}
                data-testid="button-show-mentions"
              >
                <AtSign className="w-4 h-4" />
              </Button>
              <Input
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your documents..."
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppWindow>
  );
}

export function NotesApp({ onClose }: { onClose: () => void }) {
  return (
    <AppWindow appId="notes" title="Notes" onClose={onClose}>
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
        <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Notes</h2>
        <p className="text-sm text-gray-400 text-center max-w-xs">
          AI-powered note-taking app coming soon. Capture ideas and let AI help organize your thoughts.
        </p>
      </div>
    </AppWindow>
  );
}

type UtilityView = "mailing-lists";

export function UtilitiesApp({ onClose }: { onClose: () => void }) {
  const [selectedUtility, setSelectedUtility] = useState<UtilityView>("mailing-lists");

  const utilities: { id: UtilityView; icon: any; label: string }[] = [
    { id: "mailing-lists", icon: Mail, label: "Mailing Lists" },
  ];

  return (
    <AppWindow appId="utilities" title="Utilities" onClose={onClose} width="800px" height="600px">
      <div className="flex h-full">
        <div className="w-48 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {utilities.map((utility) => (
                <button
                  key={utility.id}
                  onClick={() => setSelectedUtility(utility.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    selectedUtility === utility.id
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <utility.icon className="w-4 h-4" />
                  {utility.label}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 bg-white dark:bg-gray-900">
          {selectedUtility === "mailing-lists" && <MailingListsUtility />}
        </div>
      </div>
    </AppWindow>
  );
}

function MailingListsUtility() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: mailingLists = [], isLoading } = useMailingLists();
  const createMutation = useCreateMailingList();
  const deleteMutation = useDeleteMailingList();

  const handleCreate = async () => {
    if (!name.trim() || !emailInput.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name and at least one email",
        variant: "destructive",
      });
      return;
    }

    // Parse emails from input (support both comma and semicolon separated)
    const emails = emailInput
      .split(/[,;]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emails.length === 0) {
      toast({
        title: "Error",
        description: "Please provide at least one valid email",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({ name, emails });
      toast({
        title: "Success",
        description: "Mailing list created successfully",
      });
      setName("");
      setEmailInput("");
      setShowCreateForm(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create mailing list",
        variant: "destructive",
      });
    }
  };

  const handleCopyEmails = (list: MailingList) => {
    const emailString = list.emails.join(", ");
    navigator.clipboard.writeText(emailString);
    toast({
      title: "Copied!",
      description: `${list.emails.length} email(s) copied to clipboard`,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Success",
        description: "Mailing list deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete mailing list",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mailing Lists</h2>
        <Button
          size="sm"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New List
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {showCreateForm && (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  List Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Team Members"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Emails (comma or semicolon separated)
                </label>
                <textarea
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="user1@example.com, user2@example.com; user3@example.com"
                  className="w-full min-h-[120px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  size="sm"
                >
                  {createMutation.isPending ? "Creating..." : "Create List"}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setName("");
                    setEmailInput("");
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : mailingLists.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No mailing lists yet</p>
              <p className="text-xs mt-1">Click "New List" to create your first mailing list</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mailingLists.map((list) => (
                <div
                  key={list.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {list.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {list.emails.length} {list.emails.length === 1 ? "Member" : "Members"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyEmails(list)}
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(list.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {list.emails.slice(0, 3).map((email, idx) => (
                      <div key={idx}>{email}</div>
                    ))}
                    {list.emails.length > 3 && (
                      <div className="text-gray-500 dark:text-gray-500">
                        +{list.emails.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
