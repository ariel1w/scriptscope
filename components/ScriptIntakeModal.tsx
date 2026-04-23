'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

const FORMATS = [
  'Feature Film',
  'TV Pilot',
  'Short Film',
  'Limited Series',
  'Other',
];

const CONCERNS = [
  { key: 'structure', label: 'Is my structure working?' },
  { key: 'characters', label: 'Are my characters strong enough?' },
  { key: 'sell', label: 'Will this sell?' },
  { key: 'fresh_eyes', label: "I just finished \u2014 I need fresh eyes" },
  { key: 'feedback', label: 'I need professional feedback before I send it out' },
];

const PERSONALIZED_MESSAGES: Record<string, string> = {
  structure:
    'Structure makes or breaks a script. Our Emmy-winning methodology maps your entire architecture \u2014 act breaks, pacing, turning points \u2014 in under 5 minutes.',
  characters:
    "Characters are what the audience remembers. We\u2019ll evaluate your protagonist\u2019s arc, goals, flaws, and every supporting role.",
  sell:
    'We assess commercial viability, genre positioning, and market potential \u2014 the same lens a development exec uses.',
  fresh_eyes:
    'Fresh eyes, zero bias. Get professional-depth coverage before you share it with anyone.',
  feedback:
    "Don\u2019t send it out without coverage. See exactly what a reader will think \u2014 and fix it first.",
};

type Step = 'format' | 'concern' | 'cta';

export default function ScriptIntakeModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>('format');
  const [, setFormat] = useState('');
  const [concern, setConcern] = useState('');
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState('');
  const triggered = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show on homepage
    if (pathname !== '/') return;
    // Don't show if already seen this session
    if (sessionStorage.getItem('intake_modal_shown')) return;
    // Don't show if already subscribed
    if (localStorage.getItem('newsletter_subscribed') === 'true') return;

    const timer = setTimeout(() => {
      if (triggered.current) return;
      triggered.current = true;
      sessionStorage.setItem('intake_modal_shown', 'true');
      setVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [pathname]);

  const handleClose = () => setVisible(false);

  const handleFormatSelect = (f: string) => {
    setFormat(f);
    setStep('concern');
  };

  const handleConcernSelect = (key: string) => {
    setConcern(key);
    setStep('cta');
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    setSubError('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Subscribe failed');
      localStorage.setItem('newsletter_subscribed', 'true');
      setSubscribed(true);
      setTimeout(() => setVisible(false), 2000);
    } catch {
      setSubError('Something went wrong. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ animation: 'modalFadeIn 0.4s ease-out' }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 bg-[#0a1628] border border-[#c9a962]/30 rounded-2xl p-6 sm:p-8 shadow-2xl"
        style={{ animation: 'modalCardFadeIn 0.4s ease-out' }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Progress dots */}
        <div className="flex gap-2 mb-6">
          {['format', 'concern', 'cta'].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= ['format', 'concern', 'cta'].indexOf(step)
                  ? 'bg-gradient-to-r from-[#c9a962] to-[#d4b876]'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Format */}
        {step === 'format' && (
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2">
              What are you working on?
            </h2>
            <p className="text-sm text-gray-400 mb-5">
              Tell us about your project
            </p>
            <div className="space-y-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => handleFormatSelect(f)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-white/10 text-white hover:border-[#c9a962]/50 hover:bg-white/5 transition-all text-sm sm:text-base"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Concern */}
        {step === 'concern' && (
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2">
              What&apos;s your biggest concern right now?
            </h2>
            <p className="text-sm text-gray-400 mb-5">
              We&apos;ll show you how we can help
            </p>
            <div className="space-y-2">
              {CONCERNS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => handleConcernSelect(c.key)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-white/10 text-white hover:border-[#c9a962]/50 hover:bg-white/5 transition-all text-sm sm:text-base"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: CTA */}
        {step === 'cta' && (
          <div>
            {subscribed ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-4">&check;</div>
                <p className="text-white text-lg font-semibold font-serif">
                  You&apos;re in! Check your inbox.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed">
                  {PERSONALIZED_MESSAGES[concern]}
                </p>

                {/* Primary CTA */}
                <a
                  href="/analyze"
                  className="block w-full text-center btn-gold py-3 rounded-lg font-semibold text-sm sm:text-base mb-6"
                >
                  Get your first script analyzed &mdash; $10
                </a>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Community signup */}
                <p className="text-sm text-white font-semibold mb-2">
                  Join the free screenwriting community
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Weekly tips, craft breakdowns &amp; blog posts from an Emmy-winning producer
                </p>
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    required
                    className="flex-1 px-3 py-2.5 rounded-lg bg-white/10 border border-[#c9a962]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] transition-colors text-sm"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="px-4 py-2.5 rounded-lg bg-white/10 border border-[#c9a962]/30 text-[#c9a962] font-semibold text-sm hover:bg-white/15 transition-colors disabled:opacity-60"
                  >
                    {subscribing ? '...' : 'Join'}
                  </button>
                </form>
                {subError && (
                  <p className="text-red-400 text-xs mt-2">{subError}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">No spam. Unsubscribe anytime.</p>
              </>
            )}
          </div>
        )}

        {/* $10 CTA bar - visible on steps 1 and 2 */}
        {step !== 'cta' && (
          <a
            href="/analyze"
            className="block mt-5 pt-4 border-t border-white/10 text-center text-xs text-[#c9a962] hover:text-[#d4b876] transition-colors"
          >
            Ready now? Analyze your first script &mdash; just $10 &rarr;
          </a>
        )}
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalCardFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
