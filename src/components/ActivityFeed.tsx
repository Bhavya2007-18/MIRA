'use client';

import React from 'react';
import { ActivityTelemetryItem } from '../types';
import { Clock, AlertCircle, CheckCircle2, Award, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getWebTranslation } from '../lib/translations';

interface ActivityFeedProps {
  activities: ActivityTelemetryItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const { selectedLanguage } = useAuth();
  const t = getWebTranslation(selectedLanguage);

  return (
    <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-cream-200">
        <div>
          <h3 className="text-lg font-black text-charcoal-900 tracking-wide">{t.recentTelemetryTitle}</h3>
          <p className="text-xs text-charcoal-600 font-semibold mt-0.5">
            {t.recentTelemetrySubtitle}
          </p>
        </div>
        <span className="text-xs font-bold text-sage-700 bg-sage-50 border border-sage-200 px-3 py-1 rounded-full">
          {t.liveStream}
        </span>
      </div>

      <div className="mt-4 divide-y divide-cream-200">
        {activities.map((item) => (
          <div
            key={item.id}
            className="py-4 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-cream-50/70 p-2 rounded-2xl transition-colors"
          >
            {/* Left: Icon & Game Info */}
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-sage-50 border border-sage-200 text-sage-700 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-black text-charcoal-900">{item.gameType}</h4>
                  <span className="text-[10px] font-bold bg-cream-100 border border-cream-200 text-charcoal-700 px-2 py-0.5 rounded-full">
                    {item.difficultyLevel}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-charcoal-600 mt-1 font-semibold">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-charcoal-500" />
                    <span>{item.timestamp}</span>
                  </span>
                  <span>•</span>
                  <span>{t.duration}: {item.durationSec}s</span>
                  <span>•</span>
                  <span>{t.errors}: {item.errorsCount}</span>
                </div>
              </div>
            </div>

            {/* Right: Score & Telemetry Badge */}
            <div className="flex items-center space-x-4 sm:justify-end">
              <div className="text-right">
                <p className="text-sm font-black text-charcoal-900">{item.score}% Accuracy</p>
                <p className="text-xs text-sage-700 font-bold">{item.reactionTimeMs} ms speed</p>
              </div>

              {item.alertStatus === 'IMPROVEMENT' && (
                <div className="flex items-center space-x-1 bg-sage-50 border border-sage-300 text-sage-700 px-2.5 py-1 rounded-xl text-xs font-bold">
                  <Award className="w-3.5 h-3.5" />
                  <span>{t.optimalBadge}</span>
                </div>
              )}

              {item.alertStatus === 'NORMAL' && (
                <div className="flex items-center space-x-1 bg-cream-100 border border-cream-300 text-charcoal-700 px-2.5 py-1 rounded-xl text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" />
                  <span>{t.stableBadge}</span>
                </div>
              )}

              {item.alertStatus === 'DEGRADATION_WARNING' && (
                <div className="flex items-center space-x-1 bg-gentle-pink-50 border border-gentle-pink-300 text-gentle-pink-700 px-2.5 py-1 rounded-xl text-xs font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{t.reviewBadge}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
