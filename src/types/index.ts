import { WebSupportedLanguage } from '../lib/translations';

export interface CaretakerUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  patientId: string;
  patientName: string;
  location?: string;
}

export interface PatientSummary {
  patientId: string;
  patientName: string;
  age: number;
  stage: string;
  location: string;
  lastActive: string;
  totalSessions: number;
  stabilityScore: number;
  avgReactionTimeMs: number;
  activeAlerts: number;
}

export interface ReactionTelemetryPoint {
  date: string;
  reactionTime: number; // in ms
  baselineThreshold: number; // in ms (1500ms)
}

export interface GameAccuracyStat {
  gameName: string;
  accuracy: number;
  plays: number;
  fillColor: string;
}

export interface ActivityTelemetryItem {
  id: string;
  gameType: string;
  timestamp: string;
  score: number;
  reactionTimeMs: number;
  errorsCount: number;
  durationSec: number;
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
  alertStatus?: 'NORMAL' | 'DEGRADATION_WARNING' | 'IMPROVEMENT';
}

export interface EnrolledFamilyMember {
  id: string;
  name: string;
  relation: string;
  coreMemory: string;
  photoUrl: string;
  addedDate: string;
  verifiedMatchesCount: number;
  location?: string;
  heritageTag?: string;
}
