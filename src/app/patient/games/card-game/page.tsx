'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import { postEventBatch } from '../../../../lib/miraAiBridge';

interface CardItem {
  uid: number;
  pairId: string;
  name: string;
  iconText: string;
  category: 'FAMILY' | 'LANDMARK' | 'CULTURE';
  isFlipped: boolean;
  isMatched: boolean;
}

const NER_CARD_PAIRS: Omit<CardItem, 'uid' | 'isFlipped' | 'isMatched'>[] = [
  { pairId: 'priya', name: 'Priya (Daughter)', iconText: '\u{1F469}\u200D\u{1F4BC}', category: 'FAMILY' },
  { pairId: 'rohan', name: 'Rohan (Grandson)', iconText: '\u{1F466}', category: 'FAMILY' },
  { pairId: 'kamakhya', name: 'Kamakhya Temple', iconText: '\u{1F6D5}', category: 'LANDMARK' },
  { pairId: 'root_bridge', name: 'Living Root Bridge', iconText: '\u{1F33F}', category: 'LANDMARK' },
  { pairId: 'jaapi', name: 'Assam Jaapi', iconText: '\u{1F452}', category: 'CULTURE' },
  { pairId: 'bihu_dhol', name: 'Bihu Dhol', iconText: '\u{1F941}', category: 'CULTURE' },
  { pairId: 'bamboo_basket', name: 'Bamboo Craft', iconText: '\u{1F9FA}', category: 'CULTURE' },
  { pairId: 'muga_silk', name: 'Muga Silk', iconText: '\u2728', category: 'CULTURE' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CardGamePage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [movesCount, setMovesCount] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const lastActionTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initGame = useCallback(() => {
    const deck: CardItem[] = [];
    let uid = 0;
    NER_CARD_PAIRS.forEach((p) => {
      deck.push({ ...p, uid: uid++, isFlipped: false, isMatched: false });
      deck.push({ ...p, uid: uid++, isFlipped: false, isMatched: false });
    });
    setCards(shuffle(deck));
    setSelectedIndices([]);
    setMovesCount(0);
    setErrorsCount(0);
    setIsCompleted(false);
    const now = Date.now();
    setStartTime(now);
    lastActionTime.current = now;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(Date.now() - now), 1000);
  }, []);

  useEffect(() => {
    initGame();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [initGame]);

  const handleCardPress = (index: number) => {
    const card = cards[index];
    if (card.isFlipped || card.isMatched || selectedIndices.length >= 2) return;

    const now = Date.now();
    lastActionTime.current = now;

    const updated = [...cards];
    updated[index].isFlipped = true;
    setCards(updated);

    const newSel = [...selectedIndices, index];
    setSelectedIndices(newSel);

    if (newSel.length === 2) {
      setMovesCount((m) => m + 1);
      const [i, j] = newSel;
      if (updated[i].pairId === updated[j].pairId) {
        setTimeout(() => {
          setCards((prev) => {
            const next = prev.map((c, idx) =>
              idx === i || idx === j ? { ...c, isMatched: true } : c
            );
            if (next.every((c) => c.isMatched)) {
              setIsCompleted(true);
              if (timerRef.current) clearInterval(timerRef.current);
              // Send game telemetry to AI backend
              const totalMoves = movesCount + 1;
              postEventBatch([{
                patient_id: 'MIRA-8821',
                session_id: `card-${Date.now()}`,
                game_id: 'CARD_MATCH',
                task_type: 'memory',
                difficulty: 5,
                correct: true,
                response_time_ms: 2000,
                attempts: totalMoves,
                hints_used: 0,
                skipped: false,
              }]);
            }
            return next;
          });
          setSelectedIndices([]);
        }, 500);
      } else {
        setErrorsCount((e) => e + 1);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, idx) =>
              idx === i || idx === j ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedIndices([]);
        }, 1100);
      }
    }
  };

  const matchedCount = cards.filter((c) => c.isMatched).length / 2;
  const timeSec = Math.floor(elapsed / 1000);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/patient/games" className="p-2 bg-sage-50 border border-sage-200 rounded-xl hover:bg-sage-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-sage-700" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-charcoal-900">4x4 Card Match</h1>
            <p className="text-xs text-charcoal-600 font-semibold">Match North Eastern heritage pairs</p>
          </div>
        </div>
        <button onClick={initGame} className="p-2 bg-sage-50 border border-sage-200 rounded-xl hover:bg-sage-100 transition-colors">
          <RotateCcw className="w-5 h-5 text-sage-700" />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-around bg-sage-50 border border-sage-200 rounded-2xl py-3">
        <div className="text-center">
          <p className="text-xs font-bold text-sage-700 uppercase">Moves</p>
          <p className="text-2xl font-black text-charcoal-900">{movesCount}</p>
        </div>
        <div className="w-px h-8 bg-sage-200" />
        <div className="text-center">
          <p className="text-xs font-bold text-sage-700 uppercase">Errors</p>
          <p className={`text-2xl font-black ${errorsCount > 0 ? 'text-gentle-pink-700' : 'text-charcoal-900'}`}>{errorsCount}</p>
        </div>
        <div className="w-px h-8 bg-sage-200" />
        <div className="text-center">
          <p className="text-xs font-bold text-sage-700 uppercase">Pairs</p>
          <p className="text-2xl font-black text-charcoal-900">{matchedCount}/8</p>
        </div>
        <div className="w-px h-8 bg-sage-200" />
        <div className="text-center">
          <p className="text-xs font-bold text-sage-700 uppercase">Time</p>
          <p className="text-2xl font-black text-charcoal-900">{timeSec}s</p>
        </div>
      </div>

      {/* 4x4 Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {cards.map((card, index) => {
          const isRevealed = card.isFlipped || card.isMatched;
          return (
            <button
              key={card.uid}
              onClick={() => handleCardPress(index)}
              className={`aspect-[3/4] rounded-2xl border-2 flex flex-col items-center justify-center p-1 transition-all cursor-pointer ${
                card.isMatched
                  ? 'bg-sage-50 border-sage-400 shadow-sm'
                  : isRevealed
                  ? 'bg-gentle-pink-50 border-gentle-pink-400 shadow-sm'
                  : 'bg-pastel-blue-50 border-pastel-blue-300 hover:border-pastel-blue-500 hover:shadow-md'
              }`}
            >
              {isRevealed ? (
                <>
                  <span className="text-2xl sm:text-3xl">{card.iconText}</span>
                  <span className="text-[9px] sm:text-[10px] font-black text-charcoal-800 text-center leading-tight mt-1 line-clamp-2">{card.name}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-sage-400" />
                  <span className="text-[9px] font-bold text-sage-500 mt-1">TAP</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Victory Modal */}
      {isCompleted && (
        <div className="fixed inset-0 bg-charcoal-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cream-50 border-2 border-sage-400 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-black text-charcoal-900">Congratulations!</h2>
            <p className="text-sm text-sage-700 font-semibold mt-1">You matched all 8 pairs!</p>
            <div className="bg-sage-50 border border-sage-200 rounded-2xl p-4 mt-4 space-y-1 text-sm font-semibold text-charcoal-800">
              <p>Time: {timeSec}s</p>
              <p>Moves: {movesCount}</p>
              <p>Accuracy: {Math.max(50, Math.round((8 / Math.max(8, movesCount)) * 100))}%</p>
            </div>
            <div className="flex flex-col space-y-2 mt-5">
              <button onClick={initGame} className="flex items-center justify-center space-x-2 bg-sage-500 hover:bg-sage-600 text-white font-black py-3 rounded-2xl transition-colors">
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
