'use client';

import Link from 'next/link';
import { Eye, Puzzle, UserPlus, HeartHandshake } from 'lucide-react';

const actionCards = [
  {
    href: '/patient/vision',
    title: 'AI Vision',
    subtitle: 'Memory Prosthetic',
    desc: 'Point your camera at a person to see their name and memory.',
    icon: Eye,
    borderColor: 'border-pastel-blue-400',
    bgColor: 'bg-pastel-blue-50',
    iconBg: 'bg-white border-pastel-blue-200',
    iconColor: 'text-pastel-blue-700',
  },
  {
    href: '/patient/games',
    title: 'Brain Games',
    subtitle: 'Cognitive Exercises',
    desc: 'Play fun memory, sound, and number puzzles to keep your mind active.',
    icon: Puzzle,
    borderColor: 'border-sage-500',
    bgColor: 'bg-sage-50',
    iconBg: 'bg-white border-sage-200',
    iconColor: 'text-sage-700',
  },
  {
    href: '/caretaker/dashboard/upload',
    title: 'Add a Loved One',
    subtitle: 'Memory Enrollment',
    desc: 'Save a family photo and memory prompt for AI recognition.',
    icon: UserPlus,
    borderColor: 'border-gentle-pink-400',
    bgColor: 'bg-gentle-pink-50',
    iconBg: 'bg-white border-gentle-pink-200',
    iconColor: 'text-gentle-pink-700',
  },
];

export default function PatientHomePage() {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-2">
        <p className="text-sm font-bold text-sage-700 uppercase tracking-wide">{dateFormatted}</p>
        <h1 className="text-3xl sm:text-4xl font-black text-charcoal-900 mt-1">
          Good Morning <span role="img" aria-label="wave">👋</span>
        </h1>
      </div>

      {/* Connected Caretaker Chip */}
      <div className="inline-flex items-center space-x-2 bg-sage-50 border border-sage-200 px-4 py-2 rounded-2xl">
        <HeartHandshake className="w-5 h-5 text-sage-600" />
        <span className="text-sm font-bold text-sage-700">Connected to Caretaker (ID: MIRA-8821)</span>
      </div>

      {/* Action Cards */}
      <div className="space-y-4 pt-2">
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="block">
              <div className={`${card.bgColor} ${card.borderColor} border-2 rounded-3xl p-6 flex items-center space-x-5 hover:shadow-lg transition-all cursor-pointer`}>
                <div className={`w-16 h-16 rounded-2xl ${card.iconBg} border flex items-center justify-center shrink-0`}>
                  <Icon className={`w-8 h-8 ${card.iconColor}`} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-charcoal-900">{card.title}</h2>
                  <p className="text-sm font-bold text-sage-700 mt-0.5">{card.subtitle}</p>
                  <p className="text-xs text-charcoal-600 font-medium mt-1">{card.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
