
import { z } from 'zod';
import { insertFolderSchema, insertMailingListSchema, insertFolderItemSchema, insertVaultItemSchema, type Folder, type Document, type DocMessage, type MailingList, type FolderItem, type VaultItem } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  folders: {
    list: {
      method: 'GET' as const,
      path: '/api/folders',
      responses: {
        200: z.array(z.custom<Folder>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/folders/:id',
      responses: {
        200: z.custom<Folder>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/folders',
      input: insertFolderSchema,
      responses: {
        201: z.custom<Folder>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/folders/:id',
      input: insertFolderSchema.partial(),
      responses: {
        200: z.custom<Folder>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/folders/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents',
      responses: {
        200: z.array(z.custom<Document>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/documents/:id',
      responses: {
        200: z.custom<Document>(),
        404: errorSchemas.notFound,
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/documents/upload',
      responses: {
        201: z.custom<Document>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/documents/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    rename: {
      method: 'PATCH' as const,
      path: '/api/documents/:id/rename',
      input: z.object({
        name: z.string().min(1).max(100),
      }),
      responses: {
        200: z.custom<Document>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  chat: {
    messages: {
      method: 'GET' as const,
      path: '/api/chat/messages',
      responses: {
        200: z.array(z.custom<DocMessage>()),
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/chat/send',
      input: z.object({
        content: z.string(),
        referencedDocIds: z.array(z.string()).optional(),
      }),
      responses: {
        200: z.object({
          userMessage: z.custom<DocMessage>(),
          aiMessage: z.custom<DocMessage>(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  mailingLists: {
    list: {
      method: 'GET' as const,
      path: '/api/mailing-lists',
      responses: {
        200: z.array(z.custom<MailingList>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/mailing-lists/:id',
      responses: {
        200: z.custom<MailingList>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/mailing-lists',
      input: insertMailingListSchema,
      responses: {
        201: z.custom<MailingList>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/mailing-lists/:id',
      input: insertMailingListSchema.partial(),
      responses: {
        200: z.custom<MailingList>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/mailing-lists/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  folderItems: {
    list: {
      method: 'GET' as const,
      path: '/api/folders/:folderId/items',
      responses: {
        200: z.array(z.custom<FolderItem>()),
      },
    },
    createFile: {
      method: 'POST' as const,
      path: '/api/folders/:folderId/items/file',
      responses: {
        201: z.custom<FolderItem>(),
        400: errorSchemas.validation,
      },
    },
    createBookmark: {
      method: 'POST' as const,
      path: '/api/folders/:folderId/items/bookmark',
      input: z.object({
        name: z.string().min(1, "Name is required"),
        url: z.string().url("Valid URL is required"),
        x: z.number().optional().default(0),
        y: z.number().optional().default(0),
      }),
      responses: {
        201: z.custom<FolderItem>(),
        400: errorSchemas.validation,
      },
    },
    createNote: {
      method: 'POST' as const,
      path: '/api/folders/:folderId/items/note',
      input: z.object({
        name: z.string().min(1, "Name is required"),
        content: z.string().optional().default(""),
        x: z.number().optional().default(0),
        y: z.number().optional().default(0),
      }),
      responses: {
        201: z.custom<FolderItem>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/folders/:folderId/items/:itemId',
      input: insertFolderItemSchema.partial().omit({ folderId: true, type: true }),
      responses: {
        200: z.custom<FolderItem>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/folders/:folderId/items/:itemId',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  clippy: {
    ask: {
      method: 'POST' as const,
      path: '/api/clippy/ask',
      input: z.object({
        question: z.string().min(1, "Question is required"),
      }),
      responses: {
        200: z.object({
          answer: z.string(),
        }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    updateContext: {
      method: 'POST' as const,
      path: '/api/clippy/update-context',
      responses: {
        200: z.object({
          message: z.string(),
        }),
        500: errorSchemas.internal,
      },
    },
  },
  vault: {
    list: {
      method: 'GET' as const,
      path: '/api/vault',
      responses: {
        200: z.array(z.custom<VaultItem>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/vault/:id',
      responses: {
        200: z.custom<VaultItem>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vault',
      input: insertVaultItemSchema,
      responses: {
        201: z.custom<VaultItem>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/vault/:id',
      input: insertVaultItemSchema.partial(),
      responses: {
        200: z.custom<VaultItem>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/vault/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

// ============================================
// URL HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type FolderInput = z.infer<typeof api.folders.create.input>;
export type FolderResponse = z.infer<typeof api.folders.create.responses[201]>;
export type FolderUpdateInput = z.infer<typeof api.folders.update.input>;
export type FoldersListResponse = z.infer<typeof api.folders.list.responses[200]>;
