import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { MenuBar } from "@/components/MenuBar";
import { Button } from "@/components/ui/button";
import { ContextMenu } from "@/components/ContextMenu";
import { FolderItemIcon } from "@/components/FolderItemIcon";
import { AddBookmarkDialog } from "@/components/AddBookmarkDialog";
import { CreateNoteDialog } from "@/components/CreateNoteDialog";
import { EditNoteDialog } from "@/components/EditNoteDialog";
import { useFolders } from "@/hooks/use-folders";
import { useFolderItems, useCreateFileItem, useDeleteFolderItem, useUpdateFolderItem } from "@/hooks/use-folder-items";
import type { FolderItem } from "@shared/schema";

export default function FolderView() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name || "Unknown");

  // Fetch folder to get ID
  const { data: folders = [] } = useFolders();
  const folder = folders.find(f => f.name === decodedName);
  const folderId = folder?.id;

  // Fetch folder items
  const { data: items = [], isLoading } = useFolderItems(folderId || "");
  const createFileMutation = useCreateFileItem(folderId || "");
  const deleteMutation = useDeleteFolderItem(folderId || "");
  const updateMutation = useUpdateFolderItem(folderId || "");

  // State
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetType: 'folder-view' | 'folder-item';
    itemId: string | null;
  }>({ visible: false, x: 0, y: 0, targetType: 'folder-view', itemId: null });

  // Dialog State
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<FolderItem | null>(null);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (!folderId) return;

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      createFileMutation.mutate({ file, x: 0, y: 0 });
    });
  };

  // Context menu handlers
  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetType: 'folder-view',
      itemId: null,
    });
  };

  const handleItemContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetType: 'folder-item',
      itemId,
    });
  };

  // Item handlers
  const handleItemDoubleClick = (item: FolderItem) => {
    if (item.type === 'file' && item.fileUrl) {
      window.open(item.fileUrl, '_blank');
    } else if (item.type === 'bookmark' && item.url) {
      window.open(item.url, '_blank');
    } else if (item.type === 'note') {
      setEditingNote(item);
    }
  };

  const handleDeleteItem = () => {
    if (contextMenu.itemId) {
      deleteMutation.mutate(contextMenu.itemId);
    }
  };

  const handleRenameItem = () => {
    if (contextMenu.itemId) {
      setRenamingItemId(contextMenu.itemId);
    }
  };

  const handleRenameSubmit = (itemId: string, newName: string) => {
    updateMutation.mutate(
      { itemId, name: newName },
      {
        onSuccess: () => {
          setRenamingItemId(null);
        },
        onError: () => {
          setRenamingItemId(null);
        }
      }
    );
  };

  const handleRenameCancel = () => {
    setRenamingItemId(null);
  };

  const handleViewClick = () => {
    setSelectedItemId(null);
    setRenamingItemId(null);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!folderId) return;

    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      createFileMutation.mutate({ file, x: 0, y: 0 });
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!folder) {
    return (
      <div className="h-screen w-screen overflow-hidden relative win95-desktop flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden relative win95-desktop flex flex-col">
      <MenuBar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-5xl h-full max-h-[800px] win95-window flex flex-col overflow-hidden">
          {/* Window Title Bar */}
          <div className="win95-titlebar">
            <span className="text-xs font-bold text-white">{decodedName}</span>
            <div className="flex items-center gap-0.5">
              <button className="w-4 h-4 flex items-center justify-center bg-win95-gray text-black text-xs font-bold win95-button p-0" style={{ minHeight: '16px', padding: '0' }}>
                _
              </button>
              <button className="w-4 h-4 flex items-center justify-center bg-win95-gray text-black text-xs font-bold win95-button p-0" style={{ minHeight: '16px', padding: '0' }}>
                □
              </button>
              <Link href="/">
                <button className="w-4 h-4 flex items-center justify-center bg-win95-gray text-black text-xs font-bold win95-button p-0" style={{ minHeight: '16px', padding: '0' }}>
                  ×
                </button>
              </Link>
            </div>
          </div>

          {/* Window Toolbar */}
          <div className="h-10 bg-win95-gray border-b-2 border-b-white flex items-center px-2 shrink-0" style={{ borderBottom: '2px solid #ffffff', boxShadow: 'inset 0 -1px 0 #808080' }}>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back
                </Button>
              </Link>
            </div>

            <div className="relative hidden sm:block ml-auto">
              <Search className="absolute left-2 top-1.5 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="win95-input pl-7 pr-2 py-0.5 text-xs w-40"
              />
            </div>
          </div>

          {/* Window Content */}
          <div
            className="flex-1 overflow-y-auto bg-white relative"
            onClick={handleViewClick}
            onContextMenu={handleBackgroundContextMenu}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDraggingOver && (
              <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-4 border-dashed border-blue-400 flex items-center justify-center z-10">
                <p className="text-lg font-bold text-blue-600">Drop files here to upload</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-sm">
                  This folder is empty. Right-click to add items or drag files here.
                </p>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-[repeat(auto-fill,96px)] gap-2">
                {items.map((item) => (
                  <FolderItemIcon
                    key={item.id}
                    item={item}
                    selected={selectedItemId === item.id}
                    isRenaming={renamingItemId === item.id}
                    onSelect={() => setSelectedItemId(item.id)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                    onContextMenu={(e) => handleItemContextMenu(e, item.id)}
                    onRenameSubmit={(newName) => handleRenameSubmit(item.id, newName)}
                    onRenameCancel={handleRenameCancel}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="h-6 bg-win95-gray border-t-2 border-t-white px-4 flex items-center text-xs text-black" style={{ borderTop: '2px solid #ffffff', boxShadow: 'inset 0 1px 0 #dfdfdf' }}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        targetType={contextMenu.targetType}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        onAddBookmark={() => setIsAddBookmarkOpen(true)}
        onAddNote={() => setIsCreateNoteOpen(true)}
        onUploadFile={handleUploadFile}
        onOpen={() => {
          const item = items.find(i => i.id === contextMenu.itemId);
          if (item) handleItemDoubleClick(item);
        }}
        onRename={handleRenameItem}
        onDelete={handleDeleteItem}
      />

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Dialogs */}
      {folderId && (
        <>
          <AddBookmarkDialog
            open={isAddBookmarkOpen}
            onOpenChange={setIsAddBookmarkOpen}
            folderId={folderId}
          />
          <CreateNoteDialog
            open={isCreateNoteOpen}
            onOpenChange={setIsCreateNoteOpen}
            folderId={folderId}
            onNoteCreated={(note) => setEditingNote(note)}
          />
          {editingNote && (
            <EditNoteDialog
              open={true}
              onOpenChange={(open) => !open && setEditingNote(null)}
              note={editingNote}
              folderId={folderId}
            />
          )}
        </>
      )}
    </div>
  );
}
