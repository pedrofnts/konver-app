# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server on port 8080
- `npm run build` - Production build with Vite
- `npm run build:dev` - Development mode build
- `npm run lint` - ESLint checking
- `npm run preview` - Preview production build locally

### TypeScript Checking
Use `npx tsc --noEmit` to type-check without emitting files.

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom configurations
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **State Management**: React Query (@tanstack/react-query) + React Context
- **Routing**: React Router DOM v6

### Project Structure
- `src/pages/` - Main page components (Index, Auth, AssistantView, NotFound)
- `src/components/` - Reusable components and UI elements
- `src/components/ui/` - shadcn/ui component library
- `src/hooks/` - Custom React hooks (useAuth, useToast, useMobile)
- `src/integrations/supabase/` - Supabase client and TypeScript types
- `src/types/` - Additional TypeScript type definitions
- `supabase/` - Database migrations and Edge Functions

### Core Application Features
This is an AI assistant management dashboard with:

1. **Assistant Management**: Create, configure, and manage AI bots
2. **Prompt Versioning System**: Advanced version control for prompts with three types:
   - `principal` - Main assistant behavior
   - `triagem` - Initial conversation triage logic  
   - `think` - Reasoning/thinking prompts
3. **External Conversations**: WhatsApp/Telegram integration for managing user conversations
4. **Knowledge Base**: File upload and management for assistant training
5. **Message Feedback System**: User feedback collection and improvement tracking

### Database Schema
Key tables:
- `bots` - Assistant configurations with persona settings
- `prompt_versions` - Versioned prompts with type constraints and active state management
- `external_conversations` + `conversation_messages` - External platform conversations
- `knowledge_base_files` - Uploaded training files
- `message_feedback` - User feedback for bot improvements
- `profiles` - User profile data

### Authentication & Security
- Supabase Auth with Row Level Security (RLS)
- Protected routes using `ProtectedRoute` component
- User context managed through `useAuth` hook
- All data access restricted by `user_id` relationships

### State Management Patterns
- React Query for server state management and caching
- Context API for authentication state (`AuthProvider`)
- Local component state for UI interactions
- Supabase real-time subscriptions for live updates

### Key Components
- `AssistantView` - Main assistant detail page with tabbed interface
- `PromptManager` - Complex prompt versioning system with auto-increment and activation logic
- `FloatingPromptAssistant` - AI-powered prompt modification assistant
- `BotFeedbackManagement` - Message feedback collection and analysis

### Design System - Konver
The application uses a custom design system called "Konver" with:
- **Dark Theme**: Professional dark color scheme as default
- **Design Tokens**: Consistent colors, typography, and spacing
- **Component Library**: `KonverLayout`, `KonverCard`, `KonverStats` components
- **CSS Classes**: `.konver-*` utility classes for consistent styling
- **Color Palette**: HSL-based with CSS custom properties
  - Primary: `#5b7cf7` (elegant blue)
  - Accent: `#33ccff` (konver brand)
  - Background: `#0f0f12` (deep dark)
  - Surface: `#141419` (cards/modals)

### Development Notes
- Uses `@` path alias for `./src/` imports
- TypeScript configured with relaxed settings (no implicit any warnings disabled)
- Vite dev server runs on `::` (all interfaces) port 8080
- Vercel deployment with SPA rewrites configuration
- Supabase project ID configured in `supabase/config.toml`

### Styling Guidelines
- Tailwind CSS with Konver design system tokens
- shadcn/ui components customized with Konver theme
- Inter font for text, JetBrains Mono for code
- Lucide React for icons throughout the application
- Dark-first approach with light mode preparation

### Database Relationships
- All tables use UUID primary keys
- Foreign key relationships enforce data integrity
- Unique constraints ensure single active prompt versions per type
- Database triggers handle auto-incrementing version numbers