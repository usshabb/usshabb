import { useEffect, useRef } from "react";
import { FolderPlus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  onNewFolder: () => void;
  onRename?: () => void; // Optional rename action if a folder was right-clicked
  onDelete?: () => void; // Optional delete action if an item was right-clicked
  targetType?: 'desktop' | 'folder';
}

export function ContextMenu({ x, y, visible, onClose, onNewFolder, onRename, onDelete, targetType = 'desktop' }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="fixed z-50 w-48 py-1 rounded-lg glass shadow-2xl animate-in fade-in zoom-in-95 duration-100 origin-top-left"
    >
      <div className="px-1 py-1 space-y-0.5">
        <button
          onClick={() => {
            onNewFolder();
            onClose();
          }}
          className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Folder</span>
        </button>

        {targetType === 'folder' && (onRename || onDelete) && (
          <>
            <div className="h-px bg-gray-200/50 my-1 mx-2" />
            {onRename && (
              <button
                onClick={() => {
                  onRename();
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                <span>Rename</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  onDelete();
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
