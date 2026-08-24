'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { ReactionTelemetryPoint } from '../types';
import { useAuth } from '../context/AuthContext';
import { getWebTranslation } from '../lib/translations';

interface ReactionTrendChartProps {
  data: ReactionTelemetryPoint[];
}

export const ReactionTrendChart: React.FC<ReactionTrendChartProps> = ({ data }) => {
  const { selectedLanguage } = useAuth();
  const t = getWebTranslation(selectedLanguage);

  return (
    <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-cream-200 gap-3">
        <div>
          <h3 className="text-lg font-black text-charcoal-900 tracking-wide">{t.reactionTrendTitle}</h3>
          <p className="text-xs text-charcoal-600 font-semibold mt-0.5">
            {t.reactionTrendSubtitle}
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-bold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-sage-500 inline-block" />
            <span className="text-charcoal-800">{t.measuredReaction}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-amber-500 inline-block border-t border-dashed border-amber-500" />
            <span className="text-charcoal-800">{t.alertBaseline}</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DEC8" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#718096"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E4DEC8' }}
            />
            <YAxis
              stroke="#718096"
              fontSize={12}
              domain={[1000, 1800]}
              tickLine={false}
              axisLine={{ stroke: '#E4DEC8' }}
              tickFormatter={(val) => `${val}ms`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value as number;
                  const isBelowBaseline = val < 1500;
                  return (
                    <div className="bg-white border border-cream-200 p-3 rounded-2xl shadow-lg text-xs">
                      <p className="font-bold text-charcoal-900">{label}</p>
                      <p className="text-sage-700 font-black text-sm mt-1">
                        {val} ms
                      </p>
                      <p className={`mt-1 font-bold ${isBelowBaseline ? 'text-sage-600' : 'text-amber-600'}`}>
                        {isBelowBaseline ? t.withinNormal : t.aboveThreshold}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={1500}
              stroke="#D97706"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: '1500ms Baseline',
                fill: '#D97706',
                fontSize: 11,
                position: 'insideTopRight'
              }}
            />
            <Line
              type="monotone"
              dataKey="reactionTime"
              stroke="#8FA382"
              strokeWidth={3.5}
              dot={{ fill: '#556B48', r: 4, stroke: '#8FA382', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#556B48', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
