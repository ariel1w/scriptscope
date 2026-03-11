/**
 * Seeds the Script Doctor persona and migrates existing Ariel W. comments.
 * Run AFTER the SQL schema migration has been applied.
 * Run: node scripts/seed-script-doctor.mjs
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// 1. Upsert Script Doctor persona
console.log('Upserting Script Doctor persona...');
const { error: sdError } = await supabase.from('ai_personas').upsert({
  name: 'Script Doctor',
  username: 'scriptdoctor',
  avatar_url: 'https://ui-avatars.com/api/?name=SD&background=1E3A5F&color=c9a962',
  personality: 'formal',
  writing_style: { lowercase: false, slang: false, detailed: true, mistakes: false },
  is_randomizer: false,
}, { onConflict: 'username', ignoreDuplicates: false });

if (sdError) {
  console.error('✗ Script Doctor upsert failed:', sdError.message);
  process.exit(1);
}
console.log('✓ Script Doctor persona ready\n');

// 2. Migrate existing Ariel W. / owner comments to Script Doctor
const ownerUserId = env.OWNER_USER_ID;
if (!ownerUserId) {
  console.log('⚠  OWNER_USER_ID not in .env.local — skipping comment migration');
  process.exit(0);
}

const { data: sd } = await supabase.from('ai_personas').select('id').eq('username', 'scriptdoctor').single();
if (!sd) {
  console.error('✗ Could not fetch Script Doctor id after upsert');
  process.exit(1);
}

console.log(`Migrating comments from user_id=${ownerUserId} → Script Doctor...`);
const { data: migrated, error: migErr } = await supabase
  .from('blog_comments')
  .update({ persona_id: sd.id, user_id: null, author_name: 'Script Doctor' })
  .eq('user_id', ownerUserId)
  .select('id');

if (migErr) {
  console.error('✗ Migration failed:', migErr.message);
} else {
  console.log(`✓ Converted ${migrated?.length ?? 0} Ariel W. comments → Script Doctor`);
}

console.log('\n=== Done ===');
