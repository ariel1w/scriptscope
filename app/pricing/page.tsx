import PricingCards from '@/components/PricingCards';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a962]/30 bg-[#c9a962]/5 mb-6">
              <span className="text-[#c9a962] text-sm font-semibold tracking-wide">PREMIUM COVERAGE</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#0a1628] mb-6">
              Investment in Excellence
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Emmy-quality analysis at transparent, professional rates
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#c9a962]/10 to-[#d4b876]/10 border border-[#c9a962]/20">
              <span className="text-2xl">🎁</span>
              <p className="text-[#0a1628] font-semibold">
                Try your first Basic analysis for just $10 — use code <span className="font-mono bg-[#c9a962]/20 px-2 py-1 rounded">FIRST10</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingCards />
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-[#0a1628] mb-4 accent-line inline-block">
              Comprehensive Coverage
            </h2>
            <p className="text-xl text-gray-600 mt-8">
              Every dimension of your screenplay, professionally evaluated
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-premium p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-3xl">📋</div>
                <h3 className="text-2xl font-serif font-bold text-[#0a1628]">Complete Analysis</h3>
              </div>
              <ul className="text-gray-700 space-y-3 leading-relaxed">
                <li className="flex items-start">
                  <span className="text-[#c9a962] mr-2">•</span>
                  Logline & comprehensive synopsis
                </li>
                <li className="flex items-start">
                  <span className="text-[#c9a962] mr-2">•</span>
                  Story fundamentals: character architecture, structure, theme
                </li>
                <li className="flex items-start">
                  <span className="text-[#c9a962] mr-2">•</span>
                  Craft assessment: dialogue, tone, visual storytelling
                </li>
                <li className="flex items-start">
                  <span className="text-[#c9a962] mr-2">•</span>
                  Commercial viability & market positioning
                </li>
                <li className="flex items-start">
                  <span className="text-[#c9a962] mr-2">•</span>
                  Final recommendation with actionable insights
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-premium p-8 border border-gray-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-3xl">🔒</div>
                <h3 className="text-2xl font-serif font-bold text-[#0a1628]">Absolute Security</h3>
              </div>
              <ul className="text-gray-700 space-y-3 leading-relaxed">
                <li className="flex items-start">
                  <span className="text-[#c9a962] mr-2">•</span>
                  Military-grade encryption in transit and storage
                </li>
                <li className="flex items-start">
                  <span className="text-[#c9a962] mr-2">•</span>
                  Automatic deletion within 24 hours
                </li>
                <li className="flex items-start">
                  <span className="text-[#c9a962] mr-2">•</span>
                  Never used to train AI models
                </li>
                <li className="flex items-start">
                  <span className="text-[#c9a962] mr-2">•</span>
                  Never shared, sold, or disclosed
                </li>
                <li className="flex items-start">
                  <span className="text-[#c9a962] mr-2">•</span>
                  No human access without explicit request
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-premium-lg p-10 border border-[#c9a962]/20">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-3xl font-serif font-bold text-[#0a1628] mb-4">
                Our Guarantee
              </h3>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p className="flex items-start">
                <span className="text-[#c9a962] mr-3 mt-1">✓</span>
                <span><strong>Unused credits:</strong> Full refund within 30 days of purchase</span>
              </p>
              <p className="flex items-start">
                <span className="text-[#c9a962] mr-3 mt-1">✓</span>
                <span><strong>Technical failure:</strong> Automatic refund or credit restoration</span>
              </p>
              <p className="flex items-start">
                <span className="text-[#c9a962] mr-3 mt-1">✓</span>
                <span><strong>Quality assurance:</strong> Emmy-winning methodology on every analysis</span>
              </p>
            </div>
            <div className="text-center mt-8 pt-8 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Questions?{' '}
                <Link href="/contact" className="text-[#c9a962] hover:text-[#b89850] font-semibold">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-serif font-bold text-[#0a1628] mb-6">
            Begin with Complimentary Analysis
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Experience the difference of professional-grade coverage
          </p>
          <Link
            href="/analyze"
            className="btn-gold px-12 py-4 rounded-lg font-semibold text-lg inline-block"
          >
            Start Your Analysis
          </Link>
        </div>
      </section>
    </div>
  );
}
