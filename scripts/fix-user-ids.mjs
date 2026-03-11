import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('C:/Users/user/scriptscope/my-app/.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Get all scripts with null user_id but a valid email
const { data: scripts } = await supabase
  .from('scripts')
  .select('id, email, title')
  .is('user_id', null)
  .not('email', 'is', null);

console.log(`Found ${scripts?.length} scripts with null user_id`);

// Get all auth users to map email → id
const { data: { users } } = await supabase.auth.admin.listUsers();
const emailToId = {};
for (const u of users) emailToId[u.email] = u.id;

// Update each script
let fixed = 0;
for (const script of scripts || []) {
  const userId = emailToId[script.email];
  if (!userId) { console.log('  No auth user for:', script.email); continue; }
  await supabase.from('scripts').update({ user_id: userId }).eq('id', script.id);
  console.log(`  Fixed: ${script.title} (${script.email}) → ${userId}`);
  fixed++;
}
console.log(`\nFixed ${fixed} scripts`);
