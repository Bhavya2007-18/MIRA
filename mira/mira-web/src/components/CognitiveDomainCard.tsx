'use client';

import React from 'react';
import { Brain, ShieldCheck, Target, ArrowUp, ArrowDown } from 'lucide-react';
import { CognitiveProfile } from '../types/ai';

interface CognitiveDomainCardProps {
  profile: CognitiveProfile;
}

export const CognitiveDomainCard: React.FC<CognitiveDomainCardProps> = ({ profile }) => {
  return (
    <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-7 shadow-sm">
      <div className="flex items-center justify-between border-b border-cream-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-pastel-blue-50 border border-pastel-blue-200 flex items-center justify-center">
            <Brain className="w-5 h-5 text-pastel-blue-700" />
          </div>
          <div>
            <h3 className="text-lg font-black text-charcoal-900">Cognitive Profile Breakdown</h3>
            <p className="text-xs font-semibold text-charcoal-600">
              Assessed across {profile.total_events} events • Profile v{profile.profile_version}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {profile.strengths.map((s) => (
            <span
              key={s}
              className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-sage-50 border border-sage-200 text-sage-800"
            >
              ★ {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {profile.domain_scores.map((ds) => {
          const percentage = Math.round(ds.score * 100);
          const isStrength = profile.strengths.includes(ds.domain);
          const isWeakness = profile.weaknesses.includes(ds.domain);

          return (
            <div key={ds.domain} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <div className="flex items-center space-x-2">
                  <span className="capitalize text-charcoal-900 font-extrabold text-sm">{ds.domain}</span>
                  {isStrength && (
                    <span className="text-[10px] font-black bg-sage-100 text-sage-800 px-1.5 py-0.5 rounded">
                      Strength
                    </span>
                  )}
                  {isWeakness && (
                    <span className="text-[10px] font-black bg-gentle-pink-100 text-gentle-pink-800 px-1.5 py-0.5 rounded">
                      Needs Support
                    </span>
                  )}
                </div>
                <span className="text-charcoal-700">{percentage}% (conf: {(ds.confidence * 100).toFixed(0)}%)</span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 bg-cream-100 rounded-full overflow-hidden border border-cream-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isStrength
                      ? 'bg-sage-500'
                      : isWeakness
                      ? 'bg-gentle-pink-400'
                      : 'bg-pastel-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
