import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync('C:/Users/user/scriptscope/my-app/.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Find EDEN script
const { data: scripts, error } = await supabase
  .from('scripts')
  .select('*')
  .ilike('title', '%eden%')
  .order('created_at', { ascending: false });

console.log('EDEN scripts:', JSON.stringify(scripts, null, 2));
console.log('Error:', error);

// Also check most recent scripts regardless of title
const { data: recent } = await supabase
  .from('scripts')
  .select('id, title, status, email, error_message, created_at, processing_started_at, processing_completed_at')
  .order('created_at', { ascending: false })
  .limit(10);

console.log('\nMost recent 10 scripts:');
for (const s of recent || []) {
  console.log(`  ${s.created_at?.substring(0,16)}  ${s.title || 'untitled'}  status:${s.status}  ${s.email}`);
  if (s.error_message) console.log(`    ERROR: ${s.error_message}`);
}
