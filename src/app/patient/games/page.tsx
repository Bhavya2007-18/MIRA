'use client';

import Link from 'next/link';
import { Layers, Volume2, Calculator, Sparkles } from 'lucide-react';

const games = [
  {
    href: '/patient/games/card-game',
    title: '4x4 Card Match',
    desc: 'Tap two cards to find matching North Eastern family and heritage pairs.',
    tag: 'MEMORY',
    icon: Layers,
    borderColor: 'border-pastel-blue-400',
    bgColor: 'bg-pastel-blue-50',
    iconBg: 'bg-white border-pastel-blue-200',
    iconColor: 'text-pastel-blue-700',
    tagColor: 'text-pastel-blue-700',
    level: 5,
  },
  {
    href: '/patient/games/auditory-game',
    title: 'Sound Recall',
    desc: 'Listen to the sound and choose what made it from the options.',
    tag: 'AUDITORY',
    icon: Volume2,
    borderColor: 'border-sage-500',
    bgColor: 'bg-sage-50',
    iconBg: 'bg-white border-sage-200',
    iconColor: 'text-sage-700',
    tagColor: 'text-sage-700',
    level: 5,
  },
  {
    href: '/patient/games/maths-game',
    title: 'Number Compare',
    desc: 'Tap the larger number on your screen to score points.',
    tag: 'REASONING',
    icon: Calculator,
    borderColor: 'border-gentle-pink-400',
    bgColor: 'bg-gentle-pink-50',
    iconBg: 'bg-white border-gentle-pink-200',
    iconColor: 'text-gentle-pink-700',
    tagColor: 'text-gentle-pink-700',
    level: 5,
  },
];

export default function GamesHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-charcoal-900">Brain Games</h1>
        <p className="text-sm text-charcoal-600 font-medium mt-1">Choose a game to exercise your mind</p>
      </div>

      {/* AI Recommendation */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
        <div className="flex items-center space-x-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-black text-amber-700 uppercase tracking-wide">AI Adaptive Recommendation</span>
        </div>
        <p className="text-sm text-amber-800 font-semibold">Based on your recent performance, we recommend starting with Card Match to strengthen your memory recall.</p>
      </div>

      {/* Game Cards */}
      <div className="space-y-4">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <Link key={game.href} href={game.href} className="block">
              <div className={`${game.bgColor} ${game.borderColor} border-2 rounded-3xl p-5 flex items-center space-x-5 hover:shadow-lg transition-all cursor-pointer`}>
                <div className={`w-14 h-14 rounded-2xl ${game.iconBg} border flex items-center justify-center shrink-0`}>
                  <Icon className={`w-7 h-7 ${game.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black uppercase tracking-wide ${game.tagColor}`}>{game.tag}</span>
                    <span className="text-xs font-bold bg-white border border-cream-200 px-2 py-0.5 rounded-lg text-charcoal-700">Level {game.level}</span>
                  </div>
                  <h2 className="text-xl font-black text-charcoal-900 mt-1">{game.title}</h2>
                  <p className="text-sm text-charcoal-600 font-medium mt-0.5">{game.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
