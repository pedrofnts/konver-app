-- Create prompt_versions table for managing prompt versions
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('principal', 'triagem')),
  content TEXT NOT NULL,
  description TEXT,
  version_number INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- Create unique constraint to ensure only one active prompt per bot_id and prompt_type
-- This prevents the "duplicate key value violates unique constraint" error
CREATE UNIQUE INDEX IF NOT EXISTS prompt_versions_bot_id_prompt_type_is_active_key 
ON public.prompt_versions (bot_id, prompt_type, is_active) 
WHERE is_active = true;

-- Create policies for prompt_versions
CREATE POLICY "Users can view own prompt versions" 
  ON public.prompt_versions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompt versions" 
  ON public.prompt_versions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompt versions" 
  ON public.prompt_versions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt versions" 
  ON public.prompt_versions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to automatically increment version number
CREATE OR REPLACE FUNCTION public.increment_prompt_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get the maximum version number for this bot and prompt type
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO NEW.version_number
  FROM public.prompt_versions
  WHERE bot_id = NEW.bot_id AND prompt_type = NEW.prompt_type;
  
  -- Set updated_at timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically increment version number on insert
CREATE TRIGGER trigger_increment_prompt_version
  BEFORE INSERT ON public.prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_prompt_version();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER trigger_update_prompt_versions_updated_at
  BEFORE UPDATE ON public.prompt_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_prompt_version();

-- Add comments to describe the table and columns
COMMENT ON TABLE public.prompt_versions IS 'Stores versioned prompts for each bot with support for multiple prompt types';
COMMENT ON COLUMN public.prompt_versions.prompt_type IS 'Type of prompt: principal or triagem';
COMMENT ON COLUMN public.prompt_versions.content IS 'The actual prompt content';
COMMENT ON COLUMN public.prompt_versions.version_number IS 'Auto-incremented version number for each prompt type';
COMMENT ON COLUMN public.prompt_versions.is_active IS 'Whether this version is currently active (only one can be active per bot and prompt type)';
COMMENT ON COLUMN public.prompt_versions.description IS 'Optional description of what changed in this version'; 