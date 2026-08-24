import {
  PatientSummary,
  ReactionTelemetryPoint,
  GameAccuracyStat,
  ActivityTelemetryItem,
  EnrolledFamilyMember
} from '../types';

export const INITIAL_PATIENT: PatientSummary = {
  patientId: 'MIRA-8821',
  patientName: 'Bhaben Hazarika',
  age: 74,
  stage: 'Mild Cognitive Impairment (MCI)',
  location: 'Guwahati, Assam',
  lastActive: '10 minutes ago',
  totalSessions: 92,
  stabilityScore: 93,
  avgReactionTimeMs: 1320,
  activeAlerts: 0
};

export const REACTION_TIME_14_DAYS: ReactionTelemetryPoint[] = [
  { date: 'Aug 11', reactionTime: 1620, baselineThreshold: 1500 },
  { date: 'Aug 12', reactionTime: 1580, baselineThreshold: 1500 },
  { date: 'Aug 13', reactionTime: 1510, baselineThreshold: 1500 },
  { date: 'Aug 14', reactionTime: 1470, baselineThreshold: 1500 },
  { date: 'Aug 15', reactionTime: 1520, baselineThreshold: 1500 },
  { date: 'Aug 16', reactionTime: 1430, baselineThreshold: 1500 },
  { date: 'Aug 17', reactionTime: 1410, baselineThreshold: 1500 },
  { date: 'Aug 18', reactionTime: 1460, baselineThreshold: 1500 },
  { date: 'Aug 19', reactionTime: 1390, baselineThreshold: 1500 },
  { date: 'Aug 20', reactionTime: 1360, baselineThreshold: 1500 },
  { date: 'Aug 21', reactionTime: 1340, baselineThreshold: 1500 },
  { date: 'Aug 22', reactionTime: 1380, baselineThreshold: 1500 },
  { date: 'Aug 23', reactionTime: 1330, baselineThreshold: 1500 },
  { date: 'Aug 24', reactionTime: 1320, baselineThreshold: 1500 }
];

export const GAME_ACCURACY_BREAKDOWN: GameAccuracyStat[] = [
  {
    gameName: '4x4 Card Match',
    accuracy: 94,
    plays: 42,
    fillColor: '#8FA382' // Sage Green
  },
  {
    gameName: 'Sound Recall',
    accuracy: 90,
    plays: 28,
    fillColor: '#A0B2C6' // Soft Pastel Blue
  },
  {
    gameName: 'Number Compare',
    accuracy: 96,
    plays: 22,
    fillColor: '#E8B4B8' // Gentle Pink
  }
];

export const RECENT_ACTIVITY_FEED: ActivityTelemetryItem[] = [
  {
    id: 'act-1',
    gameType: '4x4 Card Match (8 Pairs)',
    timestamp: 'Today, 2:15 PM',
    score: 100,
    reactionTimeMs: 1310,
    errorsCount: 0,
    durationSec: 28,
    difficultyLevel: 'MEDIUM',
    alertStatus: 'IMPROVEMENT'
  },
  {
    id: 'act-2',
    gameType: 'Sound Recall (Bihu Dhol / Bell)',
    timestamp: 'Today, 11:30 AM',
    score: 100,
    reactionTimeMs: 1240,
    errorsCount: 0,
    durationSec: 18,
    difficultyLevel: 'EASY',
    alertStatus: 'NORMAL'
  },
  {
    id: 'act-3',
    gameType: 'Number Compare',
    timestamp: 'Yesterday, 4:45 PM',
    score: 92,
    reactionTimeMs: 1380,
    errorsCount: 1,
    durationSec: 16,
    difficultyLevel: 'EASY',
    alertStatus: 'NORMAL'
  },
  {
    id: 'act-4',
    gameType: 'AI Vision (Priya Hazarika)',
    timestamp: 'Yesterday, 10:12 AM',
    score: 99,
    reactionTimeMs: 890,
    errorsCount: 0,
    durationSec: 6,
    difficultyLevel: 'EASY',
    alertStatus: 'IMPROVEMENT'
  }
];

export const INITIAL_MEMBERS: EnrolledFamilyMember[] = [
  {
    id: 'fam-1',
    name: 'Priya Hazarika',
    relation: 'Daughter (Guwahati)',
    coreMemory: 'Loves to prepare warm Assam CTC tea with fresh ginger for you every morning at 7:30 AM.',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
    addedDate: 'Aug 1, 2026',
    verifiedMatchesCount: 48,
    location: 'Guwahati, Assam',
    heritageTag: 'Muga Silk Gamosa'
  },
  {
    id: 'fam-2',
    name: 'Rohan Sangma',
    relation: 'Grandson (Shillong)',
    coreMemory: 'Plays Rabindra Sangeet and acoustic guitar for you under the pine trees on Shillong visits.',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600&auto=format&fit=crop',
    addedDate: 'Aug 5, 2026',
    verifiedMatchesCount: 32,
    location: 'Shillong, Meghalaya',
    heritageTag: 'Khasi Traditional Shawl'
  },
  {
    id: 'fam-3',
    name: 'Lalrinmawii (Rini)',
    relation: 'Caretaker & Niece (Aizawl)',
    coreMemory: 'Brings traditional Mizo bamboo shoot stew and fresh sweet mountain oranges from Aizawl.',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    addedDate: 'Aug 10, 2026',
    verifiedMatchesCount: 26,
    location: 'Aizawl, Mizoram',
    heritageTag: 'Puanchei Weave'
  },
  {
    id: 'fam-4',
    name: 'Dr. Amarjit Singh',
    relation: 'Geriatrician (Imphal)',
    coreMemory: 'Your caring family physician from Imphal who visits every second Thursday for health checkups.',
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=600&auto=format&fit=crop',
    addedDate: 'Aug 12, 2026',
    verifiedMatchesCount: 18,
    location: 'Imphal, Manipur',
    heritageTag: 'Phanek Motif'
  },
  {
    id: 'fam-5',
    name: 'Tenzing Dorjee',
    relation: 'Brother (Tawang)',
    coreMemory: 'Shares cherished childhood memories near Tawang Monastery and walks in the mountain snow.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
    addedDate: 'Aug 15, 2026',
    verifiedMatchesCount: 14,
    location: 'Tawang, Arunachal Pradesh',
    heritageTag: 'Monpa Woolen Shawl'
  }
];
