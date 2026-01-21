import { useState, useEffect, useCallback } from "react";
import { useUpdateFolderItem } from "@/hooks/use-folder-items";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import type { FolderItem } from "@shared/schema";

interface EditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: FolderItem;
  folderId: string;
}

export function EditNoteDialog({ open, onOpenChange, note, folderId }: EditNoteDialogProps) {
  const [content, setContent] = useState(note.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const { mutate } = useUpdateFolderItem(folderId);

  // Reset content when note changes
  useEffect(() => {
    setContent(note.content || "");
  }, [note]);

  // Debounced auto-save
  useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(() => {
      if (content !== note.content) {
        setIsSaving(true);
        mutate(
          { itemId: note.id, content },
          {
            onSettled: () => {
              setIsSaving(false);
            },
          }
        );
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [content, note.content, note.id, mutate, open]);

  const handleSave = useCallback(() => {
    if (content !== note.content) {
      setIsSaving(true);
      mutate(
        { itemId: note.id, content },
        {
          onSuccess: () => {
            setIsSaving(false);
            onOpenChange(false);
          },
          onError: () => {
            setIsSaving(false);
          },
        }
      );
    } else {
      onOpenChange(false);
    }
  }, [content, note.content, note.id, mutate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 h-[600px] flex flex-col">
        <div className="win95-titlebar flex items-center justify-between px-2">
          <DialogTitle className="text-xs font-bold text-white">{note.name} - Notepad</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white hover:bg-blue-600 w-4 h-4 flex items-center justify-center text-xs"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1 flex flex-col bg-win95-gray">
          {/* Toolbar */}
          <div className="flex items-center gap-2 p-2 border-b border-gray-400">
            <Button
              onClick={handleSave}
              size="sm"
              className="text-xs"
              disabled={isSaving}
            >
              <Save className="w-3 h-3 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Close
            </Button>
            {isSaving && (
              <span className="text-xs text-gray-600 ml-2">Auto-saving...</span>
            )}
          </div>

          {/* Notepad area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full p-3 font-mono text-sm bg-white border-0 resize-none focus:outline-none"
            style={{ fontFamily: 'Courier New, monospace' }}
            placeholder="Start typing your note..."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
