'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  source: string;
  onClose: () => void;
  prefillEmail?: string;
}

export default function BetaModal({ source, onClose, prefillEmail = '' }: Props) {
  const [email, setEmail] = useState(prefillEmail);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none font-light"
          aria-label="Close"
        >
          &times;
        </button>

        {!submitted ? (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎬</div>
              <h2 className="text-2xl font-serif font-bold text-[#0a1628] mb-3">
                We're not open yet
              </h2>
              <p className="text-gray-600 leading-relaxed">
                ScriptScope launches soon. Leave your email and we'll let you know the moment we go live — plus you'll get an{' '}
                <span className="font-semibold text-[#0a1628]">exclusive early-bird discount</span>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                autoFocus={!prefillEmail}
              />

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 btn-gold rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Notify Me'}
              </button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                We'll only email you about our launch and screenwriting tips.{' '}
                Unsubscribe anytime.
              </p>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-serif font-bold text-[#0a1628] mb-3">
              You're on the list!
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We'll notify you the moment we launch. In the meantime, join our free screenwriting community.
            </p>
            <Link
              href="/blog"
              onClick={onClose}
              className="btn-gold px-8 py-3 rounded-lg font-semibold inline-block"
            >
              Join the Community →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
