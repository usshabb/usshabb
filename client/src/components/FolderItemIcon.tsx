import { FileText, Image, Video, File, Archive, Link as LinkIcon, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import type { FolderItem } from "@shared/schema";

interface FolderItemIconProps {
  item: FolderItem;
  selected?: boolean;
  isRenaming?: boolean;
  onSelect?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onRenameSubmit?: (newName: string) => void;
  onRenameCancel?: () => void;
}

function getFileIcon(item: FolderItem) {
  if (item.type === 'bookmark') {
    return item.faviconUrl ? (
      <img src={item.faviconUrl} alt="" className="w-12 h-12 object-contain" />
    ) : (
      <LinkIcon className="w-12 h-12 text-blue-600" />
    );
  }

  if (item.type === 'note') {
    return <StickyNote className="w-12 h-12 text-yellow-400" />;
  }

  // File type
  const mimeType = item.mimeType || '';

  if (mimeType.startsWith('image/')) {
    return <Image className="w-12 h-12 text-purple-600" />;
  }

  if (mimeType.startsWith('video/')) {
    return <Video className="w-12 h-12 text-red-600" />;
  }

  if (mimeType === 'application/pdf') {
    return <FileText className="w-12 h-12 text-red-500" />;
  }

  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gz')) {
    return <Archive className="w-12 h-12 text-orange-600" />;
  }

  return <File className="w-12 h-12 text-gray-600" />;
}

export function FolderItemIcon({
  item,
  selected,
  isRenaming,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onRenameSubmit,
  onRenameCancel
}: FolderItemIconProps) {
  const [editValue, setEditValue] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      setEditValue(item.name);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [isRenaming, item.name]);

  const handleSubmit = () => {
    if (editValue.trim() && editValue !== item.name) {
      onRenameSubmit?.(editValue.trim());
    } else {
      onRenameCancel?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onRenameCancel?.();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (!isRenaming) {
          e.stopPropagation();
          onSelect?.();
        }
      }}
      onDoubleClick={(e) => {
        if (!isRenaming) {
          e.stopPropagation();
          onDoubleClick?.();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e);
      }}
      className={cn(
        "flex flex-col items-center justify-center p-2 w-24 gap-1",
        !isRenaming && "cursor-pointer",
        selected ? "bg-win95-blue text-white" : ""
      )}
    >
      <div className="relative">
        {getFileIcon(item)}
      </div>

      {isRenaming ? (
        <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            className="h-6 text-xs px-1 bg-white text-black border border-black rounded-none"
          />
        </div>
      ) : (
        <span className={cn(
          "text-xs font-medium text-black text-center break-words w-full px-1 py-0.5 leading-tight",
          selected ? "bg-win95-blue text-white" : ""
        )}>
          {item.name}
        </span>
      )}
    </div>
  );
}
