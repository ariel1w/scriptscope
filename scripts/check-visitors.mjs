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

// ── Page views last 7 days ────────────────────────────────────────────────────
const { data: views, error: viewsErr } = await supabase
  .from('page_views')
  .select('*')
  .gte('created_at', oneWeekAgo)
  .order('created_at', { ascending: false });

if (viewsErr) {
  console.log('page_views error:', viewsErr.message);
  console.log('Hint:', viewsErr.hint);
} else {
  console.log(`\n── Page views (last 7 days) ─────────────────────────────`);
  console.log(`Total page views: ${views?.length ?? 0}`);

  if (views?.length) {
    console.log('Columns:', Object.keys(views[0]).join(', '));

    const sessions = new Set(views.map(v => v.session_id || v.ip || v.visitor_id).filter(Boolean));
    const ips = new Set(views.map(v => v.ip).filter(Boolean));
    console.log(`Unique sessions: ${sessions.size} | Unique IPs: ${ips.size}`);

    // By page
    const byPage = {};
    for (const v of views) {
      const p = v.path || v.page || v.url || v.pathname || '?';
      byPage[p] = (byPage[p] || 0) + 1;
    }
    console.log('\nPage breakdown (all pages):');
    Object.entries(byPage)
      .sort((a, b) => b[1] - a[1])
      .forEach(([p, n]) => console.log(`  ${String(n).padStart(4)}  ${p}`));

    // By day
    const byDay = {};
    for (const v of views) {
      const d = (v.created_at || '').substring(0, 10);
      byDay[d] = (byDay[d] || 0) + 1;
    }
    console.log('\nViews by day:');
    Object.entries(byDay)
      .sort()
      .forEach(([d, n]) => console.log(`  ${d}  ${n} views`));

    // Recent rows
    console.log('\nMost recent 20 views:');
    for (const v of views.slice(0, 20)) {
      const ts = (v.created_at || '').substring(0, 16);
      const path = v.path || v.page || v.url || v.pathname || '-';
      const ip = v.ip || v.visitor_id || '-';
      const ua = (v.user_agent || '').substring(0, 80);
      console.log(`  ${ts}  ${path.padEnd(25)}  ${ip}  ${ua}`);
    }
  }
}

// ── All-time total ────────────────────────────────────────────────────────────
const { count: totalCount, error: totalErr } = await supabase
  .from('page_views')
  .select('*', { count: 'exact', head: true });

console.log(`\n── All-time total page views: ${totalErr ? totalErr.message : totalCount}`);

// ── Auth users ────────────────────────────────────────────────────────────────
console.log('\n── Signed-up users ─────────────────────────────────────');
const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers();
if (usersErr) {
  console.log('Auth error:', usersErr.message);
} else {
  console.log(`Total signups: ${users?.length ?? 0}`);
  for (const u of (users || [])) {
    const created = u.created_at?.substring(0, 10);
    const signed = u.last_sign_in_at ? u.last_sign_in_at.substring(0, 16) : 'never';
    console.log(`  ${created}  ${u.email}  last login: ${signed}`);
  }
}

// ── Script analyses ───────────────────────────────────────────────────────────
console.log('\n── Script analyses submitted (all time) ────────────────');
const { data: scripts, error: scriptsErr } = await supabase
  .from('scripts')
  .select('id, created_at, status, email')
  .order('created_at', { ascending: false });

if (scriptsErr) {
  console.log('scripts table error:', scriptsErr.message);
} else {
  console.log(`Total submissions: ${scripts?.length ?? 0}`);
  for (const s of (scripts || [])) {
    console.log(`  ${s.created_at?.substring(0, 16)}  status:${s.status}  ${s.email || 'no email'}`);
  }
}
