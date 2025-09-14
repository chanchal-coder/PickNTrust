-- Migration: Create Canva Integration Tables
-- Created: 2024
-- Description: Add tables for Canva template management system

-- Create canva_settings table
CREATE TABLE IF NOT EXISTS canva_settings (
  id SERIAL PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT FALSE,
  api_key TEXT,
  api_secret TEXT,
  auto_generate_captions BOOLEAN DEFAULT TRUE,
  auto_generate_hashtags BOOLEAN DEFAULT TRUE,
  default_caption TEXT,
  default_hashtags TEXT,
  platforms TEXT[] DEFAULT '{}',
  schedule_type TEXT DEFAULT 'immediate',
  schedule_delay_minutes INTEGER DEFAULT 0,
  enable_blog_posts BOOLEAN DEFAULT TRUE,
  enable_videos BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create canva_platform_templates table
CREATE TABLE IF NOT EXISTS canva_platform_templates (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  template_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create canva_extra_templates table
CREATE TABLE IF NOT EXISTS canva_extra_templates (
  id SERIAL PRIMARY KEY,
  template_id TEXT NOT NULL,
  name TEXT,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_canva_platform_templates_platform ON canva_platform_templates(platform);
CREATE INDEX IF NOT EXISTS idx_canva_platform_templates_is_default ON canva_platform_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_canva_extra_templates_is_default ON canva_extra_templates(is_default);

-- Insert default canva settings record
INSERT INTO canva_settings (
  is_enabled,
  auto_generate_captions,
  auto_generate_hashtags,
  platforms,
  schedule_type,
  schedule_delay_minutes,
  enable_blog_posts,
  enable_videos
) VALUES (
  FALSE,
  TRUE,
  TRUE,
  ARRAY['instagram', 'facebook'],
  'immediate',
  0,
  TRUE,
  TRUE
) ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE canva_settings IS 'Stores global Canva integration settings';
COMMENT ON TABLE canva_platform_templates IS 'Stores platform-specific Canva templates';
COMMENT ON TABLE canva_extra_templates IS 'Stores additional Canva templates not tied to specific platforms';

COMMENT ON COLUMN canva_settings.platforms IS 'Array of selected social media platforms';
COMMENT ON COLUMN canva_settings.schedule_type IS 'Either immediate or scheduled posting';
COMMENT ON COLUMN canva_platform_templates.platform IS 'Platform identifier (instagram, instagram-reels, facebook, etc.)';
COMMENT ON COLUMN canva_platform_templates.is_default IS 'Whether this template is the default for the platform';
COMMENT ON COLUMN canva_extra_templates.is_default IS 'Whether this is the default extra template';