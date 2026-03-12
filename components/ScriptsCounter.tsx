'use client';

import { useState, useEffect } from 'react';

interface Props {
  variant?: 'light' | 'dark';
}

export default function ScriptsCounter({ variant = 'light' }: Props) {
  const [count, setCount] = useState<number>(25);

  const fetchCount = () => {
    fetch('/api/stats/scripts-today')
      .then(r => r.json())
      .then(data => {
        if (typeof data.count === 'number') setCount(data.count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  const labelClass = variant === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const countClass = variant === 'dark' ? 'text-gray-200' : 'text-gray-700';

  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
      </span>
      <span className={`text-sm ${labelClass}`}>
        <span className={`font-semibold ${countClass}`}>{count}</span> scripts analyzed in the last 24 hours
      </span>
    </div>
  );
}
