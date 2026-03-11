import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync(new URL('../.env.local', import.meta.url), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

// Fetch all rows from last 7 days (no limit)
const { data: views, error } = await supabase
  .from('page_views')
  .select('page_path, visitor_id, referrer, user_agent, created_at')
  .gte('created_at', oneWeekAgo)
  .order('created_at', { ascending: false });

if (error) { console.error('Error:', error.message); process.exit(1); }

// Sample row to confirm columns
if (views.length > 0) {
  console.log('Sample row:', JSON.stringify(views[0], null, 2));
}

// Filter bots
const bots = views.filter(v => /vercel-screenshot|Googlebot|bot|crawler|spider/i.test(v.user_agent || ''));
const humans = views.filter(v => !/vercel-screenshot|Googlebot|bot|crawler|spider/i.test(v.user_agent || ''));
const humanVisitors = new Set(humans.map(v => v.visitor_id).filter(Boolean));

console.log('\n=== LAST 7 DAYS ===');
console.log('Total page views:      ', views.length);
console.log('Bot views filtered:    ', bots.length);
console.log('Human page views:      ', humans.length);
console.log('Unique human visitors: ', humanVisitors.size);

// Page breakdown
const byPage = {};
for (const r of humans) {
  const p = r.page_path || '(no path recorded)';
  byPage[p] = (byPage[p] || 0) + 1;
}
console.log('\n── Page breakdown ───────────────────────────────────────');
Object.entries(byPage)
  .sort((a, b) => b[1] - a[1])
  .forEach(([p, n]) => console.log('  ' + String(n).padStart(4) + '  ' + p));

// Daily breakdown
const byDay = {};
for (const r of humans) {
  const d = r.created_at.slice(0, 10);
  byDay[d] = (byDay[d] || 0) + 1;
}
console.log('\n── Views by day ─────────────────────────────────────────');
Object.entries(byDay).sort().forEach(([d, n]) => {
  const bar = '█'.repeat(Math.round(n / 3));
  console.log('  ' + d + '  ' + String(n).padStart(3) + '  ' + bar);
});

// Device breakdown
const windows = humans.filter(v => /Windows/i.test(v.user_agent || '')).length;
const mac = humans.filter(v => /Mac OS X/i.test(v.user_agent || '') && !/iPhone|iPad/i.test(v.user_agent || '')).length;
const mobile = humans.filter(v => /iPhone|iPad|Android/i.test(v.user_agent || '')).length;
const linux = humans.filter(v => /Linux/i.test(v.user_agent || '') && !/Android/i.test(v.user_agent || '')).length;
console.log('\n── Device breakdown ─────────────────────────────────────');
console.log('  Windows:', windows, '| Mac:', mac, '| Mobile:', mobile, '| Linux:', linux);

// Referrers
const byRef = {};
for (const r of humans) {
  const ref = (r.referrer && r.referrer.trim()) ? r.referrer : '(direct / no referrer)';
  byRef[ref] = (byRef[ref] || 0) + 1;
}
console.log('\n── Top referrers ────────────────────────────────────────');
Object.entries(byRef)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([r, n]) => console.log('  ' + String(n).padStart(4) + '  ' + r));
