import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create ai_personas table
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS ai_personas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          avatar_url TEXT,
          personality TEXT NOT NULL,
          writing_style JSONB NOT NULL,
          is_randomizer BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // Create blog_comments table
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
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

        CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
        CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at ON blog_comments(created_at DESC);
      `
    });

    // Add columns to content_queue
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS meta_description TEXT;
        ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS seo_keywords TEXT[];
        ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS word_count INT;
      `
    });

    // Insert AI personas
    const personas = [
      { name: 'Sarah Martinez', username: 'sarahwrites', avatar: 'SM', bg: 'e91e63', personality: 'casual', style: { lowercase: true, slang: true, detailed: false, mistakes: true } },
      { name: 'Dr. Michael Chen', username: 'mchenphd', avatar: 'MC', bg: '3f51b5', personality: 'formal', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
      { name: 'Jamie K', username: 'jamiek_writer', avatar: 'JK', bg: 'ff9800', personality: 'casual', style: { lowercase: true, slang: true, detailed: false, mistakes: true } },
      { name: 'Robert Thompson', username: 'robthompson', avatar: 'RT', bg: '4caf50', personality: 'balanced', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
      { name: 'alexia_rose', username: 'alexia_rose', avatar: 'AR', bg: '9c27b0', personality: 'casual', style: { lowercase: true, slang: true, detailed: false, mistakes: true } },
      { name: 'David Park', username: 'davidpark', avatar: 'DP', bg: '00bcd4', personality: 'technical', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
      { name: 'Emma Wilson', username: 'emmawilson', avatar: 'EW', bg: 'f44336', personality: 'friendly', style: { lowercase: false, slang: false, detailed: false, mistakes: false } },
      { name: 'tyler_m', username: 'tyler_m', avatar: 'TM', bg: '607d8b', personality: 'casual', style: { lowercase: true, slang: true, detailed: false, mistakes: true } },
      { name: 'Patricia Rodriguez', username: 'pat_rodriguez', avatar: 'PR', bg: 'ff5722', personality: 'formal', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
      { name: 'Chris Anderson', username: 'chrisanderson', avatar: 'CA', bg: '795548', personality: 'skeptical', style: { lowercase: false, slang: false, detailed: true, mistakes: false } },
    ];

    for (const p of personas) {
      await supabaseAdmin.from('ai_personas').upsert({
        username: p.username,
        name: p.name,
        avatar_url: `https://ui-avatars.com/api/?name=${p.avatar}&background=${p.bg}&color=fff`,
        personality: p.personality,
        writing_style: p.style,
        is_randomizer: false,
      }, { onConflict: 'username' });
    }

    return NextResponse.json({ success: true, message: 'Migration completed' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
