import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertVaultItem } from "@shared/routes";

// GET /api/vault
export function useVaultItems() {
  return useQuery({
    queryKey: [api.vault.list.path],
    queryFn: async () => {
      const res = await fetch(api.vault.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vault items");
      return api.vault.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/vault/:id
export function useVaultItem(id: string) {
  return useQuery({
    queryKey: [api.vault.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.vault.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch vault item");
      return api.vault.get.responses[200].parse(await res.json());
    },
  });
}

// POST /api/vault
export function useCreateVaultItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertVaultItem) => {
      const res = await fetch(api.vault.create.path, {
        method: api.vault.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.vault.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create vault item");
      }
      return api.vault.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vault.list.path] });
    },
  });
}

// PUT /api/vault/:id
export function useUpdateVaultItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertVaultItem>) => {
      const url = buildUrl(api.vault.update.path, { id });
      const res = await fetch(url, {
        method: api.vault.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.vault.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update vault item");
      }
      return api.vault.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vault.list.path] });
    },
  });
}

// DELETE /api/vault/:id
export function useDeleteVaultItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.vault.delete.path, { id });
      const res = await fetch(url, {
        method: api.vault.delete.method,
        credentials: "include",
      });

      if (!res.ok && res.status !== 404) {
        throw new Error("Failed to delete vault item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vault.list.path] });
    },
  });
}
