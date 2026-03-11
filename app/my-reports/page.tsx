'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';


interface Script {
  id: string;
  title: string;
  created_at: string;
  status: string;
  analysis: any;
}

export default function MyReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirectAfterLogin', '/my-reports');
      router.push('/login');
      return;
    }

    if (user) {
      loadScripts();
    }
  }, [user, authLoading, router]);

  async function loadScripts() {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');

      const res = await fetch('/api/my-reports', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const json = await res.json();
      setScripts(json.scripts || []);
    } catch (error) {
      console.error('Error loading scripts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const getGrade = (script: Script) => {
    if (script.status !== 'completed' || !script.analysis) return null;
    return (
      script.analysis.page1_overview?.overallGrade ||
      script.analysis.developmentNotes?.overallGrade ||
      'N/A'
    );
  };

  const getScore = (script: Script) => {
    if (script.status !== 'completed' || !script.analysis) return null;
    return (
      script.analysis.page1_overview?.numericScore ||
      script.analysis.developmentNotes?.numericScore ||
      'N/A'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-[#1E3A5F] mb-2">My Reports</h1>
          <p className="text-gray-600">View and download all your script analyses</p>
        </div>

        {scripts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              You haven't analyzed any scripts yet
            </h3>
            <p className="text-gray-600 mb-6">Upload your first script to get started</p>
            <Link
              href="/analyze"
              className="inline-block bg-[#c9a962] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#b89552] transition-colors"
            >
              Analyze Your First Script
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {scripts.map((script) => (
              <div
                key={script.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#1E3A5F] mb-2">{script.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Submitted {new Date(script.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>

                    {script.status === 'completed' && (
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-sm">
                          <span className="text-gray-600">Grade:</span>{' '}
                          <span className="font-bold text-[#1E3A5F]">{getGrade(script)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Score:</span>{' '}
                          <span className="font-bold text-[#c9a962]">{getScore(script)}/10</span>
                        </div>
                      </div>
                    )}

                    {script.status === 'processing' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        Analyzing...
                      </div>
                    )}

                    {script.status === 'failed' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium mb-4">
                        Analysis failed
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {script.status === 'completed' && (
                      <>
                        <Link
                          href={`/results/${script.id}`}
                          className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#152d47] transition-colors text-center"
                        >
                          View Report
                        </Link>
                        <a
                          href={`/api/pdf?scriptId=${script.id}`}
                          className="px-4 py-2 border-2 border-[#1E3A5F] text-[#1E3A5F] rounded-lg text-sm font-medium hover:bg-[#1E3A5F] hover:text-white transition-colors text-center"
                        >
                          Download PDF
                        </a>
                      </>
                    )}

                    {script.status === 'processing' && (
                      <Link
                        href={`/results/${script.id}`}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors text-center"
                      >
                        Check Status
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
