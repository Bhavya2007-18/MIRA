'use client';

import React, { useEffect, useState } from 'react';
import {
  Brain,
  Activity,
  Zap,
  ShieldAlert,
  UserCheck,
  Clock,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/StatCard';
import { ReactionTrendChart } from '../../components/ReactionTrendChart';
import { GameAccuracyChart } from '../../components/GameAccuracyChart';
import { ActivityFeed } from '../../components/ActivityFeed';
import { AiInsightsBanner } from '../../components/AiInsightsBanner';
import { CognitiveDomainCard } from '../../components/CognitiveDomainCard';
import {
  REACTION_TIME_14_DAYS,
  GAME_ACCURACY_BREAKDOWN,
  RECENT_ACTIVITY_FEED,
} from '../../lib/mockData';
import { getWebTranslation } from '../../lib/translations';
import { fetchPatientProfile, fetchPatientAnalytics } from '../../lib/miraAiBridge';
import { CognitiveProfile, CaregiverReport } from '../../types/ai';

export default function DashboardPage() {
  const { patient, selectedLanguage } = useAuth();
  const t = getWebTranslation(selectedLanguage);

  const [aiReport, setAiReport] = useState<CaregiverReport | null>(null);
  const [cognitiveProfile, setCognitiveProfile] = useState<CognitiveProfile | null>(null);

  useEffect(() => {
    async function loadAiData() {
      const [profileData, reportData] = await Promise.all([
        fetchPatientProfile(patient.patientId),
        fetchPatientAnalytics(patient.patientId),
      ]);
      setCognitiveProfile(profileData);
      setAiReport(reportData);
    }
    loadAiData();
  }, [patient.patientId]);

  return (
    <div className="space-y-8">

      {/* Patient Overview Header Banner */}
      <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center space-x-5">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-sage-50 border-2 border-sage-500 flex items-center justify-center text-2xl font-black text-sage-700 shadow-sm">
              {patient.patientName.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-sage-500 border-2 border-white" title="Online" />
          </div>

          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl sm:text-3xl font-black text-charcoal-900">{patient.patientName}</h2>
              <span className="text-xs font-bold bg-sage-50 border border-sage-200 text-sage-700 px-3 py-1 rounded-full">
                {patient.patientId}
              </span>
            </div>

            <p className="text-sm text-charcoal-700 font-semibold mt-1">
              Age {patient.age} • Stage: <span className="text-sage-700 font-black">{patient.stage}</span>
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-600 mt-2 font-semibold">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-sage-600" />
                <span>{patient.location}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-sage-600" />
                <span>Last active {patient.lastActive}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-pastel-blue-700" />
                <span>Google OAuth Paired</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Diagnostic Pill */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-sage-50 border border-sage-200 px-4 py-3 rounded-2xl flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-sage-500 animate-ping" />
            <div>
              <p className="text-xs font-bold text-sage-700">{t.clinicalStability}</p>
              <p className="text-sm font-black text-sage-800">{aiReport ? `${aiReport.stability_score}% • ${aiReport.stability_status}` : t.optimalResponse}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Clinical Intelligence Banner */}
      {aiReport && <AiInsightsBanner report={aiReport} />}

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={t.totalSessions}
          value={patient.totalSessions}
          subtitle={t.totalSessionsSub}
          icon={Activity}
          trend={{ value: "+18%", isPositive: true }}
          accentColor="sage"
        />

        <StatCard
          title={t.cognitiveStability}
          value={aiReport ? `${aiReport.stability_score}%` : `${patient.stabilityScore}%`}
          subtitle={t.cognitiveStabilitySub}
          icon={Brain}
          trend={{ value: "+4.2%", isPositive: true }}
          accentColor="pastel-blue"
        />

        <StatCard
          title={t.avgReactionSpeed}
          value={`${patient.avgReactionTimeMs}ms`}
          subtitle={t.avgReactionSpeedSub}
          icon={Zap}
          trend={{ value: "-80ms (Faster)", isPositive: true }}
          accentColor="gentle-pink"
        />

        <StatCard
          title={t.activeAlerts}
          value={aiReport?.alerts?.length || patient.activeAlerts}
          subtitle={t.activeAlertsSub}
          icon={ShieldAlert}
          trend={{ value: t.stableStatus, isPositive: true }}
          accentColor="amber"
        />
      </div>

      {/* Cognitive Profile Domain Breakdown */}
      {cognitiveProfile && <CognitiveDomainCard profile={cognitiveProfile} />}

      {/* Interactive Charts Section (Reaction Trend & Accuracy Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Reaction Time Trend (7 Cols) */}
        <div className="lg:col-span-7">
          <ReactionTrendChart data={REACTION_TIME_14_DAYS} />
        </div>

        {/* Accuracy Breakdown (5 Cols) */}
        <div className="lg:col-span-5">
          <GameAccuracyChart data={GAME_ACCURACY_BREAKDOWN} />
        </div>
      </div>

      {/* Recent Activity Telemetry Stream */}
      <div>
        <ActivityFeed activities={RECENT_ACTIVITY_FEED} />
      </div>

    </div>
  );
}
