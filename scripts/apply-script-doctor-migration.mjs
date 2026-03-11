/**
 * Applies the Script Doctor / threading / upvotes schema migration.
 * Run: node scripts/apply-script-doctor-migration.mjs
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runSql(sql, description) {
  console.log(`Running: ${description}...`);
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    console.log(`  ✓ Done`);
    return true;
  } catch (err) {
    console.error(`  ✗ Failed: ${String(err.message).substring(0, 120)}`);
    return false;
  }
}

const migrations = [
  {
    description: 'Add parent_comment_id to blog_comments',
    sql: `ALTER TABLE blog_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE`,
  },
  {
    description: 'Create index on parent_comment_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_comment_id)`,
  },
  {
    description: 'Create comment_upvotes table',
    sql: `CREATE TABLE IF NOT EXISTS comment_upvotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      comment_id UUID NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      persona_id UUID REFERENCES ai_personas(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT upvote_has_voter CHECK (user_id IS NOT NULL OR persona_id IS NOT NULL)
    )`,
  },
  {
    description: 'Create unique index for user upvotes',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_upvote_user ON comment_upvotes(comment_id, user_id) WHERE user_id IS NOT NULL`,
  },
  {
    description: 'Create unique index for persona upvotes',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_upvote_persona ON comment_upvotes(comment_id, persona_id) WHERE persona_id IS NOT NULL`,
  },
  {
    description: 'Create index on comment_upvotes.comment_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_upvotes_comment ON comment_upvotes(comment_id)`,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\n=== Applying Script Doctor / threading / upvotes migration ===\n');

// Test if exec_sql RPC is available
let rpcWorks = false;
try {
  const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  rpcWorks = !error;
} catch {}

if (!rpcWorks) {
  console.log('⚠  exec_sql RPC not available. Please run this SQL in Supabase Dashboard:');
  console.log('→ https://supabase.com/dashboard/project/hqshghjitwanuswhgbsx/sql/new\n');
  console.log('--- COPY THIS SQL ---\n');
  for (const m of migrations) {
    console.log(`-- ${m.description}`);
    console.log(m.sql + ';\n');
  }
  console.log('--- END SQL ---\n');
  process.exit(0);
}

for (const m of migrations) {
  await runSql(m.sql, m.description);
}

// Upsert Script Doctor persona via DML (works via REST)
console.log('\nUpserting Script Doctor persona...');
const { error: sdError } = await supabase.from('ai_personas').upsert({
  name: 'Script Doctor',
  username: 'scriptdoctor',
  avatar_url: 'https://ui-avatars.com/api/?name=SD&background=1E3A5F&color=c9a962',
  personality: 'formal',
  writing_style: { lowercase: false, slang: false, detailed: true, mistakes: false },
  is_randomizer: false,
}, { onConflict: 'username', ignoreDuplicates: false });

if (sdError) {
  console.error('  ✗ Script Doctor upsert failed:', sdError.message);
} else {
  console.log('  ✓ Script Doctor persona ready');
}

// Migrate existing Ariel W. comments to Script Doctor
const ownerUserId = env.OWNER_USER_ID;
if (ownerUserId) {
  console.log('\nMigrating Ariel W. comments to Script Doctor...');
  const { data: sd } = await supabase.from('ai_personas').select('id').eq('username', 'scriptdoctor').single();
  if (sd) {
    const { data: migrated, error: migErr } = await supabase
      .from('blog_comments')
      .update({ persona_id: sd.id, user_id: null, author_name: 'Script Doctor' })
      .eq('user_id', ownerUserId)
      .select('id');
    if (migErr) {
      console.error('  ✗ Migration failed:', migErr.message);
    } else {
      console.log(`  ✓ Converted ${migrated?.length ?? 0} comments to Script Doctor`);
    }
  }
} else {
  console.log('\n⚠  OWNER_USER_ID not set in .env.local — skipping Ariel W. comment migration');
}

console.log('\n=== Migration complete ===\n');
