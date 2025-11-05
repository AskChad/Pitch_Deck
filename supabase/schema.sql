-- Create pitch_decks table
CREATE TABLE IF NOT EXISTS pitch_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  brand_url TEXT,
  brand_assets JSONB,
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme JSONB NOT NULL DEFAULT '{
    "colors": {
      "primary": "#2563eb",
      "secondary": "#7c3aed",
      "accent": "#f59e0b",
      "background": "#ffffff",
      "text": "#1f2937"
    },
    "fontFamily": "Inter"
  }'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_pitch_decks_user_id ON pitch_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_pitch_decks_created_at ON pitch_decks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pitch_decks_is_public ON pitch_decks(is_public) WHERE is_public = true;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS update_pitch_decks_updated_at ON pitch_decks;
CREATE TRIGGER update_pitch_decks_updated_at
  BEFORE UPDATE ON pitch_decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE pitch_decks ENABLE ROW LEVEL SECURITY;

-- Create policies for pitch_decks
-- Users can view their own decks
CREATE POLICY "Users can view their own decks"
  ON pitch_decks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public decks
CREATE POLICY "Anyone can view public decks"
  ON pitch_decks FOR SELECT
  USING (is_public = true);

-- Users can insert their own decks
CREATE POLICY "Users can insert their own decks"
  ON pitch_decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own decks
CREATE POLICY "Users can update their own decks"
  ON pitch_decks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own decks
CREATE POLICY "Users can delete their own decks"
  ON pitch_decks FOR DELETE
  USING (auth.uid() = user_id);

-- Create shared_decks table for collaboration
CREATE TABLE IF NOT EXISTS shared_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT CHECK (permission IN ('view', 'edit', 'admin')) DEFAULT 'view',
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deck_id, user_id)
);

-- Create index for shared_decks
CREATE INDEX IF NOT EXISTS idx_shared_decks_deck_id ON shared_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_shared_decks_user_id ON shared_decks(user_id);

-- Enable RLS for shared_decks
ALTER TABLE shared_decks ENABLE ROW LEVEL SECURITY;

-- Policies for shared_decks
CREATE POLICY "Users can view decks shared with them"
  ON shared_decks FOR SELECT
  USING (auth.uid() = user_id);

-- Deck owners can share their decks
CREATE POLICY "Deck owners can share their decks"
  ON shared_decks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pitch_decks
      WHERE id = deck_id AND user_id = auth.uid()
    )
  );

-- Users can view shared decks
CREATE POLICY "Users can access shared decks"
  ON pitch_decks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_decks
      WHERE deck_id = pitch_decks.id AND user_id = auth.uid()
    )
  );

-- Users with edit permission can update shared decks
CREATE POLICY "Users with edit permission can update shared decks"
  ON pitch_decks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shared_decks
      WHERE deck_id = pitch_decks.id
        AND user_id = auth.uid()
        AND permission IN ('edit', 'admin')
    )
  );

-- Create presentation_analytics table
CREATE TABLE IF NOT EXISTS presentation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES pitch_decks(id) ON DELETE CASCADE,
  viewer_id UUID,
  slides_viewed JSONB DEFAULT '[]'::jsonb,
  total_time_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  viewer_ip TEXT,
  viewer_user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for presentation_analytics
CREATE INDEX IF NOT EXISTS idx_presentation_analytics_deck_id ON presentation_analytics(deck_id);
CREATE INDEX IF NOT EXISTS idx_presentation_analytics_created_at ON presentation_analytics(created_at DESC);

-- Enable RLS for presentation_analytics
ALTER TABLE presentation_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for presentation_analytics
CREATE POLICY "Deck owners can view their deck analytics"
  ON presentation_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pitch_decks
      WHERE id = deck_id AND user_id = auth.uid()
    )
  );

-- Anyone can insert analytics (for public decks)
CREATE POLICY "Anyone can insert analytics"
  ON presentation_analytics FOR INSERT
  WITH CHECK (true);

-- Create reference_materials table for uploaded files
CREATE TABLE IF NOT EXISTS reference_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES pitch_decks(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for reference_materials
CREATE INDEX IF NOT EXISTS idx_reference_materials_user_id ON reference_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_materials_deck_id ON reference_materials(deck_id);
CREATE INDEX IF NOT EXISTS idx_reference_materials_file_type ON reference_materials(file_type);
CREATE INDEX IF NOT EXISTS idx_reference_materials_created_at ON reference_materials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reference_materials_tags ON reference_materials USING GIN(tags);

-- Enable RLS for reference_materials
ALTER TABLE reference_materials ENABLE ROW LEVEL SECURITY;

-- Trigger for reference_materials
DROP TRIGGER IF EXISTS update_reference_materials_updated_at ON reference_materials;
CREATE TRIGGER update_reference_materials_updated_at
  BEFORE UPDATE ON reference_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Policies for reference_materials
CREATE POLICY "Users can view their own reference materials"
  ON reference_materials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reference materials"
  ON reference_materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reference materials"
  ON reference_materials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reference materials"
  ON reference_materials FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for reference materials (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reference-materials', 'reference-materials', false);

-- Storage policies for reference materials bucket
-- CREATE POLICY "Users can upload their own files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'reference-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'reference-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own files"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'reference-materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create admin_settings table for API keys and platform configuration
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Trigger for admin_settings
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Only allow access if user is admin (check metadata)
CREATE POLICY "Only admins can view settings"
  ON admin_settings FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "Only admins can insert settings"
  ON admin_settings FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "Only admins can update settings"
  ON admin_settings FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY "Only admins can delete settings"
  ON admin_settings FOR DELETE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );

-- Insert default API key entries
INSERT INTO admin_settings (key, description) VALUES
  ('leonardo_api_key', 'Leonardo.ai API Key for image generation'),
  ('iconkit_api_key', 'IconKit.ai API Key for icon generation')
ON CONFLICT (key) DO NOTHING;
