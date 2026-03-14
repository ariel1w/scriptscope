'use client';

import { useEffect, useState, useRef } from 'react';

interface NewsletterModalProps {
  triggerType: 'timed' | 'exit';
}

const COPY = {
  headline: 'Free Tips From Working Screenwriters',
  body: 'Join 5,000+ writers getting weekly script tips, craft breakdowns, and industry insights — written by an Emmy-winning producer and our growing community. Free, always.',
  multilingual: 'Submit scripts in any language. Coverage delivered in English.',
  placeholder: 'Your email address',
  button: 'Get the tips',
  finePrint: 'No spam. Unsubscribe anytime.',
  dismiss: "No thanks, I'll figure it out myself.",
};

export default function NewsletterModal({ triggerType }: NewsletterModalProps) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const triggered = useRef(false);

  useEffect(() => {
    // Don't show if already subscribed
    if (localStorage.getItem('newsletter_subscribed') === 'true') return;

    if (triggerType === 'timed') {
      // Don't show if already shown this session
      if (sessionStorage.getItem('newsletter_modal_shown')) return;

      const timer = setTimeout(() => {
        if (triggered.current) return;
        triggered.current = true;
        sessionStorage.setItem('newsletter_modal_shown', 'true');
        setVisible(true);
      }, 30000);

      return () => clearTimeout(timer);
    }

    if (triggerType === 'exit') {
      // Don't show if timed modal already showed this session
      if (sessionStorage.getItem('newsletter_modal_shown')) return;
      // Don't show if exit intent already showed this session
      if (sessionStorage.getItem('exit_intent_shown')) return;

      const handleMouseMove = (e: MouseEvent) => {
        if (triggered.current) return;
        if (e.clientY < 20) {
          // Re-check in case timed fired while we waited
          if (sessionStorage.getItem('newsletter_modal_shown')) return;
          triggered.current = true;
          sessionStorage.setItem('exit_intent_shown', 'true');
          setVisible(true);
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [triggerType]);

  const handleClose = () => setVisible(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Subscribe failed');
      localStorage.setItem('newsletter_subscribed', 'true');
      setSuccess(true);
      setTimeout(() => setVisible(false), 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const isTimed = triggerType === 'timed';

  return (
    <div
      className={`fixed inset-0 z-50 flex ${isTimed ? 'items-center justify-center' : 'items-start justify-center'}`}
      style={{ animation: isTimed ? 'modalFadeIn 0.4s ease-out' : undefined }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 bg-[#0a1628] border border-[#c9a962]/30 rounded-2xl p-6 sm:p-8 shadow-2xl"
        style={{
          animation: isTimed
            ? 'modalCardFadeIn 0.4s ease-out'
            : 'modalSlideDown 0.4s ease-out',
          marginTop: isTimed ? undefined : '4rem',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>

        {/* Gold accent line */}
        <div className="w-12 h-0.5 bg-gradient-to-r from-[#c9a962] to-[#d4b876] mb-5" />

        {success ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">✓</div>
            <p className="text-white text-lg font-semibold font-serif">
              You&apos;re in! Check your inbox.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-3 leading-tight">
              {COPY.headline}
            </h2>
            <p className="text-sm sm:text-base text-gray-300 mb-3 leading-relaxed">
              {COPY.body}
            </p>
            <p className="text-xs text-gray-400 mb-5">{COPY.multilingual}</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={COPY.placeholder}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-[#c9a962]/30 text-white placeholder-gray-400 focus:outline-none focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] transition-colors text-sm"
              />
              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full py-3 rounded-lg font-semibold text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing up…' : COPY.button}
              </button>
            </form>

            <p className="text-gray-500 text-xs mt-3 text-center">{COPY.finePrint}</p>

            <button
              onClick={handleClose}
              className="block w-full text-center text-gray-500 hover:text-gray-300 text-xs mt-4 transition-colors underline underline-offset-2"
            >
              {COPY.dismiss}
            </button>
          </>
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
        @keyframes modalSlideDown {
          from { opacity: 0; transform: translateY(-40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
