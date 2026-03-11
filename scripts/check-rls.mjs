import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('C:/Users/user/scriptscope/my-app/.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Check what scripts exist for ariel1w - admin query (bypasses RLS)
const { data: adminData } = await supabase
  .from('scripts')
  .select('id, title, status, email, user_id')
  .eq('email', 'ariel1w@gmail.com')
  .neq('status', 'uploaded');

console.log('Admin query (bypasses RLS) - completed/failed scripts:', adminData?.length);
adminData?.forEach(s => console.log(' ', s.title, s.status, 'user_id:', s.user_id));

// Now simulate what the client-side query does - use anon key with user JWT simulation
// Check if there's a RLS policy issue by looking at the scripts table's RLS settings
const { data: rls } = await supabase
  .from('scripts')
  .select('id')
  .limit(1);
console.log('\nAnon/service check ok');

// Check the user's actual auth ID
const { data: { users } } = await supabase.auth.admin.listUsers();
const ariel = users?.find(u => u.email === 'ariel1w@gmail.com');
console.log('\nariel1w auth user_id:', ariel?.id);
console.log('Script user_id matches:', adminData?.[0]?.user_id === ariel?.id);
