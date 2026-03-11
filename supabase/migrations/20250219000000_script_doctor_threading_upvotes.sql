-- Script Doctor persona, comment threading, and upvotes
-- Adds the Script Doctor brand-voice AI persona, threading support, and an upvotes system.

-- 1. Add Script Doctor as the site's brand-voice AI persona
INSERT INTO ai_personas (name, username, avatar_url, personality, writing_style, is_randomizer)
VALUES (
  'Script Doctor',
  'scriptdoctor',
  'https://ui-avatars.com/api/?name=SD&background=1E3A5F&color=c9a962',
  'formal',
  '{"lowercase": false, "slang": false, "detailed": true, "mistakes": false}'::jsonb,
  false
)
ON CONFLICT (username) DO NOTHING;

-- 2. Add parent_comment_id for reply threading
ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_comment_id);

-- 3. Upvotes table — tracks who upvoted which comment (users or AI personas)
CREATE TABLE IF NOT EXISTS comment_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES ai_personas(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT upvote_has_voter CHECK (user_id IS NOT NULL OR persona_id IS NOT NULL)
);

-- Unique indexes: one upvote per user per comment, one per persona per comment
CREATE UNIQUE INDEX IF NOT EXISTS idx_upvote_user ON comment_upvotes(comment_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_upvote_persona ON comment_upvotes(comment_id, persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_upvotes_comment ON comment_upvotes(comment_id);
