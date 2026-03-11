import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('C:/Users/user/scriptscope/my-app/.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

// Use ANON key - simulates what the browser does (no auth)
const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data, error } = await anonClient
  .from('scripts')
  .select('id, title, status, email')
  .eq('email', 'ariel1w@gmail.com')
  .order('created_at', { ascending: false });

console.log('Anon query result:', data?.length ?? 0, 'scripts');
console.log('Error:', error?.message || 'none');
data?.forEach(s => console.log(' ', s.title, s.status));
