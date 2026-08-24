'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CaretakerUser, PatientSummary, EnrolledFamilyMember } from '../types';
import { INITIAL_PATIENT, INITIAL_MEMBERS } from '../lib/mockData';
import { WebSupportedLanguage } from '../lib/translations';

interface AuthContextType {
  user: CaretakerUser | null;
  patient: PatientSummary;
  enrolledMembers: EnrolledFamilyMember[];
  selectedLanguage: WebSupportedLanguage;
  setLanguage: (lang: WebSupportedLanguage) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (patientCode: string) => Promise<void>;
  logout: () => void;
  switchPatient: (patientCode: string, name: string, location?: string) => void;
  addFamilyMember: (member: Omit<EnrolledFamilyMember, 'id' | 'addedDate' | 'verifiedMatchesCount'>) => void;
  deleteFamilyMember: (id: string) => void;
  editFamilyMember: (id: string, updated: Partial<EnrolledFamilyMember>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CaretakerUser | null>(null);
  const [patient, setPatient] = useState<PatientSummary>(INITIAL_PATIENT);
  const [enrolledMembers, setEnrolledMembers] = useState<EnrolledFamilyMember[]>(INITIAL_MEMBERS);
  const [selectedLanguage, setSelectedLanguage] = useState<WebSupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Check saved session in local state if available
    const stored = localStorage.getItem('mira_caretaker_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch (e) {
        // Fallback
      }
    }
    const storedLang = localStorage.getItem('mira_web_lang') as WebSupportedLanguage;
    if (storedLang) {
      setSelectedLanguage(storedLang);
    }
  }, []);

  const setLanguage = (lang: WebSupportedLanguage) => {
    setSelectedLanguage(lang);
    localStorage.setItem('mira_web_lang', lang);
  };

  const loginWithGoogle = async (patientCode: string) => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 600));

    const mockCaretaker: CaretakerUser = {
      id: 'ct-ner-9921',
      name: 'Lalrinmawii (Rini)',
      email: 'rini.lalrinmawii.care@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      patientId: patientCode.trim() || 'MIRA-8821',
      patientName: 'Bhaben Hazarika',
      location: 'Guwahati / Aizawl'
    };

    setUser(mockCaretaker);
    localStorage.setItem('mira_caretaker_auth', JSON.stringify(mockCaretaker));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mira_caretaker_auth');
  };

  const switchPatient = (patientCode: string, name: string, location: string = 'Guwahati, Assam') => {
    setPatient((prev) => ({
      ...prev,
      patientId: patientCode,
      patientName: name,
      location: location
    }));
    if (user) {
      const updatedUser = {
        ...user,
        patientId: patientCode,
        patientName: name
      };
      setUser(updatedUser);
      localStorage.setItem('mira_caretaker_auth', JSON.stringify(updatedUser));
    }
  };

  const addFamilyMember = (newMem: Omit<EnrolledFamilyMember, 'id' | 'addedDate' | 'verifiedMatchesCount'>) => {
    const member: EnrolledFamilyMember = {
      ...newMem,
      id: `fam-${Date.now()}`,
      addedDate: 'Today',
      verifiedMatchesCount: 0
    };
    setEnrolledMembers((prev) => [member, ...prev]);
  };

  const deleteFamilyMember = (id: string) => {
    setEnrolledMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const editFamilyMember = (id: string, updated: Partial<EnrolledFamilyMember>) => {
    setEnrolledMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updated } : m))
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patient,
        enrolledMembers,
        selectedLanguage,
        setLanguage,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        logout,
        switchPatient,
        addFamilyMember,
        deleteFamilyMember,
        editFamilyMember
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
