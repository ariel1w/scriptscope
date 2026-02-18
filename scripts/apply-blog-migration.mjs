/**
 * Applies the blog/comments schema migration to the remote Supabase database.
 * Run from the project root: node scripts/apply-blog-migration.mjs
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Execute SQL via PostgREST admin endpoint (requires service role key)
async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

// Alternative: use supabase.rpc if exec_sql function exists
async function runMigration(sql, description) {
  console.log(`Running: ${description}...`);
  try {
    // Try exec_sql RPC
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    console.log(`  ✓ Done`);
    return true;
  } catch (err) {
    // Try direct fetch
    try {
      await executeSql(sql);
      console.log(`  ✓ Done (via fetch)`);
      return true;
    } catch (fetchErr) {
      console.error(`  ✗ Failed: ${fetchErr.message.substring(0, 120)}`);
      return false;
    }
  }
}

// ── Migration SQL statements ───────────────────────────────────────────────────
const migrations = [
  {
    description: 'Create ai_personas table',
    sql: `CREATE TABLE IF NOT EXISTS ai_personas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      personality TEXT NOT NULL,
      writing_style JSONB NOT NULL,
      is_randomizer BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
  },
  {
    description: 'Create blog_comments table',
    sql: `CREATE TABLE IF NOT EXISTS blog_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES content_queue(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      persona_id UUID REFERENCES ai_personas(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
  },
  {
    description: 'Add meta_description to content_queue',
    sql: `ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS meta_description TEXT`,
  },
  {
    description: 'Add seo_keywords to content_queue',
    sql: `ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS seo_keywords TEXT[]`,
  },
  {
    description: 'Add word_count to content_queue',
    sql: `ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS word_count INT`,
  },
  {
    description: 'Create page_views table',
    sql: `CREATE TABLE IF NOT EXISTS page_views (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_path TEXT NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      visitor_id TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
  },
];

// ── AI Personas seed data ─────────────────────────────────────────────────────
const personas = [
  { name: 'Sarah Martinez', username: 'sarahwrites', avatar_url: 'https://ui-avatars.com/api/?name=SM&background=e91e63&color=fff', personality: 'casual', writing_style: { lowercase: true, slang: true, detailed: false, mistakes: true }, is_randomizer: false },
  { name: 'Dr. Michael Chen', username: 'mchenphd', avatar_url: 'https://ui-avatars.com/api/?name=MC&background=3f51b5&color=fff', personality: 'formal', writing_style: { lowercase: false, slang: false, detailed: true, mistakes: false }, is_randomizer: false },
  { name: 'Jamie K', username: 'jamiek_writer', avatar_url: 'https://ui-avatars.com/api/?name=JK&background=ff9800&color=fff', personality: 'casual', writing_style: { lowercase: true, slang: true, detailed: false, mistakes: true }, is_randomizer: false },
  { name: 'Robert Thompson', username: 'robthompson', avatar_url: 'https://ui-avatars.com/api/?name=RT&background=4caf50&color=fff', personality: 'balanced', writing_style: { lowercase: false, slang: false, detailed: true, mistakes: false }, is_randomizer: false },
  { name: 'alexia_rose', username: 'alexia_rose', avatar_url: 'https://ui-avatars.com/api/?name=AR&background=9c27b0&color=fff', personality: 'casual', writing_style: { lowercase: true, slang: true, detailed: false, mistakes: true }, is_randomizer: false },
  { name: 'David Park', username: 'davidpark', avatar_url: 'https://ui-avatars.com/api/?name=DP&background=00bcd4&color=fff', personality: 'technical', writing_style: { lowercase: false, slang: false, detailed: true, mistakes: false }, is_randomizer: false },
  { name: 'Emma Wilson', username: 'emmawilson', avatar_url: 'https://ui-avatars.com/api/?name=EW&background=f44336&color=fff', personality: 'friendly', writing_style: { lowercase: false, slang: false, detailed: false, mistakes: false }, is_randomizer: false },
  { name: 'tyler_m', username: 'tyler_m', avatar_url: 'https://ui-avatars.com/api/?name=TM&background=607d8b&color=fff', personality: 'casual', writing_style: { lowercase: true, slang: true, detailed: false, mistakes: true }, is_randomizer: false },
  { name: 'Patricia Rodriguez', username: 'pat_rodriguez', avatar_url: 'https://ui-avatars.com/api/?name=PR&background=ff5722&color=fff', personality: 'formal', writing_style: { lowercase: false, slang: false, detailed: true, mistakes: false }, is_randomizer: false },
  { name: 'Chris Anderson', username: 'chrisanderson', avatar_url: 'https://ui-avatars.com/api/?name=CA&background=795548&color=fff', personality: 'skeptical', writing_style: { lowercase: false, slang: false, detailed: true, mistakes: false }, is_randomizer: false },
];

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\n=== Applying blog migration ===\n');

let rpcWorks = false;

// Test if exec_sql RPC exists
try {
  const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  rpcWorks = !error;
} catch {}

if (!rpcWorks) {
  console.log('⚠  exec_sql RPC not available. Cannot run DDL via JS client.');
  console.log('\nPlease run this SQL in the Supabase Dashboard SQL editor:');
  console.log('→ https://supabase.com/dashboard/project/hqshghjitwanuswhgbsx/sql/new\n');
  console.log('--- COPY THIS SQL ---\n');

  for (const m of migrations) {
    console.log(`-- ${m.description}`);
    console.log(m.sql + ';\n');
  }

  console.log(`-- Seed AI personas`);
  for (const p of personas) {
    console.log(`INSERT INTO ai_personas (name, username, avatar_url, personality, writing_style, is_randomizer) VALUES ('${p.name}', '${p.username}', '${p.avatar_url}', '${p.personality}', '${JSON.stringify(p.writing_style)}'::jsonb, ${p.is_randomizer}) ON CONFLICT (username) DO NOTHING;`);
  }

  console.log('\n--- END SQL ---\n');
  console.log('After running the SQL, re-run: node scripts/generate-posts-now.mjs\n');
  process.exit(0);
}

// Run migrations
for (const m of migrations) {
  await runMigration(m.sql, m.description);
}

// Seed personas using Supabase client (DML works via REST)
console.log('\nSeeding AI personas...');
const { error: personaError } = await supabase
  .from('ai_personas')
  .upsert(personas, { onConflict: 'username', ignoreDuplicates: true });

if (personaError) {
  console.error('  ✗ Persona seed failed:', personaError.message);
} else {
  console.log('  ✓ AI personas seeded');
}

console.log('\n=== Migration complete ===\n');
console.log('Now run: node scripts/generate-posts-now.mjs\n');
