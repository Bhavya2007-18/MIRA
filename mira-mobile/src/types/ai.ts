/**
 * Mobile Data contracts for MIRA AI/ML Engine.
 */

export type TaskType = 
  | 'memory'
  | 'attention'
  | 'recall'
  | 'orientation'
  | 'reasoning'
  | 'recognition'
  | 'other';

export interface MobileGameEvent {
  patient_id: string;
  session_id: string;
  game_id: string;
  task_type: TaskType;
  timestamp?: string;
  difficulty: number;
  correct: boolean;
  response_time_ms: number;
  attempts?: number;
  hints_used?: number;
  skipped?: boolean;
}

export interface CognitiveScore {
  domain: string;
  score: number;
  confidence: number;
  sample_size: number;
}

export interface CognitiveProfile {
  patient_id: string;
  domain_scores: CognitiveScore[];
  overall_score: number;
  overall_confidence: number;
  strengths: string[];
  weaknesses: string[];
  total_events: number;
}

export interface Recommendation {
  patient_id: string;
  recommendation_type: 'game' | 'assessment' | 'rest' | 'memory_aid';
  target_game_id: string | null;
  target_domain: string;
  difficulty: number;
  reason: string;
  confidence: number;
}

export interface DifficultyRecommendation {
  patient_id: string;
  game_id: string;
  target_domain: string;
  current_difficulty: number;
  suggested_difficulty: number;
  adjustment: number;
  reason: string;
  confidence: number;
}

export interface FaceMatchResult {
  matched: boolean;
  person?: {
    id: string;
    name: string;
    relation: string;
    coreMemory: string;
    location?: string;
    photoUri?: string;
  } | null;
  confidence: number;
  speechPromptEn: string;
  speechPromptAs: string;
  isUnknown: boolean;
}
