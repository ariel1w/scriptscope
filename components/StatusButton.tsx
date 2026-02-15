'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

interface Analysis {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export default function StatusButton() {
  const { user } = useAuth();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      setVisible(false);
      return;
    }

    checkForActiveAnalysis();

    // Poll every 10 seconds if processing
    const interval = setInterval(() => {
      if (analysis?.status === 'processing') {
        checkForActiveAnalysis();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, analysis?.status]);

  async function checkForActiveAnalysis() {
    if (!user?.id) return;

    try {
      // Get the most recent analysis for this user (by user_id only)
      const { data: scripts } = await supabase
        .from('scripts')
        .select('id, title, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!scripts || scripts.length === 0) {
        setVisible(false);
        setAnalysis(null);
        return;
      }

      const latest = scripts[0];

      // Only show button if actively processing or recently completed (within 1 hour)
      if (latest.status === 'processing' || latest.status === 'uploaded') {
        setAnalysis(latest);
        setVisible(true);
      } else if (latest.status === 'completed') {
        const completedAt = new Date(latest.created_at);
        const hoursSince = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);

        // Only show for 1 hour after completion, then hide
        if (hoursSince < 1) {
          setAnalysis(latest);
          setVisible(true);
        } else {
          setVisible(false);
          setAnalysis(null);
        }
      } else {
        setVisible(false);
        setAnalysis(null);
      }
    } catch (error) {
      console.error('Error checking analysis status:', error);
    }
  }

  if (!visible || !analysis) return null;

  const isProcessing = analysis.status === 'processing';
  const isComplete = analysis.status === 'completed';

  return (
    <button
      onClick={() => router.push(`/results/${analysis.id}`)}
      className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 ${
        isProcessing
          ? 'bg-blue-500 text-white'
          : 'bg-green-500 text-white animate-bounce'
      }`}
    >
      {isProcessing ? (
        <>
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          <span className="text-sm font-medium">Analyzing...</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium">Report ready!</span>
        </>
      )}
    </button>
  );
}
