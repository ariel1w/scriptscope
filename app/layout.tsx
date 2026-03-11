import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { AuthProvider } from "@/lib/auth-context";
import StatusButton from "@/components/StatusButton";
import PageViewTracker from "@/components/PageViewTracker";
import BetaBanner from "@/components/BetaBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ScriptScope - Premium Script Coverage by Industry Professionals",
  description: "Experience Emmy-winning quality script analysis. Trusted by Hollywood professionals for comprehensive, insightful coverage delivered in minutes.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: '/apple-touch-icon.svg', type: 'image/svg+xml' },
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased flex flex-col min-h-screen bg-white`}>
        <AuthProvider>
          <PageViewTracker />
          <BetaBanner />
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <CookieBanner />
          <StatusButton />
        </AuthProvider>
      </body>
    </html>
  );
}
