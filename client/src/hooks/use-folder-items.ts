import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { FolderItem } from "@shared/schema";

// GET /api/folders/:folderId/items
export function useFolderItems(folderId: string) {
  return useQuery({
    queryKey: [api.folderItems.list.path, folderId],
    enabled: !!folderId,
    queryFn: async () => {
      const url = buildUrl(api.folderItems.list.path, { folderId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch folder items");
      return api.folderItems.list.responses[200].parse(await res.json());
    },
  });
}

// POST /api/folders/:folderId/items/file
export function useCreateFileItem(folderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, x, y }: { file: File; x?: number; y?: number }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (x !== undefined) formData.append('x', x.toString());
      if (y !== undefined) formData.append('y', y.toString());

      const url = buildUrl(api.folderItems.createFile.path, { folderId });
      const res = await fetch(url, {
        method: api.folderItems.createFile.method,
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.folderItems.createFile.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to upload file");
      }
      return api.folderItems.createFile.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.folderItems.list.path, folderId] });
    },
  });
}

// POST /api/folders/:folderId/items/bookmark
export function useCreateBookmarkItem(folderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; url: string; x?: number; y?: number }) => {
      const url = buildUrl(api.folderItems.createBookmark.path, { folderId });
      const res = await fetch(url, {
        method: api.folderItems.createBookmark.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.folderItems.createBookmark.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create bookmark");
      }
      return api.folderItems.createBookmark.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.folderItems.list.path, folderId] });
    },
  });
}

// POST /api/folders/:folderId/items/note
export function useCreateNoteItem(folderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; content?: string; x?: number; y?: number }) => {
      const url = buildUrl(api.folderItems.createNote.path, { folderId });
      const res = await fetch(url, {
        method: api.folderItems.createNote.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.folderItems.createNote.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create note");
      }
      return api.folderItems.createNote.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.folderItems.list.path, folderId] });
    },
  });
}

// PATCH /api/folders/:folderId/items/:itemId
export function useUpdateFolderItem(folderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, ...data }: { itemId: string } & Partial<FolderItem>) => {
      const url = buildUrl(api.folderItems.update.path, { folderId, itemId });
      const res = await fetch(url, {
        method: api.folderItems.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.folderItems.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update folder item");
      }
      return api.folderItems.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.folderItems.list.path, folderId] });
    },
  });
}

// DELETE /api/folders/:folderId/items/:itemId
export function useDeleteFolderItem(folderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const url = buildUrl(api.folderItems.delete.path, { folderId, itemId });
      const res = await fetch(url, {
        method: api.folderItems.delete.method,
        credentials: "include",
      });

      if (!res.ok && res.status !== 404) {
        throw new Error("Failed to delete folder item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.folderItems.list.path, folderId] });
    },
  });
}
