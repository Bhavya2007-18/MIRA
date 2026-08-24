'use client';

import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';
import { CaregiverReport } from '../types/ai';

interface AiInsightsBannerProps {
  report: CaregiverReport;
}

export const AiInsightsBanner: React.FC<AiInsightsBannerProps> = ({ report }) => {
  return (
    <div className="bg-gradient-to-r from-cream-100 via-amber-50/50 to-sage-50 border border-cream-300 rounded-3xl p-6 sm:p-7 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cream-200 pb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-amber-700 uppercase tracking-wider">
                MIRA AI Clinical Intelligence
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-200">
                {report.stability_status}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-charcoal-900 mt-0.5">
              {report.headline_insight}
            </h3>
          </div>
        </div>

        <div className="bg-white/80 border border-cream-200 px-4 py-2 rounded-2xl text-right shrink-0">
          <p className="text-xs font-bold text-charcoal-600">Rehabilitation Score</p>
          <p className="text-2xl font-black text-sage-800">{report.stability_score}%</p>
        </div>
      </div>

      {/* Actionable Caregiver Guidance */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 rounded-2xl p-4 border border-cream-200">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-sage-500" />
          <p className="text-sm font-semibold text-charcoal-800">
            <span className="font-bold text-charcoal-900">Recommended Caregiver Action:</span> {report.recommended_action}
          </p>
        </div>
      </div>

      {/* Active Alerts Row */}
      {report.alerts && report.alerts.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border flex items-start space-x-3 ${
                alert.severity === 'positive'
                  ? 'bg-sage-50/70 border-sage-200 text-sage-900'
                  : alert.severity === 'warning'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-pastel-blue-50/70 border-pastel-blue-200 text-pastel-blue-900'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {alert.severity === 'positive' ? (
                  <CheckCircle2 className="w-5 h-5 text-sage-600" />
                ) : alert.severity === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <Info className="w-5 h-5 text-pastel-blue-600" />
                )}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">{alert.title}</p>
                <p className="text-xs font-medium mt-0.5 leading-relaxed">{alert.message}</p>
                <p className="text-xs font-bold mt-1 text-charcoal-700">💡 {alert.actionable_tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
