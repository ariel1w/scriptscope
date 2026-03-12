import Link from 'next/link';
import ScriptsCounter from '@/components/ScriptsCounter';

export default function Home() {
  return (
    <div
      className="fixed inset-x-0 top-20 bottom-0 bg-white overflow-x-hidden overflow-y-scroll snap-y snap-proximity [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="min-h-full snap-start relative flex items-center py-8 sm:py-12">
        <div className="absolute inset-0 gradient-midnight opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,169,98,0.1),transparent_50%)]" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fadeInUp">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#c9a962]/30 bg-[#c9a962]/10 mb-4 sm:mb-8">
              <div className="w-2 h-2 rounded-full bg-[#c9a962] animate-pulse" />
              <span className="text-[#c9a962] text-xs sm:text-sm font-medium tracking-wide">Trusted by Industry Professionals</span>
            </div>

            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-serif font-bold text-white mb-3 sm:mb-6 leading-tight">
              The Precision of AI.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a962] to-[#d4b876]">
                The Instinct of an Expert.
              </span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-gray-300 mb-2 sm:mb-4 max-w-3xl mx-auto leading-relaxed">
              Emmy-winning methodology, AI-powered speed.
            </p>
            <p className="text-sm sm:text-lg text-gray-400 mb-4 sm:mb-8 max-w-2xl mx-auto">
              ScriptScope combines cutting-edge AI with real industry expertise. Coverage that actually moves your script forward.
            </p>

            <div className="mb-4 sm:mb-10 max-w-3xl mx-auto">
              <p className="text-sm sm:text-lg md:text-xl text-[#c9a962] italic font-light leading-relaxed">
                "This is premium $200 coverage by an Emmy-winning executive who gives notes that actually help."
              </p>
            </div>

            <div className="flex justify-center mb-4 sm:mb-6">
              <ScriptsCounter variant="dark" />
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link
                href="/analyze"
                className="btn-gold px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg inline-block"
              >
                Analyze Your Script
              </Link>
              <Link
                href="/pricing"
                className="px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg inline-block border-2 border-[#c9a962] text-[#c9a962] hover:bg-[#c9a962]/10 transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="min-h-full snap-start bg-gray-50 flex items-center py-8 sm:py-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-5 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#0a1628] mb-4 accent-line inline-block">
              AI Power. Human Instinct.
            </h2>
            <p className="text-base sm:text-xl text-gray-600 mt-4 sm:mt-8">
              This isn't just another AI tool. There's a real Emmy-winning producer behind the methodology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-3 sm:gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-premium hover:shadow-premium-lg transition-all duration-300 border border-gray-100">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">📋</div>
              <h3 className="text-lg sm:text-2xl font-serif font-semibold text-[#0a1628] mb-1 sm:mb-3">
                Comprehensive Analysis
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Logline, synopsis, character architecture, structure, and commercial viability, all evaluated by AI built on Emmy-winning methodology.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-premium hover:shadow-premium-lg transition-all duration-300 border border-gray-100">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">⚡</div>
              <h3 className="text-lg sm:text-2xl font-serif font-semibold text-[#0a1628] mb-1 sm:mb-3">
                Lightning Fast
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Professional-depth coverage in 3-5 minutes. AI precision at the speed you need, without compromising on the quality that matters.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-8 rounded-xl shadow-premium hover:shadow-premium-lg transition-all duration-300 border border-gray-100">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">🔒</div>
              <h3 className="text-lg sm:text-2xl font-serif font-semibold text-[#0a1628] mb-1 sm:mb-3">
                Absolute Security
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Military-grade encryption. Automatically deleted within 24 hours. Never shared, never sold, never compromised.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Methodology ──────────────────────────────────────────────────── */}
      <section className="min-h-full snap-start bg-white flex items-center py-8 sm:py-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-5 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#0a1628] mb-4 accent-line inline-block">
              How It Works
            </h2>
            <p className="text-base sm:text-xl text-gray-600 mt-4 sm:mt-8">
              AI analysis powered by a methodology built in the writers' rooms of Hollywood
            </p>
          </div>

          {/* On mobile: horizontal row (icon left, text right). On desktop: centered vertical columns. */}
          <div className="grid md:grid-cols-3 gap-5 sm:gap-12">
            <div className="flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0 group">
              <div className="w-12 h-12 md:w-20 md:h-20 shrink-0 md:mx-auto md:mb-6 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b876] flex items-center justify-center text-[#0a1628] text-xl md:text-3xl font-serif font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-serif font-semibold text-[#0a1628] mb-1 md:mb-3">Submit</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Upload your screenplay in PDF or TXT format. Encrypted in transit and at rest, handled with complete confidentiality.
                </p>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0 group">
              <div className="w-12 h-12 md:w-20 md:h-20 shrink-0 md:mx-auto md:mb-6 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b876] flex items-center justify-center text-[#0a1628] text-xl md:text-3xl font-serif font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-serif font-semibold text-[#0a1628] mb-1 md:mb-3">Analysis</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  AI trained on Emmy-winning methodology evaluates structure, character, dialogue, and commercial potential, with professional precision.
                </p>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:text-center gap-4 md:gap-0 group">
              <div className="w-12 h-12 md:w-20 md:h-20 shrink-0 md:mx-auto md:mb-6 rounded-full bg-gradient-to-br from-[#c9a962] to-[#d4b876] flex items-center justify-center text-[#0a1628] text-xl md:text-3xl font-serif font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <div>
                <h3 className="text-lg sm:text-2xl font-serif font-semibold text-[#0a1628] mb-1 md:mb-3">Deliver</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Receive a comprehensive PDF report via email. Detailed, actionable insights ready to take your script to the next level.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Community ────────────────────────────────────────────────────── */}
      <section className="min-h-full snap-start bg-[#fdf7ed] border-t border-[#c9a962]/20 flex items-center py-8 sm:py-12">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-6">✍️</div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#c9a962]/20 border border-[#c9a962]/40 mb-3 sm:mb-6">
            <span className="text-[#7a5c1e] text-xs sm:text-sm font-bold tracking-widest uppercase">Free Resource</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#0a1628] mb-3 sm:mb-6 leading-tight">
            The ScriptScope Community
          </h2>
          <p className="text-base sm:text-xl md:text-2xl text-gray-700 mb-2 sm:mb-4 leading-relaxed max-w-2xl mx-auto">
            Screenwriting insights from an Emmy-winning producer — and the writers who use them.
          </p>
          <p className="text-sm sm:text-lg text-gray-500 mb-6 sm:mb-10 max-w-xl mx-auto">
            Craft tips, real talk about the writing process, and a community of writers leveling up their scripts together.{' '}
            <span className="font-semibold text-[#0a1628]">No signup required to read.</span>
          </p>
          <Link
            href="/blog"
            className="btn-gold px-8 sm:px-10 py-3 sm:py-5 rounded-lg font-semibold text-base sm:text-lg inline-block"
          >
            Join the Community →
          </Link>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="min-h-full snap-start relative flex items-center py-8 sm:py-12">
        <div className="absolute inset-0 gradient-midnight" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(201,169,98,0.15),transparent_50%)]" />

        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white mb-4 sm:mb-6">
            Ready for Real Feedback?
          </h2>
          <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-10 leading-relaxed">
            Join writers who trust ScriptScope for AI-powered analysis backed by real industry expertise.
            <br />
            <span className="text-[#c9a962]">Your first script analysis — just $10.</span> Discount applied automatically.
          </p>
          <Link
            href="/analyze"
            className="btn-gold px-10 sm:px-12 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg inline-block"
          >
            Begin Your Analysis
          </Link>
        </div>
      </section>
    </div>
  );
}
