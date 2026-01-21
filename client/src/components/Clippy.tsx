import { useState, useEffect, useCallback } from "react";
import { X, Send } from "lucide-react";
import { api } from "@shared/routes";

const CLIPPY_MESSAGES = [
  "It looks like you're organizing your folders. Would you like help?",
  "Hi! I'm here to help you navigate your desktop.",
  "Did you know you can right-click to create new folders?",
  "Double-click a folder to open it!",
  "Need assistance? Just let me know!",
];

export function Clippy() {
  const [isVisible, setIsVisible] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 250 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<"tips" | "question">("tips"); // tips or question mode
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingContext, setIsUpdatingContext] = useState(false);

  if (!isVisible) return null;

  const cycleMessage = () => {
    setMessageIndex((prev) => (prev + 1) % CLIPPY_MESSAGES.length);
  };

  const handleUpdateContext = async () => {
    setIsUpdatingContext(true);

    try {
      const response = await fetch(api.clippy.updateContext.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update context");
      }

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error("Error updating context:", error);
      alert("Failed to update context. Please try again later.");
    } finally {
      setIsUpdatingContext(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setAnswer("");

    try {
      const response = await fetch(api.clippy.ask.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error("Error asking Clippy:", error);
      setAnswer("I'm sorry, I encountered an error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  const resetToTips = () => {
    setMode("tips");
    setQuestion("");
    setAnswer("");
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.clippy-close')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="fixed z-50 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Speech Bubble */}
      <div className="relative mb-2">
        <div
          className="win95-window relative"
          style={{
            width: '280px',
            background: '#ffffd0',
            border: '2px solid #000',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
          }}
        >
          {/* Title Bar */}
          <div
            className="flex items-center justify-between px-1 py-0.5"
            style={{
              background: 'linear-gradient(90deg, #000080, #1084d0)',
              color: '#fff',
            }}
          >
            <span className="text-xs font-bold pl-1">Office Assistant</span>
            <button
              onClick={() => setIsVisible(false)}
              className="clippy-close win95-button w-4 h-4 flex items-center justify-center p-0 hover:bg-red-500"
              style={{ minWidth: '16px', minHeight: '16px' }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Message Content */}
          <div className="p-3">
            {mode === "tips" ? (
              <>
                <p className="text-sm text-black mb-3">
                  {CLIPPY_MESSAGES[messageIndex]}
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setMode("question")}
                    className="win95-button px-3 py-1 text-xs"
                    disabled={isUpdatingContext}
                  >
                    Ask Me
                  </button>
                  <button
                    onClick={handleUpdateContext}
                    className="win95-button px-3 py-1 text-xs"
                    disabled={isUpdatingContext}
                  >
                    {isUpdatingContext ? "Updating..." : "Update Context"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {!answer ? (
                  <>
                    <p className="text-sm text-black mb-2">
                      What would you like to know?
                    </p>
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about your folders, documents, etc."
                      disabled={isLoading}
                      className="w-full px-2 py-1 text-xs border-2 border-gray-400 mb-2"
                      style={{
                        borderStyle: "inset",
                        background: "white",
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={resetToTips}
                        className="win95-button px-3 py-1 text-xs"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAskQuestion}
                        disabled={isLoading || !question.trim()}
                        className="win95-button px-3 py-1 text-xs flex items-center gap-1"
                      >
                        {isLoading ? (
                          "Thinking..."
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            Ask
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="text-sm text-black mb-3 max-h-40 overflow-y-auto"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                      }}
                    >
                      {answer}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={resetToTips}
                        className="win95-button px-3 py-1 text-xs"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          setAnswer("");
                          setQuestion("");
                        }}
                        className="win95-button px-3 py-1 text-xs"
                      >
                        Ask Another
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Speech bubble pointer */}
        <div
          className="absolute"
          style={{
            bottom: '-8px',
            left: '30px',
            width: '0',
            height: '0',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #000',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: '-6px',
            left: '31px',
            width: '0',
            height: '0',
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '7px solid #ffffd0',
          }}
        />
      </div>

      {/* Clippy Character */}
      <div className="relative flex items-center justify-center" style={{ height: '120px', width: '100px' }}>
        <svg
          viewBox="0 0 100 120"
          className="w-full h-full"
          style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}
        >
          {/* Paper */}
          <rect x="25" y="30" width="50" height="70" fill="#f0f0f0" stroke="#999" strokeWidth="1" />
          <line x1="30" y1="40" x2="70" y2="40" stroke="#ccc" strokeWidth="1" />
          <line x1="30" y1="50" x2="70" y2="50" stroke="#ccc" strokeWidth="1" />
          <line x1="30" y1="60" x2="70" y2="60" stroke="#ccc" strokeWidth="1" />
          <line x1="30" y1="70" x2="70" y2="70" stroke="#ccc" strokeWidth="1" />
          <line x1="30" y1="80" x2="70" y2="80" stroke="#ccc" strokeWidth="1" />
          <line x1="30" y1="90" x2="70" y2="90" stroke="#ccc" strokeWidth="1" />

          {/* Paperclip Body */}
          <path
            d="M 20 50 Q 10 50 10 65 Q 10 80 25 80 Q 35 80 35 65 L 35 25 Q 35 10 50 10 Q 65 10 65 25 L 65 75 Q 65 85 70 85"
            fill="none"
            stroke="#4169e1"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Eyes */}
          <circle cx="15" cy="15" r="8" fill="white" stroke="#000" strokeWidth="2" />
          <circle cx="45" cy="15" r="8" fill="white" stroke="#000" strokeWidth="2" />
          <circle cx="17" cy="15" r="4" fill="#000" />
          <circle cx="47" cy="15" r="4" fill="#000" />

          {/* Eye highlights */}
          <circle cx="18" cy="13" r="2" fill="white" />
          <circle cx="48" cy="13" r="2" fill="white" />
        </svg>
      </div>
    </div>
  );
}
