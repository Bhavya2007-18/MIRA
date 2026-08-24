/**
 * TypeScript contracts mirroring the MIRA AI/ML engine schemas.
 */

export type TaskType = 
  | 'memory'
  | 'attention'
  | 'recall'
  | 'orientation'
  | 'reasoning'
  | 'recognition'
  | 'other';

export interface GameEvent {
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
  score: number;       // 0.0 - 1.0
  confidence: number;  // 0.0 - 1.0
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
  profile_version: number;
  timestamp: string;
}

export interface Recommendation {
  patient_id: string;
  recommendation_type: 'game' | 'assessment' | 'rest' | 'memory_aid';
  target_game_id: string | null;
  target_domain: string;
  difficulty: number;
  reason: string;
  confidence: number;
  timestamp: string;
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

export interface CaregiverAlert {
  id: string;
  severity: 'info' | 'positive' | 'warning' | 'critical';
  title: string;
  message: string;
  actionable_tip: string;
  timestamp: string;
}

export interface CaregiverReport {
  patient_id: string;
  stability_score: number;
  stability_status: string;
  headline_insight: string;
  strengths_summary: string[];
  weaknesses_summary: string[];
  alerts: CaregiverAlert[];
  recommended_action: string;
}

export interface FaceMatchResult {
  matched: boolean;
  person?: {
    person_id: string;
    name: string;
    relation: string;
    core_memory: string;
    location?: string;
    photo_uri?: string;
  } | null;
  confidence: number;
  cosine_similarity: number;
  speech_prompt_en: string;
  speech_prompt_as: string;
  is_unknown: boolean;
}
