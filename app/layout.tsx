import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/app/components/Nav";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CleanDispatch — Professional Cleaning, Instantly Booked",
  description:
    "Book a vetted professional cleaner in Tampa Bay in 2 minutes. Instant quote, transparent pricing, weekly payouts for cleaners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-white text-gray-900">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="bg-gray-900 text-gray-400 text-sm py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="footer-sparkle" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2cc8ba" />
                    <stop offset="0.6" stopColor="#0ba59f" />
                    <stop offset="1" stopColor="#ffc83d" />
                  </linearGradient>
                </defs>
                <path
                  d="M14 1L15.8 11.2L26 14L15.8 16.8L14 27L12.2 16.8L2 14L12.2 11.2Z"
                  fill="url(#footer-sparkle)"
                />
                <circle cx="14" cy="14" r="2.5" fill="#0e5552" />
              </svg>
              <span className="text-white font-semibold">CleanDispatch</span>
              <span className="hidden sm:inline">· Tampa Bay Area, FL ☀️</span>
            </div>
            <nav className="flex gap-5">
              <Link href="/how-it-works" className="hover:text-white transition-colors">
                How it works
              </Link>
              <Link href="/cleaner/signup" className="hover:text-white transition-colors">
                Become a cleaner
              </Link>
              <Link href="/client/quote" className="hover:text-white transition-colors">
                Get a quote
              </Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
