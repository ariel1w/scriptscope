'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie-accepted');
    if (!accepted) {
      setDismissed(false);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-accepted', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-xs bg-white shadow-lg rounded-lg p-4 text-sm border border-gray-200 z-50">
      <p className="text-gray-600">
        We use cookies for essential site functions.{' '}
        <Link href="/privacy" className="underline hover:text-[#1E3A5F]">
          Learn more
        </Link>
      </p>
      <button
        onClick={accept}
        className="mt-2 text-[#1E3A5F] font-medium hover:underline"
      >
        Got it
      </button>
    </div>
  );
}
