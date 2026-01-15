import { useState } from "react";
import { useCreateFolder } from "@/hooks/use-folders";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFolderDialog({ open, onOpenChange }: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const { mutate, isPending } = useCreateFolder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    mutate(
      { name, x: 0, y: 0 },
      {
        onSuccess: () => {
          setName("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-0 sm:max-w-xs shadow-2xl backdrop-blur-xl bg-white/80">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">New Folder</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder Name"
              className="bg-white/50 border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-center text-lg py-6"
              autoFocus
            />
          </div>
          
          <DialogFooter className="sm:justify-between gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-white/50 border-gray-300 hover:bg-white/80"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !name.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
