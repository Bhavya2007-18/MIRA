'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';

interface SoundRound {
  soundLabel: string;
  soundEmoji: string;
  options: string[];
  correctIndex: number;
}

const SOUNDS: { label: string; emoji: string; synth: (ctx: AudioContext) => void }[] = [
  { label: 'Rain', emoji: '\u{1F327}\uFE0F', synth: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 1200;
    src.connect(filt).connect(ctx.destination);
    src.start();
  }},
  { label: 'Bird', emoji: '\u{1F426}', synth: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }},
  { label: 'Bell', emoji: '\u{1F514}', synth: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  }},
  { label: 'Drum', emoji: '\u{1F941}', synth: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }},
  { label: 'Water', emoji: '\u{1F4A7}', synth: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.2;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 600;
    filt.Q.value = 2;
    src.connect(filt).connect(ctx.destination);
    src.start();
  }},
  { label: 'Wind', emoji: '\u{1F32C}\uFE0F', synth: (ctx) => {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 400;
    src.connect(filt).connect(ctx.destination);
    src.start();
  }},
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRound(): SoundRound {
  const correct = SOUNDS[Math.floor(Math.random() * SOUNDS.length)];
  const others = SOUNDS.filter((s) => s.label !== correct.label);
  const wrongOptions = shuffle(others).slice(0, 3).map((s) => s.label);
  const options = shuffle([correct.label, ...wrongOptions]);
  return {
    soundLabel: correct.label,
    soundEmoji: correct.emoji,
    options,
    correctIndex: options.indexOf(correct.label),
  };
}

export default function AuditoryGamePage() {
  const [score, setScore] = useState(0);
  const [round, setRound] = useState<SoundRound | null>(null);
  const [roundNum, setRoundNum] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [totalRounds] = useState(10);
  const [ctx, setCtx] = useState<AudioContext | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    setCtx(new AudioContext());
    setRound(generateRound());
    setRoundNum(1);
  }, []);

  const playSound = useCallback(() => {
    if (!round || !ctx) return;
    const sound = SOUNDS.find((s) => s.label === round.soundLabel);
    if (sound && ctx.state === 'running') {
      sound.synth(ctx);
    }
  }, [round, ctx]);

  useEffect(() => {
    if (round && roundNum > 0) {
      const timer = setTimeout(playSound, 300);
      return () => clearTimeout(timer);
    }
  }, [round, roundNum, playSound]);

  const handleChoice = (index: number) => {
    if (feedback || !round) return;

    if (index === round.correctIndex) {
      setFeedback('correct');
      setScore((s) => s + 15);
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      if (roundNum >= totalRounds) {
        setIsGameOver(true);
      } else {
        setRound(generateRound());
        setRoundNum((r) => r + 1);
        setFeedback(null);
      }
    }, 1200);
  };

  const restart = () => {
    setScore(0);
    setRoundNum(1);
    setIsGameOver(false);
    setFeedback(null);
    setRound(generateRound());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/patient/games" className="p-2 bg-sage-50 border border-sage-200 rounded-xl hover:bg-sage-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-sage-700" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-charcoal-900">Sound Recall</h1>
            <p className="text-xs text-charcoal-600 font-semibold">Listen and identify the sound</p>
          </div>
        </div>
        <button onClick={restart} className="p-2 bg-sage-50 border border-sage-200 rounded-xl hover:bg-sage-100 transition-colors">
          <RotateCcw className="w-5 h-5 text-sage-700" />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-around bg-sage-50 border border-sage-200 rounded-2xl py-3">
        <div className="text-center">
          <p className="text-xs font-bold text-sage-700 uppercase">Score</p>
          <p className="text-2xl font-black text-charcoal-900">{score}</p>
        </div>
        <div className="w-px h-8 bg-sage-200" />
        <div className="text-center">
          <p className="text-xs font-bold text-sage-700 uppercase">Round</p>
          <p className="text-2xl font-black text-charcoal-900">{Math.min(roundNum, totalRounds)}/{totalRounds}</p>
        </div>
      </div>

      {/* Game Area */}
      {!isGameOver && round && (
        <div className="flex flex-col items-center pt-6 space-y-6">
          {/* Play Sound Button */}
          <button
            onClick={playSound}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
              feedback === 'correct'
                ? 'bg-sage-500 text-white'
                : 'bg-white border-2 border-sage-400 text-sage-600 hover:bg-sage-50'
            }`}
          >
            {feedback === 'correct' ? <VolumeX className="w-10 h-10" /> : <Volume2 className="w-10 h-10" />}
          </button>
          <p className="text-lg font-black text-charcoal-900">What sound was that?</p>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {round.options.map((opt, i) => {
              let btnClass = 'bg-white border-2 border-cream-300 hover:border-sage-400 hover:shadow-md text-charcoal-900';
              if (feedback === 'correct' && i === round.correctIndex) {
                btnClass = 'bg-sage-100 border-2 border-sage-500 text-sage-800';
              } else if (feedback === 'wrong' && i === round.correctIndex) {
                btnClass = 'bg-gentle-pink-100 border-2 border-gentle-pink-500 text-gentle-pink-800';
              }
              const sound = SOUNDS.find((s) => s.label === opt);
              return (
                <button
                  key={i}
                  onClick={() => handleChoice(i)}
                  disabled={!!feedback}
                  className={`py-4 rounded-2xl flex flex-col items-center space-y-1 transition-all cursor-pointer disabled:cursor-not-allowed ${btnClass}`}
                >
                  <span className="text-3xl">{sound?.emoji}</span>
                  <span className="text-sm font-bold">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 bg-charcoal-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cream-50 border-2 border-sage-400 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-black text-charcoal-900">Great Listening!</h2>
            <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 mt-4 text-sm font-semibold text-charcoal-800">
              <p>Final Score: {score}</p>
            </div>
            <div className="flex flex-col space-y-2 mt-5">
              <button onClick={restart} className="flex items-center justify-center space-x-2 bg-sage-500 hover:bg-sage-600 text-white font-black py-3 rounded-2xl transition-colors">
                <RotateCcw className="w-5 h-5" />
                <span>Play Again</span>
              </button>
              <Link href="/patient/games" className="flex items-center justify-center space-x-2 bg-sage-50 hover:bg-sage-100 text-charcoal-800 font-bold py-3 rounded-2xl border border-sage-200 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>All Games</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
