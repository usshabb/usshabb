import { FileText, StickyNote, Wrench, Key } from "lucide-react";
import { cn } from "@/lib/utils";

interface DockProps {
  onOpenApp: (appName: string) => void;
}

const apps = [
  { id: "docs", name: "Docs", icon: FileText, color: "text-blue-500" },
  { id: "notes", name: "Notes", icon: StickyNote, color: "text-yellow-500" },
  { id: "utilities", name: "Utilities", icon: Wrench, color: "text-gray-500" },
  { id: "vault", name: "Vault", icon: Key, color: "text-green-500" },
];

export function Dock({ onOpenApp }: DockProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-10 bg-win95-gray border-t-2 border-t-white flex items-center px-2 gap-1" style={{ borderTop: '2px solid #ffffff', boxShadow: 'inset 0 2px 0 #dfdfdf' }}>
      {apps.map((app) => (
        <button
          key={app.id}
          onClick={() => onOpenApp(app.id)}
          className="win95-button flex items-center gap-2 h-8 px-3"
          data-testid={`dock-app-${app.id}`}
        >
          <app.icon className={cn("w-4 h-4", app.color)} />
          <span className="text-xs font-medium">{app.name}</span>
        </button>
      ))}
    </div>
  );
}
