'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, HeartHandshake, BrainCircuit, Users, ArrowRight, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WEB_SUPPORTED_LANGUAGES, getWebTranslation } from '../../lib/translations';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, isLoading, selectedLanguage, setLanguage } = useAuth();
  const [patientCode, setPatientCode] = useState('MIRA-8821');
  const [errorMsg, setErrorMsg] = useState('');

  const t = getWebTranslation(selectedLanguage);

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientCode.trim()) {
      setErrorMsg('Please enter a valid Patient ID or Code to link.');
      return;
    }

    try {
      await loginWithGoogle(patientCode.trim());
      router.push('/dashboard');
    } catch (err) {
      setErrorMsg('Failed to authenticate with Google.');
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-charcoal-900 flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Decorative Soft Tint Blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-sage-100 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-pastel-blue-100 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Branding */}
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

        {/* Right Header: Language Switcher & Security Badge */}
        <div className="flex items-center space-x-3">
          {/* Quick Language Selector */}
          <div className="flex items-center space-x-1.5 bg-white border border-cream-200 px-3 py-1.5 rounded-xl shadow-sm text-xs font-bold text-charcoal-800">
            <Globe className="w-3.5 h-3.5 text-sage-600" />
            <select
              value={selectedLanguage}
              onChange={(e) => setLanguage(e.target.value as any)}
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

      {/* Main Login Card Section */}
      <div className="max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center z-10">
        
        {/* Left Column: Mission & Features */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center space-x-2 bg-sage-50 border border-sage-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-sage-800">
            <BrainCircuit className="w-4 h-4 text-sage-600" />
            <span>AI Caretaker Telemetry Portal • North East Region</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-charcoal-900 tracking-tight leading-tight">
            {t.missionHeading}
          </h2>

          <p className="text-charcoal-700 text-base leading-relaxed font-medium">
            {t.missionSub}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
            <div className="bg-white border border-cream-200 p-4 rounded-2xl shadow-sm">
              <HeartHandshake className="w-5 h-5 text-sage-600 mb-2" />
              <h3 className="text-sm font-black text-charcoal-900">Patient Linking</h3>
              <p className="text-xs text-charcoal-600 mt-1 font-medium">Link with patient app (Bhaben Hazarika - Guwahati).</p>
            </div>
            <div className="bg-white border border-cream-200 p-4 rounded-2xl shadow-sm">
              <Users className="w-5 h-5 text-pastel-blue-700 mb-2" />
              <h3 className="text-sm font-black text-charcoal-900">Memory Enrollment</h3>
              <p className="text-xs text-charcoal-600 mt-1 font-medium">Upload loved ones with multi-language AI speech triggers.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Google Login Box */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-cream-200 rounded-3xl p-7 sm:p-8 shadow-xl relative">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-charcoal-900">{t.caretakerSignIn}</h3>
              <p className="text-xs text-charcoal-600 mt-1 font-semibold">
                {t.caretakerSignInSub}
              </p>
            </div>

            <form onSubmit={handleGoogleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-charcoal-700 mb-2">
                  {t.patientIdLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={patientCode}
                    onChange={(e) => {
                      setPatientCode(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder={t.patientIdPlaceholder}
                    className="w-full bg-cream-50 border border-cream-300 focus:border-sage-500 focus:ring-1 focus:ring-sage-500 rounded-2xl px-4 py-3.5 text-charcoal-900 font-mono text-sm tracking-wider uppercase placeholder:text-charcoal-500 transition-all outline-none"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs font-bold text-sage-700 bg-sage-50 border border-sage-200 px-2 py-0.5 rounded-lg">
                    Code
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-600 mt-1.5 font-medium">
                  {t.patientIdHint}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-gentle-pink-50 border border-gentle-pink-200 text-xs text-gentle-pink-700 font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Exclusive Google OAuth Sign-In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-sage-500 hover:bg-sage-600 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-md shadow-sage-700/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed group cursor-pointer"
              >
                {/* Google Logo SVG inside white circle */}
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <span className="text-base">
                  {isLoading ? t.authenticating : t.signInWithGoogle}
                </span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-charcoal-500 font-medium">
                  By continuing, you agree to MIRA's Healthcare Privacy Policy and Google SSO terms.
                </p>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-cream-200 text-center text-xs text-charcoal-600 font-semibold z-10">
        © 2026 MIRA Platform. Dedicated to Alzheimer's & Dementia Cognitive Support across North East India.
      </div>
    </div>
  );
}
