'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, LayoutDashboard, UserPlus, LogOut, ChevronDown, Check, ShieldCheck, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WEB_SUPPORTED_LANGUAGES, getWebTranslation } from '../lib/translations';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, patient, logout, switchPatient, selectedLanguage, setLanguage } = useAuth();
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const t = getWebTranslation(selectedLanguage);

  const navLinks = [
    { href: '/caretaker/dashboard', label: t.dashboard, icon: LayoutDashboard },
    { href: '/caretaker/dashboard/upload', label: t.uploadPerson, icon: UserPlus },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const patientsList = [
    { code: 'MIRA-8821', name: 'Bhaben Hazarika', age: 74, location: 'Guwahati, Assam' },
    { code: 'MIRA-4192', name: 'Tenzing Dorjee', age: 78, location: 'Tawang, Arunachal' },
  ];

  const currentLang =
    WEB_SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || WEB_SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 bg-cream-50/95 backdrop-blur-md border-b border-cream-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Brand & Patient Switcher */}
          <div className="flex items-center space-x-6">
            <Link href="/caretaker/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-2xl bg-sage-500 flex items-center justify-center shadow-md shadow-sage-700/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-black text-charcoal-900 tracking-wider">MIRA</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-bold text-sage-700 bg-sage-50 border border-sage-200 px-2 py-0.5 rounded-full">
                  {t.portalSubtitle}
                </span>
              </div>
            </Link>

            {/* Patient Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsPatientDropdownOpen(!isPatientDropdownOpen);
                  setIsLangDropdownOpen(false);
                }}
                className="flex items-center space-x-2 bg-cream-100 hover:bg-cream-200/70 border border-cream-200 px-3 py-1.5 rounded-xl text-sm font-medium text-charcoal-800 transition-colors"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-sage-500 animate-pulse" />
                <span className="font-bold text-charcoal-900">{patient.patientName}</span>
                <span className="text-xs text-charcoal-600">({patient.patientId})</span>
                <ChevronDown className="w-4 h-4 text-charcoal-600 ml-0.5" />
              </button>

              {isPatientDropdownOpen && (
                <div className="absolute left-0 mt-2 w-68 bg-white border border-cream-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-sage-700 uppercase tracking-wider">
                    {t.linkedPatients}
                  </div>
                  {patientsList.map((p) => (
                    <button
                      key={p.code}
                      onClick={() => {
                        switchPatient(p.code, p.name, p.location);
                        setIsPatientDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-sm transition-colors ${
                        patient.patientId === p.code
                          ? 'bg-sage-50 border border-sage-200 text-sage-800'
                          : 'hover:bg-cream-100 text-charcoal-800'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-charcoal-900">{p.name}</p>
                        <p className="text-xs text-charcoal-600">{p.location} • Age {p.age}</p>
                      </div>
                      {patient.patientId === p.code && (
                        <Check className="w-4 h-4 text-sage-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-sage-500 text-white shadow-sm shadow-sage-600/25'
                      : 'text-charcoal-700 hover:text-charcoal-900 hover:bg-cream-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Multi-Language Switcher & Caretaker Profile */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsLangDropdownOpen(!isLangDropdownOpen);
                  setIsPatientDropdownOpen(false);
                }}
                className="flex items-center space-x-2 bg-cream-100 hover:bg-cream-200/70 border border-cream-200 px-3 py-1.5 rounded-xl text-sm font-bold text-charcoal-800 transition-colors"
                title="Change Language"
              >
                <Globe className="w-4 h-4 text-sage-600" />
                <span className="hidden sm:inline">{currentLang.flag}</span>
                <span>{currentLang.nativeName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-charcoal-600" />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-cream-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-sage-700 uppercase tracking-wider">
                    {t.activeLanguage}
                  </div>
                  {WEB_SUPPORTED_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-sm transition-colors ${
                        selectedLanguage === l.code
                          ? 'bg-sage-50 border border-sage-200 text-sage-800 font-bold'
                          : 'hover:bg-cream-100 text-charcoal-800 font-medium'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{l.flag}</span>
                        <span>{l.nativeName}</span>
                        <span className="text-xs text-charcoal-500 font-normal">({l.name})</span>
                      </div>
                      {selectedLanguage === l.code && (
                        <Check className="w-4 h-4 text-sage-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Caretaker Google Profile */}
            <div className="flex items-center space-x-2.5 bg-cream-100 border border-cream-200 px-3 py-1.5 rounded-2xl">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                alt="Google Profile"
                className="w-8 h-8 rounded-full border border-sage-500 object-cover"
              />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-black text-charcoal-900">{user?.name || 'Lalrinmawii (Rini)'}</p>
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-sage-600" />
                  <p className="text-[10px] text-charcoal-600 font-semibold">{t.googleVerified}</p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-charcoal-600 hover:text-gentle-pink-700 hover:bg-gentle-pink-50 border border-transparent hover:border-gentle-pink-200 rounded-xl transition-colors"
              title={t.signOut}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
