'use client';

import { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage("You're in! Check your inbox for a welcome email.");
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 mt-6 max-w-xl mx-auto">
      <p className="text-gray-600 text-sm leading-relaxed mb-4">
        Join the newsletter — new posts every week with tips on craft, script analysis, and the writing life, straight to your inbox.
      </p>
      {status === 'success' ? (
        <p className="text-sm font-medium text-green-700">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-[#c9a962] text-[#0a1628] font-semibold text-sm px-5 py-2 rounded-lg hover:bg-[#b8944f] transition-colors disabled:opacity-60"
          >
            {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-600 mt-2">{message}</p>
      )}
    </div>
  );
}
