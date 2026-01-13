# replit.md

## Overview

A macOS-inspired desktop environment web application featuring a file system interface with folders, document management, and AI-powered document Q&A. The app simulates a desktop experience with draggable folder icons, a dock for launching apps, context menus, and glassmorphism UI effects. Built as a full-stack TypeScript application with React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing (Desktop and FolderView pages)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom glassmorphism effects and macOS-inspired theming
- **Animations**: Framer Motion for smooth window and menu transitions
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx for development, esbuild for production
- **API Design**: RESTful endpoints under `/api/` prefix with Zod schema validation
- **File Handling**: Multer for PDF upload processing with in-memory storage
- **Build Process**: Custom build script bundles server with selective dependency bundling for faster cold starts

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Tables**: 
  - `folders` - Desktop folder entities with position coordinates
  - `documents` - Uploaded PDF documents with extracted text content
  - `docMessages` - Chat messages for document Q&A feature
  - `conversations` and `messages` - General chat storage
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Connection**: pg Pool with `DATABASE_URL` environment variable

### Shared Code Structure
- `shared/schema.ts` - Drizzle table definitions, Zod schemas, and TypeScript types
- `shared/routes.ts` - API contract definitions with path patterns and response schemas
- `shared/models/` - Domain-specific model definitions (chat)

### AI Integrations
Located in `server/replit_integrations/`:
- **Chat**: OpenAI-compatible chat completions with conversation persistence
- **Image**: Image generation using gpt-image-1 model
- **Batch**: Rate-limited batch processing utilities with retry logic

Uses environment variables:
- `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `AI_INTEGRATIONS_OPENAI_API_KEY`

### Development vs Production
- **Development**: Vite dev server with HMR, tsx for TypeScript execution
- **Production**: Static file serving from `dist/public`, bundled server as `dist/index.cjs`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **Session Storage**: connect-pg-simple for Express sessions (if enabled)

### AI Services
- **OpenAI-compatible API**: For chat completions and image generation via Replit AI Integrations
- **PDF Processing**: pdf-parse library for extracting text from uploaded documents

### Frontend Libraries
- **Radix UI**: Full suite of accessible, unstyled UI primitives
- **Lucide React**: Icon library
- **date-fns**: Date formatting for menu bar clock
- **embla-carousel-react**: Carousel functionality
- **react-day-picker**: Calendar component
- **vaul**: Drawer component
- **cmdk**: Command palette component

### Build Tools
- **Vite**: Frontend bundling with React plugin
- **esbuild**: Server bundling for production
- **Tailwind CSS**: Utility-first CSS with PostCSS