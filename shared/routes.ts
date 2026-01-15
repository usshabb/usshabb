
import { z } from 'zod';
import { insertFolderSchema, insertMailingListSchema, type Folder, type Document, type DocMessage, type MailingList } from './schema';

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
