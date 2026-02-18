'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import UserDropdown from './UserDropdown';

function BlogLink({ mobile, onClick }: { mobile?: boolean; onClick?: () => void }) {
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    // Cache in sessionStorage so we only hit the API once per session
    const cached = sessionStorage.getItem('blog_has_new');
    if (cached !== null) {
      setHasNew(cached === 'true');
      return;
    }
    fetch('/api/blog/has-new')
      .then((r) => r.json())
      .then(({ hasNew: h }) => {
        setHasNew(h);
        sessionStorage.setItem('blog_has_new', String(h));
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/blog"
      className={`relative inline-flex items-center gap-1 text-gray-700 hover:text-[#c9a962] transition-colors font-medium ${mobile ? '' : ''}`}
      onClick={onClick}
    >
      Community
      {hasNew && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a962] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c9a962]" />
        </span>
      )}
    </Link>
  );
}

export default function Header() {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="text-2xl sm:text-3xl font-serif font-bold text-[#0a1628] tracking-tight">
              Script<span className="text-[#c9a962]">Scope</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/analyze" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium">
              Analyze
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium">
              Pricing
            </Link>
            <BlogLink />
            <Link href="/faq" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium">
              FAQ
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium">
              Contact
            </Link>
            {!loading && (
              user ? (
                <UserDropdown />
              ) : (
                <Link
                  href="/login"
                  className="bg-[#c9a962] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#b89552] transition-colors"
                >
                  Sign In
                </Link>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-4">
            {!loading && user && <UserDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 p-2"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link href="/analyze" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>
                Analyze
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              <BlogLink mobile onClick={() => setMobileMenuOpen(false)} />
              <Link href="/faq" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>
                FAQ
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>
              {!loading && !user && (
                <Link
                  href="/login"
                  className="bg-[#c9a962] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#b89552] transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
