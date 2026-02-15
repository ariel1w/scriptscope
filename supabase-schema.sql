-- ScriptScope Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Users/credits
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  credits_remaining INT DEFAULT 0,
  trial_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scripts
CREATE TABLE scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  page_count INT,
  status TEXT DEFAULT 'uploaded', -- uploaded, processing, completed, failed
  raw_text TEXT,
  analysis JSONB,
  error_message TEXT,
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Content queue for marketing
CREATE TABLE content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- twitter, linkedin, blog
  content TEXT NOT NULL,
  title TEXT, -- for blog
  slug TEXT, -- for blog
  status TEXT DEFAULT 'queued', -- queued, posted, failed
  scheduled_for TIMESTAMP,
  posted_at TIMESTAMP,
  external_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily stats
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  revenue DECIMAL DEFAULT 0,
  scripts_analyzed INT DEFAULT 0,
  signups INT DEFAULT 0,
  refunds INT DEFAULT 0
);

-- Reviews (IMDB testimonials for free credits)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  imdb_url TEXT NOT NULL UNIQUE,
  testimonial TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_scripts_email ON scripts(email);
CREATE INDEX idx_scripts_status ON scripts(status);
CREATE INDEX idx_scripts_created_at ON scripts(created_at);
CREATE INDEX idx_content_queue_status ON content_queue(status, platform);
CREATE INDEX idx_content_queue_created_at ON content_queue(created_at);
CREATE INDEX idx_daily_stats_date ON daily_stats(date);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_imdb_url ON reviews(imdb_url);

-- Helper function to increment credits (used for refunds)
CREATE OR REPLACE FUNCTION increment_credits(user_email TEXT, amount INT)
RETURNS VOID AS $$
BEGIN
  UPDATE credits
  SET credits_remaining = credits_remaining + amount,
      updated_at = NOW()
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql;
