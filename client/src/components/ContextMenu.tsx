import { useEffect, useRef } from "react";
import { FolderPlus, Trash2, Pencil, Link as LinkIcon, StickyNote, Upload, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  onNewFolder?: () => void;
  onRename?: () => void; // Optional rename action if a folder was right-clicked
  onDelete?: () => void; // Optional delete action if an item was right-clicked
  targetType?: 'desktop' | 'folder' | 'folder-view' | 'folder-item';
  // Folder-view specific actions
  onAddBookmark?: () => void;
  onAddNote?: () => void;
  onUploadFile?: () => void;
  // Folder-item specific actions
  onOpen?: () => void;
}

export function ContextMenu({
  x,
  y,
  visible,
  onClose,
  onNewFolder,
  onRename,
  onDelete,
  targetType = 'desktop',
  onAddBookmark,
  onAddNote,
  onUploadFile,
  onOpen
}: ContextMenuProps) {
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
      style={{ top: y, left: x, boxShadow: '4px 4px 0 rgba(0,0,0,0.5)' }}
      className="fixed z-50 w-48 py-1 win95-window"
    >
      <div className="space-y-0">
        {/* Desktop menu */}
        {targetType === 'desktop' && onNewFolder && (
          <button
            onClick={() => {
              onNewFolder();
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-win95-blue hover:text-white flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        )}

        {/* Folder-view menu (inside a folder) */}
        {targetType === 'folder-view' && (
          <>
            {onUploadFile && (
              <button
                onClick={() => {
                  onUploadFile();
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-win95-blue hover:text-white flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>
            )}
            {onAddBookmark && (
              <button
                onClick={() => {
                  onAddBookmark();
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-win95-blue hover:text-white flex items-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Add Bookmark</span>
              </button>
            )}
            {onAddNote && (
              <button
                onClick={() => {
                  onAddNote();
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-win95-blue hover:text-white flex items-center gap-2"
              >
                <StickyNote className="w-4 h-4" />
                <span>Add Note</span>
              </button>
            )}
          </>
        )}

        {/* Folder or folder-item menu */}
        {(targetType === 'folder' || targetType === 'folder-item') && (onRename || onDelete || onOpen) && (
          <>
            {onOpen && (
              <button
                onClick={() => {
                  onOpen();
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-win95-blue hover:text-white flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Open</span>
              </button>
            )}
            {(onRename || onDelete) && onOpen && (
              <div className="h-px border-t border-win95-dark-gray border-b border-white my-0.5" />
            )}
            {onRename && (
              <button
                onClick={() => {
                  onRename();
                  onClose();
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-win95-blue hover:text-white flex items-center gap-2"
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
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-win95-blue hover:text-white flex items-center gap-2 text-black"
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
