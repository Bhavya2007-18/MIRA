'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Navbar } from '../../../components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      const stored = localStorage.getItem('mira_caretaker_auth');
      if (!stored) {
        router.push('/caretaker/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-cream-200 bg-cream-100/60 py-6 text-center text-xs text-charcoal-600 font-semibold">
        MIRA AI Cognitive Prosthetic System • North East Regional Caretaker Telemetry • Last Sync: Live
      </footer>
    </div>
  );
}
