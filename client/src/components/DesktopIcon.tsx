import { Folder } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface DesktopIconProps {
  id: number;
  name: string;
  x?: number;
  y?: number;
  selected?: boolean;
  onSelect?: () => void;
}

export function DesktopIcon({ id, name, selected, onSelect }: DesktopIconProps) {
  return (
    <Link href={`/${name}`}>
      <div 
        onClick={(e) => {
          e.stopPropagation(); // Prevent desktop click
          onSelect?.();
        }}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded w-24 gap-1 cursor-pointer group transition-all duration-200 hover:scale-105 active:scale-95",
          selected ? "bg-white/20 backdrop-blur-sm border border-white/20 shadow-sm" : "hover:bg-white/10"
        )}
      >
        <div className="relative">
          {/* Main Folder Icon */}
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
        
        <span className={cn(
          "text-xs font-medium text-white text-center break-words w-full px-1 py-0.5 rounded text-shadow leading-tight",
          selected ? "bg-blue-600/80 text-white" : ""
        )}>
          {name}
        </span>
      </div>
    </Link>
  );
}
