'use client';

import { useEffect, useState } from 'react';

export default function ScriptsAnalyzedToday() {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/stats/today');
      const data = await response.json();
      setCount(data.count);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch script count:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 text-gray-300">
        <div className="animate-pulse">
          <span className="font-serif font-semibold text-[#c9a962] text-2xl">---</span>
          <span className="ml-2">scripts analyzed today</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 text-gray-200">
      <div className="flex items-center gap-3">
        {/* Live pulsing indicator */}
        <div className="relative flex items-center justify-center">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#c9a962] live-indicator"></span>
        </div>
        <span className="font-serif font-semibold text-[#c9a962] text-2xl">
          {count?.toLocaleString() || '0'}
        </span>
        <span className="text-gray-300">scripts analyzed today</span>
      </div>
    </div>
  );
}
