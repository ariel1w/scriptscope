'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import UploadZone from '@/components/UploadZone';
import ScriptsCounter from '@/components/ScriptsCounter';

type Step = 'loading' | 'upload' | 'email' | 'uploading' | 'package' | 'success' | 'error';

const PACKAGES = [
  {
    key: 'single',
    title: 'Single',
    price: '$39',
    sub: '1 coverage report',
  },
  {
    key: 'three_pack',
    title: '3-Pack',
    price: '$75',
    sub: '$25 per report',
    badge: 'Best Value',
    popular: true,
  },
  {
    key: 'ten_pack',
    title: '10-Pack',
    price: '$150',
    sub: '$15 per report',
  },
];

export default function AnalyzePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [scriptId, setScriptId] = useState('');
  const [hasCredits, setHasCredits] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/analyze');
      router.push('/login');
      return;
    }
    setEmail(user.email ?? '');
    fetch('/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, action: 'check' }),
    })
      .then(r => r.json())
      .then(data => {
        setHasCredits(!!data.hasAccess);
        setCreditsRemaining(data.credits ?? 0);
      })
      .catch(() => {})
      .finally(() => setStep('upload'));
  }, [user, authLoading, router]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setStep('email');
  };

  const uploadFile = async (): Promise<string> => {
    if (!selectedFile || !user) throw new Error('No file selected');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('email', email);
    formData.append('userId', user.id);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.scriptId;
  };

  const handleContinue = async () => {
    setStep('uploading');
    try {
      setMessage('Uploading your script...');
      const sid = await uploadFile();
      setScriptId(sid);

      if (hasCredits) {
        setMessage('Starting analysis...');
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptId: sid, email, promoDiscount: 0 }),
        });
        setStep('success');
      } else {
        setStep('package');
      }
    } catch (err) {
      console.error(err);
      setStep('error');
      setMessage('Upload failed. Please try again.');
    }
  };

  const handlePackageClick = async (variantKey: string) => {
    setCheckingOut(true);
    try {
      const redirectUrl = `${window.location.origin}/results/${scriptId}`;
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantKey, email, scriptId, redirectUrl }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setStep('error');
        setMessage('Could not start checkout. Please try again.');
      }
    } catch {
      setStep('error');
      setMessage('Could not start checkout. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (authLoading || step === 'loading') {
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
          <p className="text-xl text-gray-600">Professional coverage in minutes. Emmy-winning methodology.</p>
          {creditsRemaining > 0 && (
            <div className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full bg-[#c9a962]/10 border border-[#c9a962]/30">
              <span className="text-[#c9a962] text-lg">✓</span>
              <span className="text-[#0a1628] font-semibold">
                You have <span className="text-[#c9a962]">{creditsRemaining} {creditsRemaining === 1 ? 'analysis' : 'analyses'}</span> remaining
              </span>
            </div>
          )}
          <div className="mt-4 flex justify-center">
            <ScriptsCounter />
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <UploadZone onFileSelect={handleFileSelect} disabled={false} />
        )}

        {/* Step 2: Email */}
        {step === 'email' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-premium p-8 border border-gray-200">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-lg font-semibold text-[#0a1628] mb-1">{selectedFile?.name}</p>
                <p className="text-sm text-gray-500">File ready</p>
              </div>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-semibold text-[#0a1628] mb-2">
                  Email to receive your report
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a962] focus:border-transparent"
                  onKeyDown={(e) => { if (e.key === 'Enter' && email) handleContinue(); }}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('upload'); setSelectedFile(null); }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleContinue}
                  disabled={!email}
                  className="flex-1 px-6 py-3 btn-gold rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasCredits ? 'Start Analysis' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Uploading spinner */}
        {step === 'uploading' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-premium p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#c9a962] mx-auto mb-6"></div>
              <p className="text-xl text-gray-600">{message}</p>
            </div>
          </div>
        )}

        {/* Step 3: Package selection */}
        {step === 'package' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif font-bold text-[#0a1628] mb-2">Choose Your Package</h2>
              <p className="text-gray-600">
                Your script is uploaded. Select a package — after payment your analysis starts automatically.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 mb-6">
              {PACKAGES.map((pkg) => (
                <div
                  key={pkg.key}
                  className={`relative rounded-xl border-2 p-6 flex flex-col transition-all duration-300 ${
                    pkg.popular
                      ? 'bg-white border-[#c9a962] ring-2 ring-[#c9a962]/20 shadow-premium-lg'
                      : 'bg-white border-gray-200 shadow-premium hover:shadow-premium-lg'
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#c9a962] to-[#d4b876] text-[#0a1628] px-5 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                      {pkg.badge}
                    </div>
                  )}
                  <div className="text-center mb-5 flex-1">
                    <h3 className="text-xl font-serif font-bold text-[#0a1628] mb-3">{pkg.title}</h3>
                    <div className="text-5xl font-serif font-bold text-[#0a1628] mb-1">{pkg.price}</div>
                    <p className="text-sm text-[#c9a962] font-semibold mt-1">{pkg.sub}</p>
                  </div>
                  <button
                    onClick={() => handlePackageClick(pkg.key)}
                    disabled={checkingOut}
                    className="w-full py-3 rounded-lg font-semibold btn-gold disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {checkingOut ? 'Loading...' : 'Select & Pay'}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500">
              Secure checkout · 14-day refund guarantee · Emmy-winning methodology
            </p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-premium p-12 text-center border border-green-200">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="text-3xl font-serif font-bold text-[#0a1628] mb-4">Script Submitted!</h2>
              <p className="text-lg text-gray-600 mb-2">We're analyzing your script now.</p>
              <p className="text-gray-500 mb-8">
                <strong>We'll email you when your report is ready</strong> (usually 5–10 minutes)
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-800">
                  <strong>Check your inbox:</strong> {email}
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
                  setEmail(user?.email ?? '');
                  setScriptId('');
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
