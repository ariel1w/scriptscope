-- Blog comments table
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES content_queue(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  persona_id UUID REFERENCES ai_personas(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_created_at ON blog_comments(created_at DESC);

-- AI personas table
CREATE TABLE IF NOT EXISTS ai_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  personality TEXT NOT NULL, -- 'casual', 'formal', 'technical', etc.
  writing_style JSONB NOT NULL, -- { lowercase: boolean, slang: boolean, detailed: boolean, etc. }
  is_randomizer BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add meta fields to content_queue for blog posts
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS word_count INT;

-- Insert 10 AI personas
INSERT INTO ai_personas (name, username, avatar_url, personality, writing_style, is_randomizer) VALUES
  ('Sarah Martinez', 'sarahwrites', 'https://ui-avatars.com/api/?name=SM&background=e91e63&color=fff', 'casual', '{"lowercase": true, "slang": true, "detailed": false, "mistakes": true}'::jsonb, false),
  ('Dr. Michael Chen', 'mchenphd', 'https://ui-avatars.com/api/?name=MC&background=3f51b5&color=fff', 'formal', '{"lowercase": false, "slang": false, "detailed": true, "mistakes": false}'::jsonb, false),
  ('Jamie K', 'jamiek_writer', 'https://ui-avatars.com/api/?name=JK&background=ff9800&color=fff', 'casual', '{"lowercase": true, "slang": true, "detailed": false, "mistakes": true}'::jsonb, false),
  ('Robert Thompson', 'robthompson', 'https://ui-avatars.com/api/?name=RT&background=4caf50&color=fff', 'balanced', '{"lowercase": false, "slang": false, "detailed": true, "mistakes": false}'::jsonb, false),
  ('alexia_rose', 'alexia_rose', 'https://ui-avatars.com/api/?name=AR&background=9c27b0&color=fff', 'casual', '{"lowercase": true, "slang": true, "detailed": false, "mistakes": true}'::jsonb, false),
  ('David Park', 'davidpark', 'https://ui-avatars.com/api/?name=DP&background=00bcd4&color=fff', 'technical', '{"lowercase": false, "slang": false, "detailed": true, "mistakes": false}'::jsonb, false),
  ('Emma Wilson', 'emmawilson', 'https://ui-avatars.com/api/?name=EW&background=f44336&color=fff', 'friendly', '{"lowercase": false, "slang": false, "detailed": false, "mistakes": false}'::jsonb, false),
  ('tyler_m', 'tyler_m', 'https://ui-avatars.com/api/?name=TM&background=607d8b&color=fff', 'casual', '{"lowercase": true, "slang": true, "detailed": false, "mistakes": true}'::jsonb, false),
  ('Patricia Rodriguez', 'pat_rodriguez', 'https://ui-avatars.com/api/?name=PR&background=ff5722&color=fff', 'formal', '{"lowercase": false, "slang": false, "detailed": true, "mistakes": false}'::jsonb, false),
  ('Chris Anderson', 'chrisanderson', 'https://ui-avatars.com/api/?name=CA&background=795548&color=fff', 'skeptical', '{"lowercase": false, "slang": false, "detailed": true, "mistakes": false}'::jsonb, false);
