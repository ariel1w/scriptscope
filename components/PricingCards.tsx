'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';

interface PricingCardProps {
  title: string;
  price: string;
  credits: number;
  features: string[];
  priceId: string;
  popular?: boolean;
}

export default function PricingCards() {
  const { user } = useAuth();
  const [showFirstTimeOffer, setShowFirstTimeOffer] = useState(false);

  useEffect(() => {
    async function checkFirstTimeStatus() {
      if (!user?.id) {
        setShowFirstTimeOffer(false);
        return;
      }

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('first_discount_used')
          .eq('id', user.id)
          .single();

        // Show offer if user hasn't used first discount
        setShowFirstTimeOffer(Boolean(userData && !userData.first_discount_used));
      } catch (error) {
        console.error('Error checking first-time status:', error);
        setShowFirstTimeOffer(false);
      }
    }

    checkFirstTimeStatus();
  }, [user]);
  const plans: PricingCardProps[] = [
    {
      title: 'Single Analysis',
      price: '$39',
      credits: 1,
      features: ['1 Complete Coverage Report', 'Professional PDF Delivery', 'Emmy-Quality Methodology', '24-Hour Turnaround'],
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_SINGLE || 'pri_single',
    },
    {
      title: 'Professional',
      price: '$99',
      credits: 3,
      features: [
        '3 Coverage Reports',
        '$33 per analysis',
        'Priority Processing',
        'Professional PDF Delivery',
        'Emmy-Quality Methodology',
      ],
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_THREE || 'pri_three',
      popular: true,
    },
    {
      title: 'Production Company',
      price: '$249',
      credits: 10,
      features: [
        '10 Coverage Reports',
        '$24.90 per analysis',
        'Priority Processing',
        'Bulk Delivery Options',
        'Emmy-Quality Methodology',
      ],
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_TEN || 'pri_ten',
    },
  ];

  const handlePurchase = async (priceId: string) => {
    try {
      const email = prompt('Enter your email address:');
      if (!email) return;

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert('Failed to create checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to create checkout. Please try again.');
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.title}
          className={`relative bg-white rounded-xl shadow-premium p-8 border transition-all duration-300 hover:shadow-premium-lg ${
            plan.popular ? 'border-[#c9a962] ring-2 ring-[#c9a962]/20' : 'border-gray-200'
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#c9a962] to-[#d4b876] text-[#0a1628] px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">
              Most Popular
            </div>
          )}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-serif font-bold text-[#0a1628] mb-4">{plan.title}</h3>
            <div className="mb-2">
              <span className="text-5xl font-serif font-bold text-[#0a1628]">{plan.price}</span>
            </div>
            <div className="text-gray-600">{plan.credits} credit{plan.credits > 1 ? 's' : ''}</div>
          </div>
          <ul className="space-y-4 mb-8">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-[#c9a962] mr-3 mt-0.5">✓</span>
                <span className="text-gray-700 leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>

          {/* First-time offer banner for Professional and Production Company */}
          {showFirstTimeOffer && plan.credits > 1 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-[#0a1628] mb-2 font-medium">
                💡 Want to try ScriptScope first?
              </p>
              <p className="text-xs text-gray-600 mb-3">
                Get your first Basic analysis for just $10 before committing.
              </p>
              <Link
                href="/analyze"
                className="block w-full py-2 px-3 bg-white border-2 border-blue-300 text-[#0a1628] rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors text-center"
              >
                Try Basic First ($10)
              </Link>
            </div>
          )}

          <button
            onClick={() => handlePurchase(plan.priceId)}
            className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 ${
              plan.popular
                ? 'btn-gold'
                : 'bg-[#0a1628] text-white hover:bg-[#1a2f4a]'
            }`}
          >
            Select Plan
          </button>
        </div>
      ))}
    </div>
  );
}
