-- Add persona fields to the bots table
ALTER TABLE public.bots 
ADD COLUMN persona_name TEXT DEFAULT NULL,
ADD COLUMN persona_objective TEXT DEFAULT NULL,
ADD COLUMN persona_personality TEXT DEFAULT NULL,
ADD COLUMN persona_style TEXT DEFAULT NULL,
ADD COLUMN persona_target_audience TEXT DEFAULT NULL;

-- Add comments to describe the persona columns
COMMENT ON COLUMN public.bots.persona_name IS 'Specific name of the assistant persona';
COMMENT ON COLUMN public.bots.persona_objective IS 'Primary objective of the assistant persona';
COMMENT ON COLUMN public.bots.persona_personality IS 'Personality characteristics of the persona';
COMMENT ON COLUMN public.bots.persona_style IS 'Communication style of the persona';
COMMENT ON COLUMN public.bots.persona_target_audience IS 'Target audience that the persona serves'; 