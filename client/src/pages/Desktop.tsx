import { useState } from "react";
import { MenuBar } from "@/components/MenuBar";
import { DesktopIcon } from "@/components/DesktopIcon";
import { ContextMenu } from "@/components/ContextMenu";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { Dock } from "@/components/Dock";
import { DocsApp, NotesApp, UtilitiesApp } from "@/components/AppWindow";
import { Clippy } from "@/components/Clippy";
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
  };

  const handleCloseApp = (appId: string) => {
    setOpenApps(prev => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
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
      {openApps.has("docs") && <DocsApp onClose={() => handleCloseApp("docs")} />}
      {openApps.has("notes") && <NotesApp onClose={() => handleCloseApp("notes")} />}
      {openApps.has("utilities") && <UtilitiesApp onClose={() => handleCloseApp("utilities")} />}

      {/* Clippy Assistant */}
      <Clippy />

      {/* Dock */}
      <Dock onOpenApp={handleOpenApp} />
    </div>
  );
}
