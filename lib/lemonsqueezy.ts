const LS_BASE = 'https://api.lemonsqueezy.com';

export const LS_VARIANTS: Record<string, { variantId: number; credits: number; name: string; isVip?: boolean }> = {
  single:      { variantId: 1343976, credits: 1,  name: 'ScriptScope Basic Analysis' },
  three_pack:  { variantId: 1343978, credits: 3,  name: 'ScriptScope 3-Pack' },
  ten_pack:    { variantId: 1343980, credits: 10, name: 'ScriptScope 10-Pack' },
  vip:         { variantId: 0,       credits: 1,  name: 'ScriptScope VIP Session', isVip: true },
};

export async function createCheckoutUrl(variantId: number, email: string, redirectUrl?: string, scriptId?: string): Promise<string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey || !storeId) throw new Error('Lemon Squeezy credentials not configured');

  const attributes: Record<string, unknown> = {
    checkout_data: {
      email,
      ...(scriptId ? { custom: { script_id: scriptId } } : {}),
    },
  };
  attributes.checkout_options = { discount: true };
  if (redirectUrl) attributes.product_options = { redirect_url: redirectUrl };

  const res = await fetch(`${LS_BASE}/v1/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes,
        relationships: {
          store: { data: { type: 'stores', id: String(storeId) } },
          variant: { data: { type: 'variants', id: String(variantId) } },
        },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`LS checkout failed: ${JSON.stringify(data)}`);
  return data.data.attributes.url;
}
