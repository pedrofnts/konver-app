-- Add configuration fields to the bots table
ALTER TABLE public.bots 
ADD COLUMN prompt TEXT DEFAULT 'Você é um assistente inteligente e prestativo.',
ADD COLUMN temperature DECIMAL(3,2) DEFAULT 0.7,
ADD COLUMN max_tokens INTEGER DEFAULT 1000,
ADD COLUMN knowledge_base TEXT[] DEFAULT '{}';

-- Add comment to describe the new columns
COMMENT ON COLUMN public.bots.prompt IS 'System prompt that defines the assistant behavior';
COMMENT ON COLUMN public.bots.temperature IS 'AI model temperature setting (0.0 to 1.0)';
COMMENT ON COLUMN public.bots.max_tokens IS 'Maximum number of tokens for AI responses';
COMMENT ON COLUMN public.bots.knowledge_base IS 'Array of knowledge base document references'; 