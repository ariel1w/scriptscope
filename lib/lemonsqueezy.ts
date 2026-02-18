import crypto from 'crypto';

export interface LemonSqueezyCheckoutConfig {
  variantId: string;
  email?: string;
  successUrl: string;
  customData?: Record<string, any>;
}

export interface LemonSqueezyWebhookEvent {
  meta: {
    event_name: string;
    custom_data?: Record<string, any>;
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      user_email: string;
      first_order_item: {
        variant_id: number;
        price: number;
      };
      total: number;
    };
  };
}

// Product variant IDs from Lemon Squeezy
export const LEMONSQUEEZY_VARIANTS = {
  BASIC: '836028',
  PROFESSIONAL: '836037',
  BUNDLE: '836040',
};

// Credit mapping for each product
export const LEMONSQUEEZY_CREDITS: Record<string, number> = {
  [LEMONSQUEEZY_VARIANTS.BASIC]: 1,
  [LEMONSQUEEZY_VARIANTS.PROFESSIONAL]: 3,
  [LEMONSQUEEZY_VARIANTS.BUNDLE]: 10,
};

// Verify Lemon Squeezy webhook signature
export function verifyLemonSqueezyWebhook(signature: string, body: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const digest = hmac.digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}
