import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FileText, Upload, Trash2, Send, AtSign, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Document, DocMessage } from "@shared/schema";

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
  const [message, setMessage] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
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
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; referencedDocIds?: number[] }) => {
      return apiRequest('POST', '/api/chat/send', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      setMessage("");
      setSelectedDocs([]);
    },
  });

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setShowMentions(true);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const addDocMention = (doc: Document) => {
    if (!selectedDocs.includes(doc.id)) {
      setSelectedDocs([...selectedDocs, doc.id]);
    }
    setShowMentions(false);
  };

  const removeDocMention = (id: number) => {
    setSelectedDocs(selectedDocs.filter(d => d !== id));
  };

  return (
    <AppWindow appId="docs" title="Docs" onClose={onClose} width="900px" height="600px">
      <div className="flex h-full relative">
        <div className={cn("flex flex-col bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200/50 dark:border-gray-700/50 transition-all", chatOpen ? "w-1/3" : "w-full")}>
          <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              data-testid="button-upload-pdf"
            >
              {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
              Upload PDF
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

          <ScrollArea className="flex-1 p-3">
            {docsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No documents yet</p>
                <p className="text-xs mt-1">Upload a PDF to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50"
                    data-testid={`doc-item-${doc.id}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 truncate">{doc.originalName}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-doc-${doc.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
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

            {showMentions && documents.length > 0 && (
              <div className="absolute bottom-16 left-1/3 right-4 mx-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-48 overflow-auto z-50">
                {documents.map((doc) => (
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
                onChange={(e) => setMessage(e.target.value)}
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
