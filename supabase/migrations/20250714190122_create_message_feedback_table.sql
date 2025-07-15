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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_message_feedback_updated_at
    BEFORE UPDATE ON message_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to extract keywords from text
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

-- Create view for easy feedback queries with context
CREATE VIEW message_feedback_with_context AS
SELECT 
    mf.*,
    cm.content as original_message_content,
    cm.created_at as message_created_at,
    ec.user_name,
    ec.phone_number,
    b.name as bot_name
FROM message_feedback mf
JOIN conversation_messages cm ON mf.conversation_message_id = cm.id
JOIN external_conversations ec ON cm.conversation_id = ec.id
JOIN bots b ON mf.bot_id = b.id;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON message_feedback TO authenticated;
GRANT SELECT ON message_feedback_with_context TO authenticated;
