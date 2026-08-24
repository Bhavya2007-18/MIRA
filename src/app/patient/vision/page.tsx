'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Volume2, Sparkles, CheckCircle2, Users, MapPin } from 'lucide-react';

const ENROLLED_PERSONS = [
  {
    id: '1',
    name: 'Priya Hazarika',
    relation: 'Daughter',
    coreMemory: 'She studied at Cotton University and works as a teacher in Guwahati. She visits every Sunday with sweets.',
    location: 'Guwahati, Assam',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Rohan Sangma',
    relation: 'Grandson',
    coreMemory: 'He is studying engineering in Shillong. He loves cricket and calls every evening at 7pm.',
    location: 'Shillong, Meghalaya',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=400&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Lalrinmawii',
    relation: 'Wife',
    coreMemory: 'She makes the bestbamboo shoot pickle. They met at the Aizawl cathedral fair in 1978.',
    location: 'Aizawl, Mizoram',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  },
];

export default function VisionPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const person = ENROLLED_PERSONS[selectedIndex];

  const handleNext = () => {
    setIsScanning(true);
    setTimeout(() => {
      setSelectedIndex((prev) => (prev + 1) % ENROLLED_PERSONS.length);
      setIsScanning(false);
    }, 500);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        `This is ${person.name}, ${person.relation}. ${person.coreMemory}`
      );
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera Viewport */}
      <div className="relative rounded-3xl overflow-hidden bg-charcoal-900 aspect-[3/4] sm:aspect-video">
        <img
          src={person.photoUrl}
          alt={person.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal-900/20" />

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          <Link href="/patient" className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl border border-cream-200">
            <ArrowLeft className="w-5 h-5 text-charcoal-900" />
            <span className="text-sm font-bold text-charcoal-900">Home</span>
          </Link>
          <div className="flex items-center space-x-2 bg-pastel-blue-50/90 backdrop-blur-sm px-4 py-2 rounded-2xl border border-pastel-blue-200">
            <Sparkles className="w-4 h-4 text-pastel-blue-700" />
            <span className="text-xs font-black text-pastel-blue-700">AI Vision Active</span>
          </div>
        </div>

        {/* Bounding Box */}
        <div className="absolute inset-0 flex items-center justify-center pb-20">
          <div className={`w-48 h-56 sm:w-56 sm:h-64 border-2 rounded-2xl relative transition-colors ${isScanning ? 'border-gentle-pink-400 bg-gentle-pink-50/10' : 'border-pastel-blue-400 bg-pastel-blue-50/10'}`}>
            {/* Corners */}
            <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-[5px] border-l-[5px] border-pastel-blue-700 rounded-tl-xl" />
            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-[5px] border-r-[5px] border-pastel-blue-700 rounded-tr-xl" />
            <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-[5px] border-l-[5px] border-pastel-blue-700 rounded-bl-xl" />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-[5px] border-r-[5px] border-pastel-blue-700 rounded-br-xl" />
            {/* Confidence Tag */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-sage-50 border border-sage-300 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-sage-600" />
              <span className="text-xs font-black text-sage-700">99.4% Match</span>
            </div>
          </div>
        </div>

        {/* Switch Person */}
        <button
          onClick={handleNext}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-sage-50/90 backdrop-blur-sm border border-sage-300 px-4 py-2 rounded-2xl z-10"
        >
          <Users className="w-4 h-4 text-charcoal-800" />
          <span className="text-sm font-bold text-charcoal-800">Scan Next ({selectedIndex + 1}/{ENROLLED_PERSONS.length})</span>
        </button>
      </div>

      {/* Identification Bottom Sheet */}
      <div className="bg-cream-50 border border-cream-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <img src={person.photoUrl} alt={person.name} className="w-16 h-16 rounded-full border-2 border-sage-400 object-cover" />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
              <CheckCircle2 className="w-5 h-5 text-sage-500" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-charcoal-900">{person.name}</h2>
            <span className="inline-block bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-700 text-sm font-bold px-3 py-0.5 rounded-xl mt-1">{person.relation}</span>
            {person.location && (
              <p className="flex items-center space-x-1 text-xs text-sage-700 font-semibold mt-1">
                <MapPin className="w-3 h-3" />
                <span>{person.location}</span>
              </p>
            )}
          </div>
        </div>

        {/* Core Memory */}
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 mb-4">
          <p className="text-xs font-black text-sage-700 uppercase tracking-wide mb-1">Core Memory</p>
          <p className="text-sm text-charcoal-800 font-semibold">&ldquo;{person.coreMemory}&rdquo;</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleSpeak}
            className="flex-[2] flex items-center justify-center space-x-2 bg-sage-500 hover:bg-sage-600 text-white font-black py-3 rounded-2xl transition-colors"
          >
            <Volume2 className="w-5 h-5" />
            <span>Speak Aloud</span>
          </button>
          <Link
            href="/patient"
            className="flex-1 flex items-center justify-center space-x-2 bg-sage-50 hover:bg-sage-100 text-charcoal-800 font-bold py-3 rounded-2xl border border-sage-200 transition-colors"
          >
            <span>Done</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
