# Konver - AI Assistant Platform

A professional, minimalist platform for creating and managing AI assistants with advanced conversation capabilities and prompt versioning.

## 🚀 Key Features

- **Assistant Dashboard**: Complete AI assistant management and visualization
- **Conversation System**: Real-time chat interface for testing assistants
- **External Conversations**: WhatsApp/Telegram integration and management
- **Knowledge Base**: File upload and management for assistant training
- **Advanced Prompt Versioning**: Robust system for managing different prompt versions

## 📝 Prompt Versioning System

### Prompt Types

1. **Principal**: Main assistant behavior and personality
2. **Triagem**: Initial conversation triage and routing logic
3. **Think**: Reasoning and analytical prompts

### Versioning Features

- ✅ **Version Creation**: Create new versions with descriptions
- ✅ **Activation/Deactivation**: Only one active version per type
- ✅ **Complete History**: View all previous versions
- ✅ **Restoration**: Restore any previous version
- ✅ **Auto-increment**: Automatic version numbering

### Database Structure

```sql
-- Main table for versioning
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY,
  bot_id UUID REFERENCES bots(id),
  user_id UUID REFERENCES auth.users(id),
  prompt_type TEXT CHECK (prompt_type IN ('principal', 'triagem', 'think')),
  content TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one active version per type
  UNIQUE(bot_id, prompt_type, is_active) DEFERRABLE
);
```

### Automatic Triggers

- **Auto-increment version**: Automatically calculates next version number
- **Unique active version**: Automatically deactivates previous versions

## 🎨 Design System

### Konver Theme

- **Dark-first Design**: Professional dark theme with elegant colors
- **Minimalist Interface**: Clean, distraction-free design
- **Consistent Components**: Reusable design system components
- **Accessibility**: WCAG compliant with proper contrast ratios

### Color Palette

- **Primary**: `#5b7cf7` - Elegant blue for primary actions
- **Accent**: `#33ccff` - Konver brand accent color
- **Background**: `#0f0f12` - Deep dark background
- **Surface**: `#141419` - Card and surface backgrounds
- **Border**: `#242429` - Subtle borders and dividers

### Typography

- **Primary Font**: Inter - Clean, modern sans-serif
- **Mono Font**: JetBrains Mono - For code and technical content

## 🔧 How to Use

1. **Create New Version**:
   - Click "New" button on desired prompt type card
   - Add optional description
   - Enter prompt content
   - Click "Create and Activate"

2. **View History**:
   - Click "View History" to expand previous versions
   - View complete content of each version
   - See timestamps and descriptions

3. **Restore Version**:
   - In history, click "Restore" on desired version
   - Confirm action in security dialog
   - Version will be automatically activated

## 💬 External Conversations System

### Platform Integration

The system supports external user conversations through:
- **WhatsApp Business API**: Message receiving and sending
- **Telegram Bot**: Bot integration
- **Custom APIs**: Webhooks for other platforms

### Database Structure

```sql
-- Main conversations
external_conversations: id, bot_id, user_name, phone_number, external_id, status

-- Individual messages  
conversation_messages: id, conversation_id, message_type, content, metadata
```

### Management Interface

- **📊 Dashboard**: Statistics for active, archived, and blocked conversations
- **🗂️ Organized List**: Search by name/phone, status filters
- **💬 Viewer**: Chat-like interface with complete history
- **⚙️ Actions**: Archive, block, reactivate conversations
- **🔄 Real-time**: Automatic updates via subscriptions

### Integration Flow

1. **Webhook** receives message from WhatsApp/Telegram
2. **System** finds/creates conversation using `external_id`
3. **Message** is saved to database
4. **AI** processes and generates response
5. **Response** is sent and saved
6. **Interface** updates in real-time

## 🛡️ Security and Integrity

- **Row Level Security (RLS)**: Users only access their own data
- **Type Validation**: Restricted enum for prompt types
- **Uniqueness Constraints**: Prevents inconsistent states
- **Soft Deletion**: History preserved permanently

## 🎯 System Benefits

1. **Complete Control**: Manage multiple versions without losing history
2. **Safe Rollback**: Return to any previous version quickly
3. **Experimentation**: Test different approaches without risk
4. **Audit Trail**: Track changes with timestamps and descriptions
5. **Scalability**: Easy support for new prompt types

## 📊 Technologies Used

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Components**: shadcn/ui with custom Konver design system
- **Icons**: Lucide React
- **State**: React Hooks + Context API + React Query
- **Integrations**: WhatsApp Business API, Telegram Bot API
- **Real-time**: Supabase Subscriptions

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## 📱 Development

- Development server runs on `http://localhost:8080`
- TypeScript strict mode with custom configurations
- ESLint for code quality
- Vite for fast development and building