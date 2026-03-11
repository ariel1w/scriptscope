import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync('C:/Users/user/scriptscope/my-app/.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Credits for the owner email
const { data: credits } = await supabase
  .from('credits')
  .select('*')
  .eq('email', 'ariel1w@gmail.com')
  .single();
console.log('Credits for ariel1w@gmail.com:', JSON.stringify(credits, null, 2));

// EDEN script details (no raw_text)
const { data: eden } = await supabase
  .from('scripts')
  .select('id, title, status, email, error_message, created_at, processing_started_at, processing_completed_at, user_id')
  .ilike('title', '%eden%')
  .order('created_at', { ascending: false })
  .limit(5);
console.log('\nEDEN script details:', JSON.stringify(eden, null, 2));

// Daily stats (revenue / purchases)
const { data: stats } = await supabase
  .from('daily_stats')
  .select('*')
  .order('date', { ascending: false })
  .limit(7);
console.log('\nDaily stats (last 7 days):', JSON.stringify(stats, null, 2));
