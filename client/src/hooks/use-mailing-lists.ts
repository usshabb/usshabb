import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertMailingList } from "@shared/routes";

// GET /api/mailing-lists
export function useMailingLists() {
  return useQuery({
    queryKey: [api.mailingLists.list.path],
    queryFn: async () => {
      const res = await fetch(api.mailingLists.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch mailing lists");
      return api.mailingLists.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/mailing-lists/:id
export function useMailingList(id: string) {
  return useQuery({
    queryKey: [api.mailingLists.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.mailingLists.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch mailing list");
      return api.mailingLists.get.responses[200].parse(await res.json());
    },
  });
}

// POST /api/mailing-lists
export function useCreateMailingList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMailingList) => {
      const res = await fetch(api.mailingLists.create.path, {
        method: api.mailingLists.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.mailingLists.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create mailing list");
      }
      return api.mailingLists.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mailingLists.list.path] });
    },
  });
}

// PUT /api/mailing-lists/:id
export function useUpdateMailingList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertMailingList>) => {
      const url = buildUrl(api.mailingLists.update.path, { id });
      const res = await fetch(url, {
        method: api.mailingLists.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.mailingLists.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update mailing list");
      }
      return api.mailingLists.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mailingLists.list.path] });
    },
  });
}

// DELETE /api/mailing-lists/:id
export function useDeleteMailingList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.mailingLists.delete.path, { id });
      const res = await fetch(url, {
        method: api.mailingLists.delete.method,
        credentials: "include",
      });

      if (!res.ok && res.status !== 404) {
        throw new Error("Failed to delete mailing list");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mailingLists.list.path] });
    },
  });
}
