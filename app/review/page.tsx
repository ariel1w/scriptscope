'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ReviewPage() {
  const [email, setEmail] = useState('');
  const [imdbUrl, setImdbUrl] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, imdbUrl, testimonial }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setEmail('');
        setImdbUrl('');
        setTestimonial('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Submission failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1E3A5F] mb-4">
            Get a Free Script Analysis
          </h1>
          <p className="text-lg text-gray-600">
            Work in the industry? Share your thoughts on ScriptScope and receive a free script analysis!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#1E3A5F] mb-2">How It Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Submit your IMDB profile and a short testimonial</li>
              <li>We'll review your submission (usually within 24 hours)</li>
              <li>Once approved, you'll receive 1 free credit for a full script analysis</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="imdb" className="block text-sm font-medium text-gray-700 mb-2">
                IMDB Profile URL *
              </label>
              <input
                type="url"
                id="imdb"
                value={imdbUrl}
                onChange={(e) => setImdbUrl(e.target.value)}
                placeholder="https://www.imdb.com/name/nm1234567/"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be a valid IMDB profile starting with https://www.imdb.com/name/
              </p>
            </div>

            <div>
              <label htmlFor="testimonial" className="block text-sm font-medium text-gray-700 mb-2">
                Your Testimonial * ({testimonial.length}/280)
              </label>
              <textarea
                id="testimonial"
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                placeholder="Share your experience with ScriptScope..."
                maxLength={280}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Brief testimonial about your experience (max 280 characters)
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll send your free credit to this email once approved
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#1E3A5F] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#152d47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <Link
                href="/"
                className="px-6 py-3 rounded-lg font-medium border-2 border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Requirements:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Valid IMDB profile with credits</li>
              <li>✓ Genuine testimonial (we verify manually)</li>
              <li>✓ Limit: One free analysis per IMDB profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
