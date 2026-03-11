import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import https from 'https';

const envContent = readFileSync('C:/Users/user/scriptscope/my-app/.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Check credits
const { data: credits } = await supabase
  .from('credits')
  .select('*')
  .eq('email', 'ariel@sipurstudios.com')
  .single();
console.log('Credits:', JSON.stringify(credits));

// Check LS orders
const orders = await new Promise((resolve) => {
  const options = {
    hostname: 'api.lemonsqueezy.com',
    path: '/v1/orders?filter[user_email]=ariel@sipurstudios.com',
    headers: {
      'Authorization': 'Bearer ' + env.LEMONSQUEEZY_API_KEY,
      'Accept': 'application/vnd.api+json'
    }
  };
  https.get(options, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => resolve(JSON.parse(data)));
  });
});

console.log('\nLS orders:', orders.data?.length ?? 0);
orders.data?.forEach(o => {
  const a = o.attributes;
  console.log('  Order', o.id, '| status:', a.status, '| total:', a.total_formatted, '| created:', a.created_at?.substring(0,16));
  console.log('  variant_id:', a.first_order_item?.variant_id);
});
