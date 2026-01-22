import { useState } from "react";
import { MenuBar } from "@/components/MenuBar";
import { DesktopIcon } from "@/components/DesktopIcon";
import { ContextMenu } from "@/components/ContextMenu";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { Dock } from "@/components/Dock";
import { DocsApp, NotesApp, UtilitiesApp, VaultApp, FolderWindow } from "@/components/AppWindow";
import { Clippy } from "@/components/Clippy";
import { StageManager } from "@/components/StageManager";
import { useFolders, useDeleteFolder, useUpdateFolder } from "@/hooks/use-folders";
import { Loader2 } from "lucide-react";

export default function Desktop({ onLogout }: { onLogout: () => void }) {
  const { data: folders, isLoading } = useFolders();
  const deleteFolder = useDeleteFolder();
  const updateFolder = useUpdateFolder();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);

  // Open Apps State
  const [openApps, setOpenApps] = useState<Set<string>>(new Set());
  const [minimizedApps, setMinimizedApps] = useState<Set<string>>(new Set());
  const [focusedApp, setFocusedApp] = useState<string | null>(null);

  // Open Folders State (for folders opened as windows)
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [minimizedFolders, setMinimizedFolders] = useState<Set<string>>(new Set());
  const [focusedFolder, setFocusedFolder] = useState<string | null>(null);

  // Z-index management for window stacking
  const [zIndexCounter, setZIndexCounter] = useState(30);
  const [windowZIndexes, setWindowZIndexes] = useState<Record<string, number>>({});

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetType: 'desktop' | 'folder';
    folderId: string | null;
  }>({ visible: false, x: 0, y: 0, targetType: 'desktop', folderId: null });

  // Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleOpenApp = (appId: string) => {
    setOpenApps(prev => new Set(prev).add(appId));
    setMinimizedApps(prev => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
    handleFocusApp(appId);
  };

  const handleCloseApp = (appId: string) => {
    setOpenApps(prev => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
    setMinimizedApps(prev => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
    if (focusedApp === appId) {
      setFocusedApp(null);
    }
  };

  const handleMinimizeApp = (appId: string) => {
    setMinimizedApps(prev => new Set(prev).add(appId));
    if (focusedApp === appId) {
      setFocusedApp(null);
    }
  };

  const handleRestoreApp = (appId: string) => {
    setMinimizedApps(prev => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
    handleFocusApp(appId);
  };

  const handleFocusApp = (appId: string) => {
    setFocusedApp(appId);
    setFocusedFolder(null);
    setZIndexCounter(prev => prev + 1);
    setWindowZIndexes(prev => ({ ...prev, [`app-${appId}`]: zIndexCounter + 1 }));
  };

  const handleOpenFolder = (folderId: string) => {
    setOpenFolders(prev => new Set(prev).add(folderId));
    setMinimizedFolders(prev => {
      const next = new Set(prev);
      next.delete(folderId);
      return next;
    });
    handleFocusFolder(folderId);
  };

  const handleCloseFolder = (folderId: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      next.delete(folderId);
      return next;
    });
    setMinimizedFolders(prev => {
      const next = new Set(prev);
      next.delete(folderId);
      return next;
    });
    if (focusedFolder === folderId) {
      setFocusedFolder(null);
    }
  };

  const handleMinimizeFolder = (folderId: string) => {
    setMinimizedFolders(prev => new Set(prev).add(folderId));
    if (focusedFolder === folderId) {
      setFocusedFolder(null);
    }
  };

  const handleRestoreFolder = (folderId: string) => {
    setMinimizedFolders(prev => {
      const next = new Set(prev);
      next.delete(folderId);
      return next;
    });
    handleFocusFolder(folderId);
  };

  const handleFocusFolder = (folderId: string) => {
    setFocusedFolder(folderId);
    setFocusedApp(null);
    setZIndexCounter(prev => prev + 1);
    setWindowZIndexes(prev => ({ ...prev, [`folder-${folderId}`]: zIndexCounter + 1 }));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetType: 'desktop',
      folderId: null,
    });
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folderId: string) => {
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetType: 'folder',
      folderId,
    });
  };

  const handleDeleteFolder = () => {
    if (contextMenu.folderId) {
      deleteFolder.mutate(contextMenu.folderId);
    }
  };

  const handleRenameFolder = () => {
    if (contextMenu.folderId) {
      setRenamingFolderId(contextMenu.folderId);
    }
  };

  const handleRenameSubmit = (folderId: string, newName: string) => {
    updateFolder.mutate(
      { id: folderId, name: newName },
      {
        onSuccess: () => {
          setRenamingFolderId(null);
        },
        onError: () => {
          setRenamingFolderId(null);
        }
      }
    );
  };

  const handleRenameCancel = () => {
    setRenamingFolderId(null);
  };

  const handleDesktopClick = () => {
    setSelectedFolderId(null);
    setRenamingFolderId(null);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative select-none win95-desktop"
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
    >

      <MenuBar onLogout={onLogout} />

      {/* Desktop Grid Area */}
      <div className="pt-12 px-4 h-full w-full grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] grid-rows-[repeat(auto-fill,minmax(100px,1fr))] gap-4 content-start items-start justify-items-center">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center h-32 text-white/50">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          folders?.map((folder) => (
            <DesktopIcon
              key={folder.id}
              id={folder.id}
              name={folder.name}
              selected={selectedFolderId === folder.id}
              isRenaming={renamingFolderId === folder.id}
              onSelect={() => setSelectedFolderId(folder.id)}
              onOpen={() => handleOpenFolder(folder.id)}
              onContextMenu={(e) => handleFolderContextMenu(e, folder.id)}
              onRenameSubmit={(newName) => handleRenameSubmit(folder.id, newName)}
              onRenameCancel={handleRenameCancel}
            />
          ))
        )}
      </div>

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        targetType={contextMenu.targetType}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        onNewFolder={() => setIsCreateDialogOpen(true)}
        onRename={handleRenameFolder}
        onDelete={handleDeleteFolder}
      />

      <CreateFolderDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />

      {/* App Windows */}
      {openApps.has("docs") && (
        <DocsApp
          onClose={() => handleCloseApp("docs")}
          onMinimize={() => handleMinimizeApp("docs")}
          onFocus={() => handleFocusApp("docs")}
          isMinimized={minimizedApps.has("docs")}
          isFocused={focusedApp === "docs"}
          zIndex={windowZIndexes["app-docs"] || 30}
        />
      )}
      {openApps.has("notes") && (
        <NotesApp
          onClose={() => handleCloseApp("notes")}
          onMinimize={() => handleMinimizeApp("notes")}
          onFocus={() => handleFocusApp("notes")}
          isMinimized={minimizedApps.has("notes")}
          isFocused={focusedApp === "notes"}
          zIndex={windowZIndexes["app-notes"] || 30}
        />
      )}
      {openApps.has("utilities") && (
        <UtilitiesApp
          onClose={() => handleCloseApp("utilities")}
          onMinimize={() => handleMinimizeApp("utilities")}
          onFocus={() => handleFocusApp("utilities")}
          isMinimized={minimizedApps.has("utilities")}
          isFocused={focusedApp === "utilities"}
          zIndex={windowZIndexes["app-utilities"] || 30}
        />
      )}
      {openApps.has("vault") && (
        <VaultApp
          onClose={() => handleCloseApp("vault")}
          onMinimize={() => handleMinimizeApp("vault")}
          onFocus={() => handleFocusApp("vault")}
          isMinimized={minimizedApps.has("vault")}
          isFocused={focusedApp === "vault"}
          zIndex={windowZIndexes["app-vault"] || 30}
        />
      )}

      {/* Folder Windows */}
      {folders?.filter(folder => openFolders.has(folder.id)).map(folder => (
        <FolderWindow
          key={folder.id}
          folderId={folder.id}
          folderName={folder.name}
          onClose={() => handleCloseFolder(folder.id)}
          onMinimize={() => handleMinimizeFolder(folder.id)}
          onFocus={() => handleFocusFolder(folder.id)}
          isMinimized={minimizedFolders.has(folder.id)}
          isFocused={focusedFolder === folder.id}
          zIndex={windowZIndexes[`folder-${folder.id}`] || 30}
        />
      ))}

      {/* Clippy Assistant */}
      <Clippy />

      {/* Stage Manager */}
      <StageManager
        openApps={openApps}
        minimizedApps={minimizedApps}
        focusedApp={focusedApp}
        onRestoreApp={handleRestoreApp}
        onFocusApp={handleFocusApp}
        openFolders={openFolders}
        minimizedFolders={minimizedFolders}
        focusedFolder={focusedFolder}
        folders={folders || []}
        onRestoreFolder={handleRestoreFolder}
        onFocusFolder={handleFocusFolder}
      />

      {/* Dock */}
      <Dock onOpenApp={handleOpenApp} />
    </div>
  );
}
