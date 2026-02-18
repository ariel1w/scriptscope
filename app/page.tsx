import Link from 'next/link';
import ScriptsAnalyzedToday from '@/components/ScriptsAnalyzedToday';
import TestimonialSidebar from '@/components/TestimonialSidebar';

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section with Premium Gradient */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-midnight opacity-95"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,98,0.1),transparent_50%)]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center animate-fadeInUp">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c9a962]/30 bg-[#c9a962]/10 mb-8">
              <div className="w-2 h-2 rounded-full bg-[#c9a962] animate-pulse"></div>
              <span className="text-[#c9a962] text-sm font-medium tracking-wide">Trusted by Industry Professionals</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
              Premium Script<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#d4b876]">
                Coverage
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              Emmy-winning quality analysis delivered in minutes.
            </p>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Experience the professional screenplay evaluation trusted by Hollywood's finest.
            </p>

            {/* Premium Quote */}
            <div className="mb-12 max-w-3xl mx-auto">
              <p className="text-lg md:text-xl text-[#c9a962] italic font-light leading-relaxed">
                "This is premium $200 coverage by an Emmy-winning executive who gives notes that actually help."
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                href="/analyze"
                className="btn-gold px-10 py-4 rounded-lg font-semibold text-lg inline-block"
              >
                Analyze Your Script
              </Link>
              <Link
                href="/pricing"
                className="px-10 py-4 rounded-lg font-semibold text-lg inline-block border-2 border-[#c9a962] text-[#c9a962] hover:bg-[#c9a962]/10 transition-all"
              >
                View Pricing
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <ScriptsAnalyzedToday />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Premium Cards */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#0a1628] mb-4 accent-line inline-block">
              Uncompromising Excellence
            </h2>
            <p className="text-xl text-gray-600 mt-8">
              Every analysis crafted with meticulous attention to detail
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-premium hover:shadow-premium-lg transition-all duration-300 border border-gray-100">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-2xl font-serif font-semibold text-[#0a1628] mb-3">
                Comprehensive Analysis
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Logline, synopsis, character architecture, structure assessment, and commercial viability — everything a professional needs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-premium hover:shadow-premium-lg transition-all duration-300 border border-gray-100">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-serif font-semibold text-[#0a1628] mb-3">
                Lightning Fast
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Receive your Emmy-quality analysis in 3-5 minutes. No compromise on depth, no waiting for weeks.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-premium hover:shadow-premium-lg transition-all duration-300 border border-gray-100">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-2xl font-serif font-semibold text-[#0a1628] mb-3">
                Absolute Security
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Military-grade encryption. Automatically deleted within 24 hours. Never shared, never sold, never compromised.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#0a1628] mb-4 accent-line inline-block">
              The Process
            </h2>
            <p className="text-xl text-gray-600 mt-8">
              Precision meets artistry in every evaluation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b876] flex items-center justify-center text-[#0a1628] text-3xl font-serif font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <h3 className="text-2xl font-serif font-semibold text-[#0a1628] mb-3">
                Submit
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Upload your screenplay in PDF or TXT format. Your work is encrypted and handled with the utmost confidentiality.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b876] flex items-center justify-center text-[#0a1628] text-3xl font-serif font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <h3 className="text-2xl font-serif font-semibold text-[#0a1628] mb-3">
                Analysis
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our Emmy-winning methodology evaluates every dimension of your screenplay with professional precision.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b876] flex items-center justify-center text-[#0a1628] text-3xl font-serif font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <h3 className="text-2xl font-serif font-semibold text-[#0a1628] mb-3">
                Deliver
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Receive your comprehensive PDF report via email. Detailed insights ready for immediate action.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-24 bg-[#fdf7ed] border-y border-[#c9a962]/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">✍️</div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a962]/20 border border-[#c9a962]/40 mb-6">
            <span className="text-[#7a5c1e] text-sm font-bold tracking-widest uppercase">Free Resource</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#0a1628] mb-6 leading-tight">
            The ScriptScope Community
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 mb-4 leading-relaxed max-w-2xl mx-auto">
            Screenwriting insights from an Emmy-winning producer — and the writers who use them.
          </p>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
            Craft tips, real talk about the writing process, and a community of writers leveling up their scripts together.{' '}
            <span className="font-semibold text-[#0a1628]">No signup required to read.</span>
          </p>
          <Link
            href="/blog"
            className="btn-gold px-10 py-5 rounded-lg font-semibold text-lg inline-block"
          >
            Join the Community →
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-midnight"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(201,169,98,0.15),transparent_50%)]"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            Ready for Professional Feedback?
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Join the industry professionals who trust ScriptScope for their screenplay evaluation needs.
            <br />
            <span className="text-[#c9a962]">First analysis complimentary.</span> No credit card required.
          </p>
          <Link
            href="/analyze"
            className="btn-gold px-12 py-4 rounded-lg font-semibold text-lg inline-block"
          >
            Begin Your Analysis
          </Link>
        </div>
      </section>
    </div>
  );
}
