'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

const VIP_MAILTO = 'mailto:hello@scriptscope.online?subject=VIP%20Session%20Request&body=Hi%2C%20I%27d%20like%20to%20book%20a%20VIP%20Session%20(%24299).%20Please%20send%20me%20a%20payment%20link.';

interface Plan {
  title: string;
  price: string;
  perScript?: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  vip?: boolean;
  cta: string;
  variantKey: string;
}

const plans: Plan[] = [
  {
    title: 'Single',
    price: '$39',
    features: [
      '1 AI Coverage Report',
      'Full PDF delivery',
      'Emmy-winning methodology',
      'Fast turnaround',
    ],
    cta: 'Get Started',
    variantKey: 'single',
  },
  {
    title: '3-Pack',
    price: '$75',
    perScript: '$25 per script',
    features: [
      '3 AI Coverage Reports',
      'Save $42 vs. single',
      'Emmy-winning methodology',
      'Fast turnaround',
    ],
    badge: 'Best Value',
    popular: true,
    cta: 'Get Started',
    variantKey: 'three_pack',
  },
  {
    title: '10-Pack',
    price: '$150',
    perScript: '$15 per script',
    features: [
      '10 AI Coverage Reports',
      'Save $240 vs. single',
      'Emmy-winning methodology',
      'Fast turnaround',
    ],
    cta: 'Get Started',
    variantKey: 'ten_pack',
  },
  {
    title: 'VIP Session',
    price: '$299',
    features: [
      '1 AI Coverage Report',
      '45-min video consultation',
      'Emmy-winning founder, 1-on-1',
      'Insider development notes',
      'Scheduled within 24 hours',
    ],
    badge: 'Most Personal',
    vip: true,
    cta: 'Book VIP Session',
    variantKey: 'vip',
  },
];

export default function PricingCards({ redirectUrl }: { redirectUrl?: string } = {}) {
  const { user, loading, signInWithGoogle } = useAuth();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [error, setError] = useState('');

  // After returning from Google login, auto-trigger pending checkout
  useEffect(() => {
    if (!user || loading) return;
    const pending = sessionStorage.getItem('pendingCheckout');
    if (pending) {
      sessionStorage.removeItem('pendingCheckout');
      triggerCheckout(pending, user.email!);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const triggerCheckout = async (variantKey: string, email: string) => {
    setCheckingOut(variantKey);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantKey, email, redirectUrl }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError('Could not start checkout. Please try again.');
        setCheckingOut(null);
      }
    } catch {
      setError('Could not start checkout. Please try again.');
      setCheckingOut(null);
    }
  };

  const handlePlanClick = async (plan: Plan) => {
    setError('');

    // VIP opens email — no login required
    if (plan.vip) {
      window.location.href = VIP_MAILTO;
      return;
    }

    // Non-VIP plans require Google login first
    if (!user) {
      sessionStorage.setItem('pendingCheckout', plan.variantKey);
      await signInWithGoogle();
      return;
    }

    await triggerCheckout(plan.variantKey, user.email!);
  };

  return (
    <>
      {error && (
        <p className="text-center text-red-600 font-semibold mb-4">{error}</p>
      )}

      {/* 1 col mobile → 2×2 tablet → 4-in-a-row desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.title}
            className={`
              relative rounded-xl border-2 p-6 flex flex-col transition-all duration-300
              ${plan.vip
                ? 'bg-[#0a1628] border-[#c9a962]'
                : plan.popular
                  ? 'bg-white border-[#c9a962] ring-2 ring-[#c9a962]/20 shadow-premium-lg'
                  : 'bg-white border-gray-200 shadow-premium hover:shadow-premium-lg'
              }
            `}
            style={plan.vip ? { boxShadow: '0 20px 60px rgba(201,169,98,0.18)' } : undefined}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#c9a962] to-[#d4b876] text-[#0a1628] px-5 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                {plan.badge}
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-5">
              <h3 className={`text-xl font-serif font-bold mb-3 ${plan.vip ? 'text-white' : 'text-[#0a1628]'}`}>
                {plan.title}
              </h3>
              <div className={`text-5xl font-serif font-bold mb-1 ${plan.vip ? 'text-white' : 'text-[#0a1628]'}`}>
                {plan.price}
              </div>
              {plan.perScript && (
                <div className="text-sm text-[#c9a962] font-semibold mt-0.5">{plan.perScript}</div>
              )}
              {plan.vip && (
                <p className="text-[#c9a962] italic text-xs mt-3 leading-relaxed px-2">
                  "Put a face to the feedback."
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-5 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#c9a962] mt-0.5 shrink-0 text-sm">✓</span>
                  <span className={`text-sm leading-snug ${plan.vip ? 'text-gray-300' : 'text-gray-700'}`}>
                    {f}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => handlePlanClick(plan)}
              disabled={checkingOut !== null && !plan.vip}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${
                plan.vip || plan.popular
                  ? 'btn-gold'
                  : 'bg-[#0a1628] text-white hover:bg-[#1a2f4a]'
              }`}
            >
              {checkingOut === plan.variantKey ? 'Loading...' : plan.cta}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
