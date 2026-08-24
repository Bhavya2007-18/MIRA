import { create } from 'zustand';
import { ScreenType, UserProfile, EnrolledPerson, GameTelemetry } from '../types';
import { Recommendation, DifficultyRecommendation, CognitiveProfile } from '../types/ai';
import { INITIAL_ENROLLED_PERSONS } from '../utils/mockData';
import { SupportedLanguage } from '../utils/translations';
import { sendGameEventBatch } from '../services/aiEngineService';

interface MiraState {
  currentScreen: ScreenType;
  user: UserProfile | null;
  isAuthenticated: boolean;
  selectedLanguage: SupportedLanguage;
  enrolledPersons: EnrolledPerson[];
  telemetryLogs: GameTelemetry[];
  isVoiceGuideEnabled: boolean;
  
  // AI Cognitive Layer State
  adaptiveDifficulties: Record<string, number>;
  activeRecommendation: Recommendation | null;
  cognitiveProfile: CognitiveProfile | null;
  
  // Navigation actions
  navigateTo: (screen: ScreenType) => void;
  
  // Language switcher action
  setLanguage: (lang: SupportedLanguage) => void;
  
  // Auth actions (Google OAuth strictly)
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  
  // Persons memory management
  addEnrolledPerson: (person: Omit<EnrolledPerson, 'id' | 'createdAt'>) => void;
  removeEnrolledPerson: (id: string) => void;
  
  // Telemetry recording & AI evaluation
  recordGameTelemetry: (telemetry: Omit<GameTelemetry, 'id' | 'timestamp'>) => void;
  recordGameTelemetryAndEvaluate: (telemetry: Omit<GameTelemetry, 'id' | 'timestamp'>) => Promise<void>;
  
  // Voice Guidance toggle
  toggleVoiceGuide: () => void;
}

export const useMiraStore = create<MiraState>((set, get) => ({
  currentScreen: 'LOGIN',
  user: null,
  isAuthenticated: false,
  selectedLanguage: 'en',
  enrolledPersons: INITIAL_ENROLLED_PERSONS,
  telemetryLogs: [
    {
      id: 'tel-init-1',
      gameType: 'CARD_MATCH',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      reactionTimeMs: 1350,
      accuracyRate: 100,
      errorsCount: 0,
      completedDurationSec: 32,
      difficulty: 'EASY'
    },
    {
      id: 'tel-init-2',
      gameType: 'AUDITORY_RECALL',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      reactionTimeMs: 1420,
      accuracyRate: 100,
      errorsCount: 0,
      completedDurationSec: 22,
      difficulty: 'EASY'
    },
    {
      id: 'tel-init-3',
      gameType: 'MATHS_COMPARE',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      reactionTimeMs: 1250,
      accuracyRate: 90,
      errorsCount: 1,
      completedDurationSec: 18,
      difficulty: 'EASY'
    }
  ],
  isVoiceGuideEnabled: true,
  adaptiveDifficulties: {
    CARD_MATCH: 5,
    AUDITORY_RECALL: 5,
    MATHS_COMPARE: 5
  },
  activeRecommendation: {
    patient_id: 'usr-ner-8821',
    recommendation_type: 'game',
    target_game_id: 'CARD_MATCH',
    target_domain: 'memory',
    difficulty: 5,
    reason: 'Personalized recommendation: Reinforce visual working memory with NER Heritage cards.',
    confidence: 0.92
  },
  cognitiveProfile: {
    patient_id: 'usr-ner-8821',
    domain_scores: [
      { domain: 'memory', score: 0.85, confidence: 0.9, sample_size: 40 },
      { domain: 'recall', score: 0.80, confidence: 0.85, sample_size: 35 },
      { domain: 'reasoning', score: 0.88, confidence: 0.9, sample_size: 45 },
      { domain: 'attention', score: 0.74, confidence: 0.8, sample_size: 25 },
      { domain: 'orientation', score: 0.82, confidence: 0.85, sample_size: 30 }
    ],
    overall_score: 0.82,
    overall_confidence: 0.86,
    strengths: ['reasoning', 'memory'],
    weaknesses: ['attention'],
    total_events: 175
  },

  navigateTo: (screen: ScreenType) => {
    set({ currentScreen: screen });
  },

  setLanguage: (lang: SupportedLanguage) => {
    set({ selectedLanguage: lang });
  },

  loginWithGoogle: async () => {
    const mockPatientUser: UserProfile = {
      id: 'usr-ner-8821',
      name: 'Bhaben Hazarika',
      email: 'bhaben.hazarika.ghy@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      role: 'PATIENT',
      patientCode: 'MIRA-8821',
      city: 'Guwahati, Assam',
      language: get().selectedLanguage
    };
    
    set({
      user: mockPatientUser,
      isAuthenticated: true,
      currentScreen: 'HOME'
    });
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      currentScreen: 'LOGIN'
    });
  },

  addEnrolledPerson: (personData) => {
    const newPerson: EnrolledPerson = {
      ...personData,
      id: `person-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    set((state) => ({
      enrolledPersons: [newPerson, ...state.enrolledPersons]
    }));
  },

  removeEnrolledPerson: (id: string) => {
    set((state) => ({
      enrolledPersons: state.enrolledPersons.filter((p) => p.id !== id)
    }));
  },

  recordGameTelemetry: (telemetryData) => {
    const newTelemetry: GameTelemetry = {
      ...telemetryData,
      id: `tel-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    set((state) => ({
      telemetryLogs: [newTelemetry, ...state.telemetryLogs]
    }));
  },

  recordGameTelemetryAndEvaluate: async (telemetryData) => {
    const newTelemetry: GameTelemetry = {
      ...telemetryData,
      id: `tel-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    set((state) => ({
      telemetryLogs: [newTelemetry, ...state.telemetryLogs]
    }));

    const patientId = get().user?.id || 'usr-ner-8821';
    const domainMap: Record<string, 'memory' | 'recall' | 'reasoning'> = {
      CARD_MATCH: 'memory',
      AUDITORY_RECALL: 'recall',
      MATHS_COMPARE: 'reasoning'
    };

    const taskDomain = domainMap[telemetryData.gameType] || 'memory';
    const currentDiff = get().adaptiveDifficulties[telemetryData.gameType] || 5;

    // Send session event to AI engine
    const events = [
      {
        patient_id: patientId,
        session_id: `sess-${Date.now()}`,
        game_id: telemetryData.gameType,
        task_type: taskDomain,
        difficulty: currentDiff,
        correct: telemetryData.accuracyRate >= 75,
        response_time_ms: telemetryData.reactionTimeMs,
        attempts: telemetryData.errorsCount + 1,
        hints_used: 0,
        skipped: false
      }
    ];

    const aiResult = await sendGameEventBatch(patientId, events);

    set((state) => ({
      adaptiveDifficulties: {
        ...state.adaptiveDifficulties,
        [telemetryData.gameType]: aiResult.difficultyRec.suggested_difficulty
      },
      activeRecommendation: aiResult.nextRec
    }));
  },

  toggleVoiceGuide: () => {
    set((state) => ({ isVoiceGuideEnabled: !state.isVoiceGuideEnabled }));
  }
}));
