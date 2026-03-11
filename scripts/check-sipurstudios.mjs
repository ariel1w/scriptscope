import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('C:/Users/user/scriptscope/my-app/.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: scripts } = await supabase
  .from('scripts')
  .select('id, title, status, email, error_message, created_at, processing_completed_at, user_id')
  .eq('email', 'ariel@sipurstudios.com')
  .order('created_at', { ascending: false });

console.log('Scripts for ariel@sipurstudios.com:', scripts?.length);
scripts?.forEach(s => {
  console.log('\n', JSON.stringify(s, null, 2));
});

// Also check auth user
const { data: { users } } = await supabase.auth.admin.listUsers();
const u = users?.find(u => u.email === 'ariel@sipurstudios.com');
console.log('\nAuth user:', u ? `id=${u.id}` : 'NOT FOUND');
