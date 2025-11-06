-- Add column to store original AI generation inputs for rebuilding
ALTER TABLE pitch_decks
ADD COLUMN IF NOT EXISTS ai_generation_data JSONB;

-- Add comment explaining the field
COMMENT ON COLUMN pitch_decks.ai_generation_data IS 'Stores original AI generation inputs (content, urls, instructions, buildOnly, fillMissingGraphics) to allow deck rebuilding';
