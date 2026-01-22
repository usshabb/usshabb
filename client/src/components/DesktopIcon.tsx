import { Folder, Check, X } from "lucide-react";
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
  onOpen?: () => void;
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
  onOpen,
  onContextMenu,
  onRenameSubmit,
  onRenameCancel
}: DesktopIconProps) {
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastClickTime, setLastClickTime] = useState(0);

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

  const handleClick = (e: React.MouseEvent) => {
    if (!isRenaming) {
      e.stopPropagation();
      const now = Date.now();
      if (now - lastClickTime < 500) {
        // Double click
        onOpen?.();
      } else {
        // Single click
        onSelect?.();
      }
      setLastClickTime(now);
    }
  };

  const iconContent = (
    <div
      onClick={handleClick}
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
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Folder back */}
          <path d="M4 12 L4 36 L40 36 L44 32 L44 12 Z" fill="#0066CC" stroke="#000000" strokeWidth="1.5"/>
          {/* Folder tab */}
          <path d="M4 12 L4 8 L18 8 L20 12 Z" fill="#0066CC" stroke="#000000" strokeWidth="1.5"/>
          {/* 3D highlight top */}
          <path d="M4 12 L44 12 L44 13 L4 13 Z" fill="#3399FF"/>
          {/* 3D shadow bottom */}
          <path d="M40 36 L44 32 L44 31 L40 35 Z" fill="#004C99"/>
          {/* 3D edge right */}
          <path d="M44 12 L44 32 L43 32 L43 12 Z" fill="#004C99"/>
        </svg>
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
            data-testid={`input-rename-folder-${id}`}
          />
        </div>
      ) : (
        <span className={cn(
          "text-xs font-medium text-black text-center break-words w-full px-1 py-0.5 leading-tight",
          selected ? "bg-win95-blue text-white" : ""
        )}>
          {name}
        </span>
      )}
    </div>
  );

  return iconContent;
}
