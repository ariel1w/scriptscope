// Paddle SDK integration
// Note: Using Paddle's checkout.js on the frontend and webhook verification on backend

export interface PaddleCheckoutConfig {
  priceId: string;
  email?: string;
  successUrl: string;
  customData?: Record<string, any>;
}

export interface PaddleWebhookEvent {
  event_type: string;
  data: {
    id: string;
    status: string;
    customer: {
      email: string;
    };
    items: Array<{
      price: {
        id: string;
      };
      quantity: number;
    }>;
    custom_data?: Record<string, any>;
  };
}

// Price IDs - these will need to be set up in Paddle dashboard
export const PADDLE_PRICES = {
  SINGLE: process.env.NEXT_PUBLIC_PADDLE_PRICE_SINGLE || 'pri_single',
  THREE_PACK: process.env.NEXT_PUBLIC_PADDLE_PRICE_THREE || 'pri_three',
  TEN_PACK: process.env.NEXT_PUBLIC_PADDLE_PRICE_TEN || 'pri_ten',
};

export const PADDLE_CREDITS = {
  [PADDLE_PRICES.SINGLE]: 1,
  [PADDLE_PRICES.THREE_PACK]: 3,
  [PADDLE_PRICES.TEN_PACK]: 10,
};

export function verifyPaddleWebhook(signature: string, body: string): boolean {
  // Implement Paddle signature verification
  // This is a placeholder - actual implementation depends on Paddle's verification method
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET!;
  // TODO: Implement actual verification logic based on Paddle docs
  return true;
}
