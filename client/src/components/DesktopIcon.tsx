import { Folder, Check, X } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";

interface DesktopIconProps {
  id: string;
  name: string;
  x?: number;
  y?: number;
  selected?: boolean;
  isRenaming?: boolean;
  onSelect?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onRenameSubmit?: (newName: string) => void;
  onRenameCancel?: () => void;
}

export function DesktopIcon({
  id,
  name,
  selected,
  isRenaming,
  onSelect,
  onContextMenu,
  onRenameSubmit,
  onRenameCancel
}: DesktopIconProps) {
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      setEditValue(name);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [isRenaming, name]);

  const handleSubmit = () => {
    if (editValue.trim() && editValue !== name) {
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

  const iconContent = (
    <div
      onClick={(e) => {
        if (!isRenaming) {
          e.stopPropagation();
          onSelect?.();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e);
      }}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded w-24 gap-1 transition-all duration-200",
        !isRenaming && "cursor-pointer group hover:scale-105 active:scale-95",
        selected ? "bg-white/20 backdrop-blur-sm border border-white/20 shadow-sm" : "hover:bg-white/10"
      )}
    >
      <div className="relative">
        <div className="text-blue-500 drop-shadow-lg filter">
           <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M22 19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V5C2 3.9 2.9 3 4 3H9L11 5H20C21.1 5 22 5.9 22 7V19Z" />
            </svg>
        </div>
      </div>

      {isRenaming ? (
        <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            className="h-6 text-xs px-1 bg-white text-black"
            data-testid={`input-rename-folder-${id}`}
          />
        </div>
      ) : (
        <span className={cn(
          "text-xs font-medium text-white text-center break-words w-full px-1 py-0.5 rounded text-shadow leading-tight",
          selected ? "bg-blue-600/80 text-white" : ""
        )}>
          {name}
        </span>
      )}
    </div>
  );

  if (isRenaming) {
    return iconContent;
  }

  return (
    <Link href={`/${name}`}>
      {iconContent}
    </Link>
  );
}
