import { SupportedLanguage } from '../utils/translations';

export type ScreenType = 
  | 'LOGIN'
  | 'HOME'
  | 'AI_VISION'
  | 'GAMES_HUB'
  | 'CARD_GAME'
  | 'AUDITORY_GAME'
  | 'MATHS_GAME'
  | 'UPLOAD_PERSON';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'PATIENT' | 'CARETAKER';
  patientCode?: string;
  city?: string;
  language?: SupportedLanguage;
}

export interface EnrolledPerson {
  id: string;
  name: string;
  relation: string;
  coreMemory: string;
  photoUri: string;
  createdAt: string;
  audioPromptUrl?: string;
  location?: string;
  heritageTag?: string;
}

export interface GameTelemetry {
  id: string;
  gameType: 'CARD_MATCH' | 'AUDITORY_RECALL' | 'MATHS_COMPARE';
  timestamp: string;
  reactionTimeMs: number;
  accuracyRate: number; // 0 to 100
  errorsCount: number;
  completedDurationSec: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface CognitiveScoreSummary {
  stabilityScore: number; // 0 to 100%
  avgReactionTimeMs: number;
  totalGamesPlayed: number;
  activeAlertsCount: number;
}
