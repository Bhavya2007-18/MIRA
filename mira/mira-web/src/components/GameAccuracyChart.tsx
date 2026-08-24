'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import { GameAccuracyStat } from '../types';
import { useAuth } from '../context/AuthContext';
import { getWebTranslation } from '../lib/translations';

interface GameAccuracyChartProps {
  data: GameAccuracyStat[];
}

export const GameAccuracyChart: React.FC<GameAccuracyChartProps> = ({ data }) => {
  const { selectedLanguage } = useAuth();
  const t = getWebTranslation(selectedLanguage);

  return (
    <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-5 border-b border-cream-200">
        <div>
          <h3 className="text-lg font-black text-charcoal-900 tracking-wide">{t.accuracyBreakdownTitle}</h3>
          <p className="text-xs text-charcoal-600 font-semibold mt-0.5">
            {t.accuracyBreakdownSubtitle}
          </p>
        </div>
      </div>

      <div className="h-72 w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DEC8" vertical={false} />
            <XAxis
              dataKey="gameName"
              stroke="#718096"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E4DEC8' }}
            />
            <YAxis
              stroke="#718096"
              fontSize={12}
              domain={[0, 100]}
              tickLine={false}
              axisLine={{ stroke: '#E4DEC8' }}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const stat = payload[0].payload as GameAccuracyStat;
                  return (
                    <div className="bg-white border border-cream-200 p-3 rounded-2xl shadow-lg text-xs">
                      <p className="font-bold text-charcoal-900">{stat.gameName}</p>
                      <p className="font-black text-sm text-sage-700 mt-1">
                        {stat.accuracy}% Accuracy
                      </p>
                      <p className="text-charcoal-600 font-medium mt-0.5">
                        {t.totalPlays}: {stat.plays}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="accuracy" radius={[10, 10, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fillColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
