'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import UserDropdown from './UserDropdown';

export default function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="text-3xl font-serif font-bold text-[#0a1628] tracking-tight">
              Script<span className="text-[#c9a962]">Scope</span>
            </Link>
          </div>
          <div className="flex items-center space-x-8">
            <Link href="/analyze" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium">
              Analyze
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium">
              Pricing
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium">
              Insights
            </Link>
            <Link href="/faq" className="text-gray-700 hover:text-[#c9a962] transition-colors font-medium">
              FAQ
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
        </div>
      </nav>
    </header>
  );
}
