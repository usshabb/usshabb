import { useState } from "react";
import { MenuBar } from "@/components/MenuBar";
import { DesktopIcon } from "@/components/DesktopIcon";
import { ContextMenu } from "@/components/ContextMenu";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { useFolders, useDeleteFolder } from "@/hooks/use-folders";
import { Loader2 } from "lucide-react";

export default function Desktop() {
  const { data: folders, isLoading } = useFolders();
  const deleteFolder = useDeleteFolder();
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetType: 'desktop' | 'folder';
    folderId: number | null;
  }>({ visible: false, x: 0, y: 0, targetType: 'desktop', folderId: null });

  // Dialog State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  const handleFolderContextMenu = (e: React.MouseEvent, folderId: number) => {
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

  const handleDesktopClick = () => {
    setSelectedFolderId(null);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden relative select-none"
      onContextMenu={handleContextMenu}
      onClick={handleDesktopClick}
    >
      {/* Abstract Gradient Wallpaper */}
      <div 
        className="absolute inset-0 bg-cover bg-center -z-10 transform scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop')`
        }}
      />
      
      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/10 -z-10" />

      <MenuBar />

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
              onSelect={() => setSelectedFolderId(folder.id)}
              onContextMenu={(e) => handleFolderContextMenu(e, folder.id)}
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
        onDelete={handleDeleteFolder}
      />

      <CreateFolderDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  );
}
