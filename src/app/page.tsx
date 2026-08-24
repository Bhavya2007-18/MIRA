'use client';

import { Sparkles, Heart, BrainCircuit, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { WEB_SUPPORTED_LANGUAGES, getWebTranslation, WebSupportedLanguage } from '../lib/translations';

export default function RootPage() {
  const [lang, setLang] = useState<WebSupportedLanguage>('en');
  const t = getWebTranslation(lang);

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 flex flex-col relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-sage-100 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-pastel-blue-100 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-sage-500 flex items-center justify-center shadow-md shadow-sage-700/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-charcoal-900 tracking-wider">MIRA</h1>
            <p className="text-xs font-bold text-sage-700">{t.portalSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-white border border-cream-200 px-3 py-1.5 rounded-xl shadow-sm text-xs font-bold text-charcoal-800">
            <Globe className="w-3.5 h-3.5 text-sage-600" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as WebSupportedLanguage)}
              className="bg-transparent border-none outline-none font-bold text-charcoal-800 cursor-pointer"
            >
              {WEB_SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.nativeName}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs text-charcoal-700 bg-white border border-cream-200 px-3 py-1.5 rounded-xl shadow-sm">
            <ShieldCheck className="w-4 h-4 text-sage-600" />
            <span className="font-bold">{t.hipaaReady}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 z-10">
        <div className="text-center mb-12 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-sage-50 border border-sage-200 px-4 py-1.5 rounded-full text-xs font-bold text-sage-800 mb-6">
            <BrainCircuit className="w-4 h-4 text-sage-600" />
            <span>AI-Based Cognitive Gaming & Memory Assistance</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-charcoal-900 tracking-tight leading-tight mb-4">
            Welcome to <span className="text-sage-600">MIRA</span>
          </h2>
          <p className="text-charcoal-700 text-base sm:text-lg leading-relaxed font-medium">
            Cognitive Rehabilitation & Memory Prosthetic Platform for Elderly Dementia Patients in North East India.
          </p>
        </div>

        {/* Two Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* Caretaker Portal */}
          <Link href="/caretaker/login" className="group">
            <div className="bg-white border-2 border-cream-200 hover:border-sage-500 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all cursor-pointer h-full flex flex-col">
              <div className="w-16 h-16 rounded-2xl bg-sage-50 border border-sage-200 flex items-center justify-center mb-6 group-hover:bg-sage-100 transition-colors">
                <Heart className="w-8 h-8 text-sage-600" />
              </div>
              <h3 className="text-2xl font-black text-charcoal-900 mb-3">Caretaker Portal</h3>
              <p className="text-sm text-charcoal-700 font-medium leading-relaxed flex-1">
                Monitor cognitive health, view AI insights, track patient progress, and manage memory enrollment for your loved ones.
              </p>
              <div className="mt-6 flex items-center space-x-2 text-sage-600 font-black text-sm group-hover:translate-x-1 transition-transform">
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Patient Portal */}
          <Link href="/patient" className="group">
            <div className="bg-white border-2 border-cream-200 hover:border-pastel-blue-700 rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all cursor-pointer h-full flex flex-col">
              <div className="w-16 h-16 rounded-2xl bg-pastel-blue-50 border border-pastel-blue-200 flex items-center justify-center mb-6 group-hover:bg-pastel-blue-100 transition-colors">
                <BrainCircuit className="w-8 h-8 text-pastel-blue-700" />
              </div>
              <h3 className="text-2xl font-black text-charcoal-900 mb-3">Patient Portal</h3>
              <p className="text-sm text-charcoal-700 font-medium leading-relaxed flex-1">
                Play cognitive games, use the AI Memory Prosthetic to recognize faces and objects, and exercise your mind with personalized activities.
              </p>
              <div className="mt-6 flex items-center space-x-2 text-pastel-blue-700 font-black text-sm group-hover:translate-x-1 transition-transform">
                <span>Start Activities</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-cream-200 text-center text-xs text-charcoal-600 font-semibold z-10">
        © 2026 MIRA Platform. Dedicated to Alzheimer's & Dementia Cognitive Support across North East India.
      </div>
    </div>
  );
}
