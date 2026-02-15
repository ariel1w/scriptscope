'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import UploadZone from '@/components/UploadZone';
import ProgressBar from '@/components/ProgressBar';
import Results from '@/components/Results';

type Step = 'upload' | 'email' | 'promo' | 'uploading' | 'success' | 'error';

// Disable static generation for this auth-protected page
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function AnalyzePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [scriptId, setScriptId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [testKey, setTestKey] = useState<string | null>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);

  // Route protection
  useEffect(() => {
    if (!authLoading && !user) {
      sessionStorage.setItem('redirectAfterLogin', '/analyze');
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Pre-fill email from user
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Check if user is eligible for FIRST10 discount
  useEffect(() => {
    async function checkFirstTimeDiscount() {
      if (!user?.id) return;

      try {
        const { supabase } = await import('@/lib/supabase-client');
        const { data: userData } = await supabase
          .from('users')
          .select('first_discount_used')
          .eq('id', user.id)
          .single();

        // If user hasn't used first discount, auto-apply FIRST10
        if (userData && !userData.first_discount_used) {
          setPromoCode('FIRST10');
          setShowPromoInput(true);
          // Auto-validate the code
          await validatePromoCode('FIRST10');
        }
      } catch (error) {
        console.error('Error checking first-time discount:', error);
      }
    }

    checkFirstTimeDiscount();
  }, [user]);

  // Test mode support removed to fix build - re-add with Suspense if needed

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setStep('email');
  };

  const validatePromoCode = async (code: string) => {
    if (!code.trim()) return;

    setPromoValidating(true);
    setPromoMessage('');

    try {
      const response = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (data.valid) {
        setPromoDiscount(data.discount_percent);
        setPromoMessage('Promo code applied!');
      } else {
        setPromoDiscount(0);
        setPromoMessage('Invalid promo code');
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      setPromoMessage('Invalid promo code');
      setPromoDiscount(0);
    } finally {
      setPromoValidating(false);
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile || !email || !user) return;

    try {
      setStep('uploading');
      const isFree = testKey || promoDiscount === 100;

      // Check credits if not free
      if (!isFree) {
        setMessage('Checking credits...');

        const creditsResponse = await fetch('/api/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, action: 'check' }),
        });

        const creditsData = await creditsResponse.json();

        if (!creditsData.hasAccess) {
          setStep('error');
          setMessage('No credits available. Please purchase credits to continue.');
          setTimeout(() => {
            window.location.href = '/pricing';
          }, 2000);
          return;
        }
      }

      // Upload file
      setMessage('Uploading script...');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('email', email);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadData = await uploadResponse.json();
      setScriptId(uploadData.scriptId);

      // Trigger background analysis (don't wait for it)
      fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: uploadData.scriptId,
          email,
          testKey: testKey || undefined,
          promoDiscount: promoDiscount || 0
        }),
      }).catch(err => console.error('Analysis trigger failed:', err));

      // Show success immediately
      setStep('success');
      setMessage('Script uploaded successfully!');
    } catch (error) {
      console.error('Error:', error);
      setStep('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-serif font-bold text-[#0a1628] mb-4">Analyze Your Script</h1>
          <p className="text-xl text-gray-600">
            Professional coverage in minutes. First Basic analysis just $10!
          </p>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <UploadZone onFileSelect={handleFileSelect} disabled={false} />
        )}

        {/* Step 2: Email Input */}
        {step === 'email' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-premium p-8 border border-gray-200">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-lg font-semibold text-[#0a1628] mb-2">
                  {selectedFile?.name}
                </p>
                <p className="text-sm text-gray-500">File uploaded successfully</p>
              </div>

              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-semibold text-[#0a1628] mb-2">
                  Enter your email to receive the analysis
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email) {
                      setStep('promo');
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('upload');
                    setSelectedFile(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('promo')}
                  disabled={!email}
                  className="flex-1 px-6 py-3 btn-gold rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Promo Code (Optional) */}
        {step === 'promo' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-premium p-8 border border-gray-200">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-[#0a1628] mb-2">
                  Ready to analyze
                </h2>
                <p className="text-gray-600">
                  {selectedFile?.name} • {email}
                </p>
              </div>

              {!showPromoInput ? (
                <div className="text-center mb-6">
                  <button
                    onClick={() => setShowPromoInput(true)}
                    className="text-[#c9a962] hover:text-[#b89850] font-semibold transition-colors"
                  >
                    Have a promo code? →
                  </button>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[#0a1628] mb-2">
                    Promo Code
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          validatePromoCode(promoCode);
                        }
                      }}
                      placeholder="Enter promo code"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                      disabled={promoValidating}
                    />
                    <button
                      onClick={() => validatePromoCode(promoCode)}
                      disabled={promoValidating || !promoCode.trim()}
                      className="px-6 py-3 bg-[#0a1628] text-white rounded-lg font-semibold hover:bg-[#1a2f4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {promoValidating ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {promoMessage && (
                    <p
                      className={`mt-3 text-sm font-semibold ${
                        promoDiscount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {promoCode.toUpperCase() === 'FIRST10' && promoDiscount === 74
                        ? '🎁 First-time discount applied! Basic analysis for just $10'
                        : promoMessage}
                      {promoCode.toUpperCase() !== 'FIRST10' && promoDiscount > 0 && promoDiscount < 100 && ` (${promoDiscount}% off)`}
                      {promoDiscount === 100 && ' (Free analysis!)'}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('email')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={startAnalysis}
                  className="flex-1 px-6 py-3 btn-gold rounded-lg font-semibold"
                >
                  Start Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Uploading */}
        {step === 'uploading' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-premium p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-[#c9a962] mx-auto mb-6"></div>
              <p className="text-xl text-gray-600">{message}</p>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-premium p-12 text-center border border-green-200">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-3xl font-serif font-bold text-[#0a1628] mb-4">
                Script Uploaded Successfully!
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                We're analyzing your script now.
              </p>
              <p className="text-gray-500 mb-8">
                <strong>We'll email you when your report is ready</strong> (usually 5-10 minutes)
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-800">
                  <strong>Check your inbox:</strong> {email}
                  <br />
                  You'll receive a link to view and download your full coverage report.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                {scriptId && (
                  <button
                    onClick={() => window.location.href = `/results/${scriptId}`}
                    className="px-8 py-3 btn-gold rounded-lg font-semibold"
                  >
                    View Report Status
                  </button>
                )}
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-premium p-8 border border-red-200 text-center">
              <div className="text-5xl mb-4">❌</div>
              <p className="text-lg text-red-600 font-semibold mb-6">{message}</p>
              <button
                onClick={() => {
                  setStep('upload');
                  setSelectedFile(null);
                  setEmail('');
                  setPromoCode('');
                  setPromoDiscount(0);
                  setMessage('');
                }}
                className="px-8 py-3 btn-gold rounded-lg font-semibold"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
