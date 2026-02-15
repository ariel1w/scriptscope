'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Review {
  id: string;
  email: string;
  imdb_url: string;
  testimonial: string;
  status: string;
  created_at: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReviews();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check - real auth happens on the API
    if (password) {
      setIsAuthenticated(true);
      fetchReviews();
    }
  };

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reviews?status=pending');
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setMessage({ type: 'error', text: 'Failed to load reviews' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (reviewId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        // Refresh reviews
        fetchReviews();
      } else {
        if (response.status === 401) {
          setIsAuthenticated(false);
          setMessage({ type: 'error', text: 'Invalid password' });
        } else {
          setMessage({ type: 'error', text: data.error || 'Action failed' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-[#1E3A5F] mb-6 text-center">Admin Login</h1>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#1E3A5F] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#152d47] transition-colors"
              >
                Login
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-[#1E3A5F]">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#1E3A5F]">Review Management</h1>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-[#1E3A5F]"
          >
            ← Back to Home
          </Link>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A5F] mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No pending reviews</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1E3A5F] mb-2">Review Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Email:</span> {review.email}
                      </div>
                      <div>
                        <span className="font-medium">IMDB:</span>{' '}
                        <a
                          href={review.imdb_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1E3A5F] hover:underline"
                        >
                          {review.imdb_url}
                        </a>
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span>{' '}
                        {new Date(review.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#1E3A5F] mb-2">Testimonial</h3>
                    <p className="text-gray-700 italic">"{review.testimonial}"</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleAction(review.id, 'approve')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    ✓ Approve & Grant Credit
                  </button>
                  <button
                    onClick={() => handleAction(review.id, 'reject')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
