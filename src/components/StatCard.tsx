import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  accentColor: 'sage' | 'pastel-blue' | 'gentle-pink' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor
}) => {
  const colorMap = {
    sage: {
      bg: 'bg-sage-50/80',
      border: 'border-sage-200',
      text: 'text-sage-700',
      iconBg: 'bg-sage-500 text-white'
    },
    'pastel-blue': {
      bg: 'bg-pastel-blue-50/80',
      border: 'border-pastel-blue-200',
      text: 'text-pastel-blue-700',
      iconBg: 'bg-pastel-blue-400 text-white'
    },
    'gentle-pink': {
      bg: 'bg-gentle-pink-50/80',
      border: 'border-gentle-pink-200',
      text: 'text-gentle-pink-700',
      iconBg: 'bg-gentle-pink-400 text-white'
    },
    amber: {
      bg: 'bg-amber-50/80',
      border: 'border-amber-200',
      text: 'text-amber-700',
      iconBg: 'bg-amber-500 text-white'
    }
  };

  const scheme = colorMap[accentColor] || colorMap.sage;

  return (
    <div className={`p-6 rounded-3xl ${scheme.bg} border ${scheme.border} backdrop-blur-sm relative overflow-hidden group hover:border-cream-300 transition-all shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-charcoal-700 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-2xl ${scheme.iconBg} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-black text-charcoal-900 tracking-tight">{value}</span>
        {trend && (
          <div className={`flex items-center space-x-1 text-xs font-black ${trend.isPositive ? 'text-sage-700' : 'text-amber-700'}`}>
            {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-charcoal-600 font-semibold">{subtitle}</p>
    </div>
  );
};
