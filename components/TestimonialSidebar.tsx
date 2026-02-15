'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Review {
  id: string;
  imdb_url: string;
  testimonial: string;
}

export default function TestimonialSidebar() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews?status=approved');
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractNameFromImdb = (url: string): string => {
    const parts = url.split('/');
    const nameId = parts.find((p) => p.startsWith('nm'));
    return nameId ? `Industry Pro ${nameId.substring(2, 6)}` : 'Industry Professional';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-premium p-6 animate-pulse border border-gray-100">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Show CTA when no approved reviews
  if (reviews.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0a1628] to-[#1a2f4a] rounded-xl shadow-premium-lg p-8 text-white border border-[#c9a962]/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a962]/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="text-5xl mb-4">⭐</div>
          <h3 className="text-xl font-serif font-bold mb-3">Industry Professional?</h3>
          <p className="text-sm mb-6 opacity-90 leading-relaxed">
            Share your experience and receive complimentary script analysis
          </p>
          <Link
            href="/review"
            className="block w-full btn-gold text-center py-3 rounded-lg font-semibold"
          >
            Claim Free Analysis →
          </Link>
        </div>
      </div>
    );
  }

  // Show approved reviews
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-serif font-bold text-[#0a1628] mb-6">Industry Voices</h3>
      {reviews.slice(0, 3).map((review) => (
        <div key={review.id} className="bg-white rounded-xl shadow-premium p-6 border border-gray-100 hover:shadow-premium-lg transition-all duration-300">
          <p className="text-gray-700 text-sm mb-4 italic leading-relaxed">"{review.testimonial}"</p>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <a
              href={review.imdb_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#c9a962] hover:text-[#b89850] font-semibold transition-colors"
            >
              {extractNameFromImdb(review.imdb_url)}
            </a>
            <a
              href={review.imdb_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-[#c9a962] transition-colors"
            >
              IMDB →
            </a>
          </div>
        </div>
      ))}
      <div className="text-center pt-4">
        <Link
          href="/review"
          className="text-sm text-[#c9a962] hover:text-[#b89850] font-semibold transition-colors"
        >
          Share Your Experience →
        </Link>
      </div>
    </div>
  );
}
