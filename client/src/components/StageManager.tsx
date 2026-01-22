import { useState } from "react";
import { FileText, StickyNote, Wrench, Key, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Folder as FolderType } from "@shared/schema";

interface StageManagerProps {
  openApps: Set<string>;
  minimizedApps: Set<string>;
  focusedApp: string | null;
  onRestoreApp: (appId: string) => void;
  onFocusApp: (appId: string) => void;
  openFolders: Set<string>;
  minimizedFolders: Set<string>;
  focusedFolder: string | null;
  folders: FolderType[];
  onRestoreFolder: (folderId: string) => void;
  onFocusFolder: (folderId: string) => void;
}

const appConfig: Record<string, { icon: any; title: string; color: string }> = {
  docs: { icon: FileText, title: "Docs", color: "bg-blue-500" },
  notes: { icon: StickyNote, title: "Notes", color: "bg-yellow-500" },
  utilities: { icon: Wrench, title: "Utilities", color: "bg-purple-500" },
  vault: { icon: Key, title: "Vault", color: "bg-green-500" },
};

export function StageManager({
  openApps,
  minimizedApps,
  focusedApp,
  onRestoreApp,
  onFocusApp,
  openFolders,
  minimizedFolders,
  focusedFolder,
  folders,
  onRestoreFolder,
  onFocusFolder,
}: StageManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openAppsList = Array.from(openApps);
  const openFoldersList = Array.from(openFolders);

  // Combine apps and folders into a single list
  const allItems = [
    ...openFoldersList.map(folderId => {
      const folder = folders.find(f => f.id === folderId);
      return { type: 'folder' as const, id: folderId, name: folder?.name || 'Unknown' };
    }),
    ...openAppsList.map(id => ({ type: 'app' as const, id, name: id }))
  ];

  if (allItems.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed left-2 top-1/2 -translate-y-1/2 z-40"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {!isExpanded ? (
        // Dots view
        <div className="flex flex-col gap-2 bg-win95-gray/90 backdrop-blur-sm p-2 rounded-lg win95-window shadow-lg">
          {allItems.map((item) => {
            if (item.type === 'folder') {
              const isMinimized = minimizedFolders.has(item.id);
              const isFocused = focusedFolder === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isMinimized) {
                      onRestoreFolder(item.id);
                    } else {
                      onFocusFolder(item.id);
                    }
                  }}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all bg-amber-500",
                    isFocused && !isMinimized ? "ring-2 ring-white ring-offset-1" : "",
                    isMinimized ? "opacity-50" : "opacity-100"
                  )}
                  title={item.name}
                />
              );
            }

            const config = appConfig[item.id];
            const isMinimized = minimizedApps.has(item.id);
            const isFocused = focusedApp === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isMinimized) {
                    onRestoreApp(item.id);
                  } else {
                    onFocusApp(item.id);
                  }
                }}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  config.color,
                  isFocused && !isMinimized ? "ring-2 ring-white ring-offset-1" : "",
                  isMinimized ? "opacity-50" : "opacity-100"
                )}
                title={config.title}
              />
            );
          })}
        </div>
      ) : (
        // Expanded view
        <div className="flex flex-col gap-2 bg-win95-gray/95 backdrop-blur-md p-3 rounded-lg win95-window shadow-2xl min-w-[200px]">
          {allItems.map((item) => {
            if (item.type === 'folder') {
              const isMinimized = minimizedFolders.has(item.id);
              const isFocused = focusedFolder === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isMinimized) {
                      onRestoreFolder(item.id);
                    } else {
                      onFocusFolder(item.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all win95-button",
                    isFocused && !isMinimized
                      ? "bg-win95-blue text-white"
                      : "bg-white hover:bg-gray-100",
                    isMinimized ? "opacity-60" : "opacity-100"
                  )}
                >
                  <div className="w-8 h-8 rounded-md bg-amber-500 flex items-center justify-center">
                    <Folder className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{item.name}</div>
                    {isMinimized && (
                      <div className="text-xs text-gray-500">Minimized</div>
                    )}
                  </div>
                </button>
              );
            }

            const config = appConfig[item.id];
            const Icon = config.icon;
            const isMinimized = minimizedApps.has(item.id);
            const isFocused = focusedApp === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isMinimized) {
                    onRestoreApp(item.id);
                  } else {
                    onFocusApp(item.id);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all win95-button",
                  isFocused && !isMinimized
                    ? "bg-win95-blue text-white"
                    : "bg-white hover:bg-gray-100",
                  isMinimized ? "opacity-60" : "opacity-100"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center",
                    config.color
                  )}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{config.title}</div>
                  {isMinimized && (
                    <div className="text-xs text-gray-500">Minimized</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
