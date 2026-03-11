import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0a1628] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link href="/" className="text-3xl font-serif font-bold text-white tracking-tight inline-block mb-4">
              Script<span className="text-[#c9a962]">Scope</span>
            </Link>
            <p className="text-gray-400 leading-relaxed max-w-md">
              AI-powered screenplay analysis built on Emmy-winning methodology.
              Where technology meets real industry expertise.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/analyze" className="hover:text-[#c9a962] transition-colors">
                  Analyze Script
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#c9a962] transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="hover:text-[#c9a962] transition-colors">
                  Community
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#c9a962] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#c9a962] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#c9a962] transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#c9a962] transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} ScriptScope. All rights reserved.
          </div>
          <div className="text-sm text-gray-500 mt-4 md:mt-0">
            <span className="text-[#c9a962]">★</span> Trusted by Industry Professionals
          </div>
        </div>
      </div>
    </footer>
  );
}
