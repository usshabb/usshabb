import { useState } from "react";
import { useCreateNoteItem } from "@/hooks/use-folder-items";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { FolderItem } from "@shared/schema";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  onNoteCreated?: (note: FolderItem) => void;
}

export function CreateNoteDialog({ open, onOpenChange, folderId, onNoteCreated }: CreateNoteDialogProps) {
  const [name, setName] = useState("");
  const { mutate, isPending } = useCreateNoteItem(folderId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    mutate(
      { name, content: "", x: 0, y: 0 },
      {
        onSuccess: (note) => {
          setName("");
          onOpenChange(false);
          onNoteCreated?.(note);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs p-0">
        <div className="win95-titlebar">
          <DialogTitle className="text-xs font-bold text-white">New Note</DialogTitle>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-win95-gray">
          <div className="space-y-2">
            <label className="text-xs font-medium">Note Name:</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Note Name"
              className="text-sm"
              autoFocus
            />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              size="sm"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="sm"
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
