'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Home, Puzzle, Eye, ArrowLeft } from 'lucide-react';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/patient', label: 'Home', icon: Home },
    { href: '/patient/games', label: 'Games', icon: Puzzle },
    { href: '/patient/vision', label: 'AI Vision', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-cream-50/95 backdrop-blur-md border-b border-cream-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-charcoal-600 hover:text-charcoal-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Back</span>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-sage-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-wider">MIRA</span>
          </div>

          <div className="w-16" />
        </div>
      </header>

      {/* Bottom Navigation (mobile-friendly) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-cream-200 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/patient' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'text-sage-600'
                    : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-sage-600' : ''}`} />
                <span className={`text-xs font-bold ${isActive ? 'text-sage-600' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24">
        {children}
      </main>
    </div>
  );
}
