import { useState } from "react";
import { useCreateBookmarkItem } from "@/hooks/use-folder-items";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
}

export function AddBookmarkDialog({ open, onOpenChange, folderId }: AddBookmarkDialogProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const { mutate, isPending } = useCreateBookmarkItem(folderId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    mutate(
      { name, url, x: 0, y: 0 },
      {
        onSuccess: () => {
          setName("");
          setUrl("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0">
        <div className="win95-titlebar">
          <DialogTitle className="text-xs font-bold text-white">Add Bookmark</DialogTitle>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-win95-gray">
          <div className="space-y-2">
            <label className="text-xs font-medium">Name:</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bookmark Name"
              className="text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">URL:</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="text-sm"
              type="url"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={isPending || !name.trim() || !url.trim()}
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
