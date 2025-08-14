# Database Structure - AI Assistant Management System

This document provides a comprehensive guide to recreate the database structure for the AI Assistant Management System. The system is built on Supabase (PostgreSQL) with Row Level Security (RLS) enabled.

## Overview

The database consists of 7 main tables that handle:
- User authentication and profiles
- AI assistant (bot) management
- Prompt versioning system
- External conversation management
- Knowledge base file storage
- Message feedback system

## Prerequisites

- PostgreSQL 14+ with UUID extension
- Supabase Auth system (or equivalent auth.users table)
- Full-text search capabilities
- JSONB support

## Migration Order

Execute the following migrations in order:

### 1. User Profiles Table

```sql
-- Create profiles table for user information
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Bots Table

```sql
-- Create bots table for AI assistants
CREATE TABLE bots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- AI Configuration
    prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens > 0),
    
    -- Persona Configuration
    persona_name TEXT,
    persona_objective TEXT,
    persona_personality TEXT,
    persona_style TEXT,
    persona_target_audience TEXT,
    
    -- Status and Metrics
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    conversations INTEGER DEFAULT 0,
    performance DECIMAL(5,2) DEFAULT 0.0 CHECK (performance >= 0 AND performance <= 100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bots_user_id ON bots(user_id);
CREATE INDEX idx_bots_status ON bots(status);
CREATE INDEX idx_bots_created_at ON bots(created_at DESC);

-- Enable RLS
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own bots" ON bots
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own bots" ON bots
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bots" ON bots
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own bots" ON bots
    FOR DELETE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_bots_updated_at
    BEFORE UPDATE ON bots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. Prompt Versions Table

```sql
-- Create enum for prompt types
CREATE TYPE prompt_type AS ENUM ('principal', 'triagem', 'think');

-- Create prompt_versions table for versioned prompts
CREATE TABLE prompt_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Prompt Configuration
    prompt_type prompt_type NOT NULL,
    content TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(bot_id, prompt_type, version_number),
    UNIQUE(bot_id, prompt_type, is_active) WHERE is_active = TRUE
);

-- Indexes
CREATE INDEX idx_prompt_versions_bot_id ON prompt_versions(bot_id);
CREATE INDEX idx_prompt_versions_type ON prompt_versions(prompt_type);
CREATE INDEX idx_prompt_versions_active ON prompt_versions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_prompt_versions_user_id ON prompt_versions(user_id);

-- Enable RLS
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view prompt versions for their bots" ON prompt_versions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create prompt versions for their bots" ON prompt_versions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update prompt versions for their bots" ON prompt_versions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete prompt versions for their bots" ON prompt_versions
    FOR DELETE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_prompt_versions_updated_at
    BEFORE UPDATE ON prompt_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-increment version numbers
CREATE OR REPLACE FUNCTION auto_increment_prompt_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version_number IS NULL THEN
        SELECT COALESCE(MAX(version_number), 0) + 1
        INTO NEW.version_number
        FROM prompt_versions
        WHERE bot_id = NEW.bot_id AND prompt_type = NEW.prompt_type;
    END IF;
    
    -- Deactivate other versions of the same type if this one is active
    IF NEW.is_active = TRUE THEN
        UPDATE prompt_versions
        SET is_active = FALSE
        WHERE bot_id = NEW.bot_id 
        AND prompt_type = NEW.prompt_type 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trigger_auto_increment_prompt_version
    BEFORE INSERT ON prompt_versions
    FOR EACH ROW
    EXECUTE FUNCTION auto_increment_prompt_version();
```

### 4. External Conversations Table

```sql
-- Create external_conversations table for WhatsApp/Telegram conversations
CREATE TABLE external_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
    
    -- User Information
    user_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    external_id TEXT, -- External platform conversation ID
    
    -- Conversation Metadata
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    metadata JSONB DEFAULT '{}',
    last_message_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_external_conversations_bot_id ON external_conversations(bot_id);
CREATE INDEX idx_external_conversations_phone ON external_conversations(phone_number);
CREATE INDEX idx_external_conversations_status ON external_conversations(status);
CREATE INDEX idx_external_conversations_last_message ON external_conversations(last_message_at DESC);
CREATE INDEX idx_external_conversations_external_id ON external_conversations(external_id) WHERE external_id IS NOT NULL;

-- Enable RLS
ALTER TABLE external_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view conversations for their bots" ON external_conversations
    FOR SELECT USING (
        bot_id IN (
            SELECT id FROM bots WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations for their bots" ON external_conversations
    FOR INSERT WITH CHECK (
        bot_id IN (
            SELECT id FROM bots WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update conversations for their bots" ON external_conversations
    FOR UPDATE USING (
        bot_id IN (
            SELECT id FROM bots WHERE user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_external_conversations_updated_at
    BEFORE UPDATE ON external_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 5. Conversation Messages Table

```sql
-- Create conversation_messages table for individual messages
CREATE TABLE conversation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES external_conversations(id) ON DELETE CASCADE NOT NULL,
    
    -- Message Content
    message_type TEXT NOT NULL CHECK (message_type IN ('user', 'bot')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_type ON conversation_messages(message_type);
CREATE INDEX idx_conversation_messages_created_at ON conversation_messages(created_at DESC);

-- Enable RLS
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages for their bot conversations" ON conversation_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT ec.id FROM external_conversations ec
            JOIN bots b ON ec.bot_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages for their bot conversations" ON conversation_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT ec.id FROM external_conversations ec
            JOIN bots b ON ec.bot_id = b.id
            WHERE b.user_id = auth.uid()
        )
    );
```

### 6. Knowledge Base Files Table

```sql
-- Create knowledge_base_files table for uploaded training files
CREATE TABLE knowledge_base_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- File Information
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size TEXT NOT NULL, -- Stored as formatted string (e.g., "1.2 MB")
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    
    -- Processing Information
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
    chunks_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_knowledge_base_files_bot_id ON knowledge_base_files(bot_id);
CREATE INDEX idx_knowledge_base_files_user_id ON knowledge_base_files(user_id);
CREATE INDEX idx_knowledge_base_files_status ON knowledge_base_files(status);
CREATE INDEX idx_knowledge_base_files_type ON knowledge_base_files(file_type);

-- Enable RLS
ALTER TABLE knowledge_base_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view files for their bots" ON knowledge_base_files
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create files for their bots" ON knowledge_base_files
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update files for their bots" ON knowledge_base_files
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete files for their bots" ON knowledge_base_files
    FOR DELETE USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_knowledge_base_files_updated_at
    BEFORE UPDATE ON knowledge_base_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 7. Message Feedback System

```sql
-- Create enum types for feedback system
CREATE TYPE feedback_type AS ENUM ('improve_response', 'add_context', 'fix_error', 'enhance_tone');
CREATE TYPE feedback_status AS ENUM ('pending', 'applied', 'rejected', 'in_review');

-- Create message_feedback table for bot training
CREATE TABLE message_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- References
    conversation_message_id UUID REFERENCES conversation_messages(id) ON DELETE CASCADE,
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES auth.users(id),
    
    -- Message context
    user_message_context TEXT NOT NULL, -- The user message that triggered the bot response
    original_bot_response TEXT NOT NULL, -- Original response from the bot
    improved_response TEXT NOT NULL, -- Admin's improved version
    
    -- Feedback metadata
    feedback_type feedback_type NOT NULL DEFAULT 'improve_response',
    status feedback_status NOT NULL DEFAULT 'pending',
    
    -- Training context
    similarity_keywords TEXT[], -- Keywords for finding similar contexts
    conversation_context JSONB, -- Additional context from conversation
    
    -- Usage tracking
    times_applied INTEGER DEFAULT 0, -- How many times this improvement was used
    last_applied_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_message_feedback_bot_id ON message_feedback(bot_id);
CREATE INDEX idx_message_feedback_status ON message_feedback(status);
CREATE INDEX idx_message_feedback_message_id ON message_feedback(conversation_message_id);
CREATE INDEX idx_message_feedback_created_at ON message_feedback(created_at DESC);
CREATE INDEX idx_message_feedback_keywords ON message_feedback USING GIN(similarity_keywords);

-- Create index for text search on user context
CREATE INDEX idx_message_feedback_user_context ON message_feedback USING gin(to_tsvector('portuguese', user_message_context));

-- Enable RLS
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view message feedback for their bots" ON message_feedback
    FOR SELECT USING (
        bot_id IN (
            SELECT id FROM bots WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create message feedback for their bots" ON message_feedback
    FOR INSERT WITH CHECK (
        bot_id IN (
            SELECT id FROM bots WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update message feedback for their bots" ON message_feedback
    FOR UPDATE USING (
        bot_id IN (
            SELECT id FROM bots WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete message feedback for their bots" ON message_feedback
    FOR DELETE USING (
        bot_id IN (
            SELECT id FROM bots WHERE user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_message_feedback_updated_at
    BEFORE UPDATE ON message_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Views and Functions

### Message Feedback Context View

```sql
-- Create view for easy feedback queries with context
CREATE VIEW message_feedback_with_context AS
SELECT 
    mf.*,
    cm.content as message_content,
    cm.created_at as message_created_at,
    cm.message_type,
    ec.user_name,
    ec.phone_number,
    ec.status as conversation_status,
    ec.created_at as conversation_created_at
FROM message_feedback mf
LEFT JOIN conversation_messages cm ON mf.conversation_message_id = cm.id
LEFT JOIN external_conversations ec ON cm.conversation_id = ec.id;

-- Grant permissions
GRANT SELECT ON message_feedback_with_context TO authenticated;
```

### Utility Functions

```sql
-- Function to extract keywords from text
CREATE OR REPLACE FUNCTION extract_keywords_from_text(input_text TEXT)
RETURNS TEXT[] AS $$
BEGIN
    -- Simple keyword extraction (can be enhanced with NLP)
    RETURN regexp_split_to_array(
        lower(regexp_replace(input_text, '[^\w\s]', '', 'g')),
        '\s+'
    );
END;
$$ LANGUAGE 'plpgsql';
```

## Final Setup

### Grant Permissions

```sql
-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
```

### Storage Setup (if using Supabase Storage)

```sql
-- Create storage bucket for knowledge base files
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-files', 'knowledge-files', false);

-- Storage policies
CREATE POLICY "Users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Key Features

### Security
- Row Level Security (RLS) enabled on all tables
- User isolation through user_id relationships
- Proper foreign key constraints with CASCADE deletes

### Performance
- Strategic indexes on frequently queried columns
- GIN indexes for JSONB and array fields
- Full-text search capability for Portuguese language

### Data Integrity
- Check constraints for valid enum values
- Unique constraints for business logic (active prompts, versions)
- NOT NULL constraints on required fields

### Scalability
- UUID primary keys for distributed systems
- JSONB for flexible metadata storage
- Efficient indexing strategy

## Common Queries

### Get active prompts for a bot
```sql
SELECT * FROM prompt_versions 
WHERE bot_id = $1 AND is_active = true;
```

### Get conversation with messages
```sql
SELECT ec.*, cm.* 
FROM external_conversations ec
LEFT JOIN conversation_messages cm ON ec.id = cm.conversation_id
WHERE ec.bot_id = $1
ORDER BY cm.created_at ASC;
```

### Search feedback by keywords
```sql
SELECT * FROM message_feedback
WHERE bot_id = $1 
AND similarity_keywords && $2
AND status = 'applied'
ORDER BY times_applied DESC;
```

This structure provides a robust foundation for the AI Assistant Management System with proper security, performance, and scalability considerations.