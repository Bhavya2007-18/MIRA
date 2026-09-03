/**
 * MIRA AI Client Bridge for Next.js Web Dashboard.
 * Connects to the FastAPI backend with offline-first fallback.
 */

import {
  GameEvent,
  CognitiveProfile,
  CognitiveScore,
  Recommendation,
  CaregiverReport,
  CaregiverAlert,
  LocationPing,
  CallStatus,
} from '../types/ai';

const BACKEND_URL = process.env.NEXT_PUBLIC_MIRA_API_URL || 'http://127.0.0.1:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      ...options,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend unavailable
  }
  return null;
}

export async function fetchPatientProfile(patientId: string): Promise<CognitiveProfile> {
  const data = await apiFetch<any>(`/api/v1/patient/${encodeURIComponent(patientId)}/profile`);
  if (data) {
    return {
      patient_id: data.patient_id,
      domain_scores: data.domain_scores.map((d: any) => ({
        domain: d.domain,
        score: d.score,
        confidence: d.confidence,
        sample_size: d.sample_size,
      })),
      overall_score: data.overall_score,
      overall_confidence: data.overall_confidence,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      total_events: data.total_events,
      profile_version: data.profile_version,
      timestamp: data.timestamp,
    };
  }

  // Fallback
  return {
    patient_id: patientId,
    domain_scores: [
      { domain: 'memory', score: 0.5, confidence: 0.0, sample_size: 0 },
      { domain: 'recall', score: 0.5, confidence: 0.0, sample_size: 0 },
      { domain: 'reasoning', score: 0.5, confidence: 0.0, sample_size: 0 },
      { domain: 'attention', score: 0.5, confidence: 0.0, sample_size: 0 },
      { domain: 'orientation', score: 0.5, confidence: 0.0, sample_size: 0 },
    ],
    overall_score: 0.5,
    overall_confidence: 0.0,
    strengths: [],
    weaknesses: [],
    total_events: 0,
    profile_version: 0,
    timestamp: new Date().toISOString(),
  };
}

export async function fetchPatientAnalytics(patientId: string): Promise<CaregiverReport> {
  const data = await apiFetch<any>(`/api/v1/patient/${encodeURIComponent(patientId)}/analytics`);
  if (data) {
    return {
      patient_id: data.patient_id,
      stability_score: data.stability_score,
      stability_status: data.stability_status,
      headline_insight: data.headline_insight,
      strengths_summary: data.strengths_summary,
      weaknesses_summary: data.weaknesses_summary,
      alerts: data.alerts.map((a: any) => ({
        id: a.id,
        severity: a.severity,
        title: a.title,
        message: a.message,
        actionable_tip: a.actionable_tip,
        timestamp: a.timestamp,
      })),
      recommended_action: data.recommended_action,
    };
  }

  return {
    patient_id: patientId,
    stability_score: 50.0,
    stability_status: 'Awaiting Data',
    headline_insight: 'No cognitive data recorded yet. Start playing games to build your profile.',
    strengths_summary: [],
    weaknesses_summary: [],
    alerts: [],
    recommended_action: 'Begin with a Card Match game to establish baseline cognitive metrics.',
  };
}

export async function fetchNextRecommendation(patientId: string): Promise<Recommendation> {
  const data = await apiFetch<any>(`/api/v1/patient/${encodeURIComponent(patientId)}/recommendation`);
  if (data) {
    return {
      patient_id: data.patient_id,
      recommendation_type: data.recommendation_type,
      target_game_id: data.target_game_id,
      target_domain: data.target_domain,
      difficulty: data.difficulty,
      reason: data.reason,
      confidence: data.confidence,
      timestamp: data.timestamp,
    };
  }

  return {
    patient_id: patientId,
    recommendation_type: 'game',
    target_game_id: 'CARD_MATCH',
    target_domain: 'memory',
    difficulty: 5,
    reason: 'Starting with Card Match to establish baseline cognitive metrics.',
    confidence: 0.5,
    timestamp: new Date().toISOString(),
  };
}

export async function postEventBatch(events: GameEvent[]): Promise<any> {
  if (events.length === 0) return { status: 'no_events' };

  const payload = events.map((e) => ({
    patient_id: e.patient_id,
    session_id: e.session_id,
    game_id: e.game_id,
    task_type: e.task_type,
    difficulty: e.difficulty,
    correct: e.correct,
    response_time_ms: e.response_time_ms,
    attempts: e.attempts || 1,
    hints_used: e.hints_used || 0,
    skipped: e.skipped || false,
  }));

  const data = await apiFetch<any>('/api/v1/events/batch', {
    method: 'POST',
    body: JSON.stringify({ events: payload }),
  });

  if (data) {
    return data;
  }

  return { status: 'queued_offline' };
}

export async function fetchDifficulty(
  patientId: string,
  events: GameEvent[]
): Promise<any> {
  if (events.length === 0) return null;

  const payload = events.map((e) => ({
    patient_id: e.patient_id,
    session_id: e.session_id,
    game_id: e.game_id,
    task_type: e.task_type,
    difficulty: e.difficulty,
    correct: e.correct,
    response_time_ms: e.response_time_ms,
    attempts: e.attempts || 1,
    hints_used: e.hints_used || 0,
    skipped: e.skipped || false,
  }));

  const data = await apiFetch<any>(
    `/api/v1/patient/${encodeURIComponent(patientId)}/difficulty`,
    {
      method: 'POST',
      body: JSON.stringify({ events: payload }),
    }
  );

  return data;
}

/**
 * Send real-time GPS location ping for a patient.
 */
export async function sendLocationPing(ping: LocationPing): Promise<LocationPing | null> {
  return await apiFetch<LocationPing>('/api/v1/tracking/location', {
    method: 'POST',
    body: JSON.stringify(ping),
  });
}

/**
 * Fetch latest GPS location for a patient.
 */
export async function fetchPatientLocation(patientId: string): Promise<LocationPing | null> {
  return await apiFetch<LocationPing>(`/api/v1/tracking/location/${encodeURIComponent(patientId)}`);
}

/**
 * Initiate a telehealth Jitsi video call with a patient.
 */
export async function initiateTelehealthCall(patientId: string): Promise<CallStatus | null> {
  return await apiFetch<CallStatus>('/api/v1/telehealth/call', {
    method: 'POST',
    body: JSON.stringify({ patient_id: patientId }),
  });
}

/**
 * Poll current telehealth call status for a patient.
 */
export async function fetchCallStatus(patientId: string): Promise<CallStatus | null> {
  return await apiFetch<CallStatus>(`/api/v1/telehealth/call/${encodeURIComponent(patientId)}`);
}

/**
 * End an active telehealth video call.
 */
export async function endTelehealthCall(patientId: string): Promise<CallStatus | null> {
  return await apiFetch<CallStatus>(`/api/v1/telehealth/call/${encodeURIComponent(patientId)}/end`, {
    method: 'POST',
  });
}

