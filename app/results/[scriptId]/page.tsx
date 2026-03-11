'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Results from '@/components/Results';

type Status = 'loading' | 'processing' | 'completed' | 'failed' | 'unauthorized';

export default function ResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const scriptId = params.scriptId as string;

  const [status, setStatus] = useState<Status>('loading');
  const [analysis, setAnalysis] = useState<any>(null);
  const [scriptTitle, setScriptTitle] = useState('');
  const [error, setError] = useState('');

  // Route protection
  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirectAfterLogin', `/results/${scriptId}`);
      router.push('/login');
    }
  }, [user, authLoading, router, scriptId]);

  useEffect(() => {
    if (!scriptId || authLoading || !user) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/script-status?scriptId=${scriptId}&userId=${user.id}`);
        const data = await response.json();

        if (!response.ok) {
          setStatus('failed');
          setError('Script not found');
          return;
        }

        setScriptTitle(data.title);

        if (data.status === 'completed' && data.analysis) {
          setAnalysis(data.analysis);
          setStatus('completed');
        } else if (data.status === 'failed') {
          setStatus('failed');
          setError(data.error_message || 'Analysis failed');
        } else if (data.status === 'processing' || data.status === 'uploaded') {
          setStatus('processing');
          // Check again in 10 seconds
          setTimeout(checkStatus, 10000);
        }
      } catch (err) {
        console.error('Error checking status:', err);
        setStatus('failed');
        setError('Failed to load report');
      }
    };

    checkStatus();
  }, [scriptId, user, authLoading]);

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-premium p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-[#c9a962] mx-auto mb-6"></div>
            <p className="text-xl text-gray-600">Loading your report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-premium p-12 text-center">
            <div className="text-6xl mb-6">⏳</div>
            <h1 className="text-3xl font-serif font-bold text-[#0a1628] mb-4">
              Your Report is Being Prepared
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {scriptTitle && `Analyzing: ${scriptTitle}`}
            </p>
            <p className="text-gray-500 mb-8">
              This usually takes 5-10 minutes. We'll email you when it's ready.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-[#c9a962] to-[#b89850] h-2 rounded-full animate-progress"></div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes progress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 90%; }
          }
          .animate-progress {
            animation: progress 60s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-premium p-12 text-center border border-yellow-200">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-3xl font-serif font-bold text-[#0a1628] mb-4">
              Access Denied
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              You don't have permission to view this report.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/my-reports')}
                className="px-8 py-3 btn-gold rounded-lg font-semibold"
              >
                My Reports
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-premium p-12 text-center border border-red-200">
            <div className="text-6xl mb-6">❌</div>
            <h1 className="text-3xl font-serif font-bold text-red-600 mb-4">
              Analysis Failed
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {error || 'Something went wrong with the analysis.'}
            </p>
            <p className="text-sm text-gray-500 mb-8">
              We've been notified and are looking into it. Your credit has been refunded.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/analyze')}
                className="px-8 py-3 btn-gold rounded-lg font-semibold"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'completed' && analysis) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif font-bold text-[#0a1628] mb-2">
              Your Coverage Report
            </h1>
            {scriptTitle && (
              <p className="text-xl text-gray-600">{scriptTitle}</p>
            )}
          </div>
          <Results analysis={analysis} scriptId={scriptId} />
          <div className="text-center mt-8">
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
