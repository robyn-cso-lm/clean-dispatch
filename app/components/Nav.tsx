'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="sparkle"
            >
              <defs>
                <linearGradient id="nav-sparkle" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#12b3a6" />
                  <stop offset="0.6" stopColor="#0ba59f" />
                  <stop offset="1" stopColor="#ffc83d" />
                </linearGradient>
              </defs>
              <path
                d="M14 1L15.8 11.2L26 14L15.8 16.8L14 27L12.2 16.8L2 14L12.2 11.2Z"
                fill="url(#nav-sparkle)"
              />
              <circle cx="14" cy="14" r="2.5" fill="#ffffff" />
            </svg>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              CleanDispatch
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/how-it-works"
              className="hidden sm:block text-gray-600 hover:text-gray-900 font-medium text-sm px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/cleaner/signup"
              className="hidden md:block text-gray-600 hover:text-gray-900 font-medium text-sm px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              Earn money cleaning
            </Link>
            <Link
              href="/client/quote"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Get a quote
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
