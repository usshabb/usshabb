import { FileText, StickyNote, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface DockProps {
  onOpenApp: (appName: string) => void;
}

const apps = [
  { id: "docs", name: "Docs", icon: FileText, color: "text-blue-500" },
  { id: "notes", name: "Notes", icon: StickyNote, color: "text-yellow-500" },
  { id: "utilities", name: "Utilities", icon: Wrench, color: "text-gray-500" },
];

export function Dock({ onOpenApp }: DockProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-end gap-2 px-3 py-2 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/20 shadow-2xl">
        {apps.map((app) => (
          <button
            key={app.id}
            onClick={() => onOpenApp(app.id)}
            className="group flex flex-col items-center"
            data-testid={`dock-app-${app.id}`}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center bg-white/80 shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-2 group-active:scale-95",
              "border border-white/50"
            )}>
              <app.icon className={cn("w-7 h-7", app.color)} />
            </div>
            <span className="text-[10px] text-white font-medium mt-1 drop-shadow-md">{app.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
