import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type FolderInput, type FolderUpdateInput } from "@shared/routes";

// GET /api/folders
export function useFolders() {
  return useQuery({
    queryKey: [api.folders.list.path],
    queryFn: async () => {
      const res = await fetch(api.folders.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return api.folders.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/folders/:id
export function useFolder(id: number) {
  return useQuery({
    queryKey: [api.folders.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.folders.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch folder");
      return api.folders.get.responses[200].parse(await res.json());
    },
  });
}

// POST /api/folders
export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FolderInput) => {
      const res = await fetch(api.folders.create.path, {
        method: api.folders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.folders.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create folder");
      }
      return api.folders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.folders.list.path] });
    },
  });
}

// PUT /api/folders/:id
export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & FolderUpdateInput) => {
      const url = buildUrl(api.folders.update.path, { id });
      const res = await fetch(url, {
        method: api.folders.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.folders.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update folder");
      }
      return api.folders.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.folders.list.path] });
    },
  });
}

// DELETE /api/folders/:id
export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.folders.delete.path, { id });
      const res = await fetch(url, {
        method: api.folders.delete.method,
        credentials: "include",
      });
      
      if (!res.ok && res.status !== 404) {
        throw new Error("Failed to delete folder");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.folders.list.path] });
    },
  });
}
