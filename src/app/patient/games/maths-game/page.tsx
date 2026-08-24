'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Trophy, Zap } from 'lucide-react';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface Round {
  options: number[];
  correctIndex: number;
}

function generateRound(difficulty: number): Round {
  const count = Math.min(2 + Math.floor(difficulty / 3), 4);
  const maxVal = 10 + difficulty * 5;
  const nums = Array.from({ length: count }, () => randInt(1, maxVal));
  const maxNum = Math.max(...nums);
  const correctIdx = nums.indexOf(maxNum);
  return { options: nums, correctIndex: correctIdx };
}

export default function MathsGamePage() {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState<Round | null>(null);
  const [roundNum, setRoundNum] = useState(0);
  const [difficulty, setDifficulty] = useState(5);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [totalRounds] = useState(15);
  const [startTime] = useState(Date.now());

  const nextRound = useCallback(() => {
    setRound(generateRound(difficulty));
    setRoundNum((r) => r + 1);
    setFeedback(null);
  }, [difficulty]);

  useEffect(() => {
    nextRound();
  }, []);

  const handleChoice = (index: number) => {
    if (feedback || !round) return;

    if (index === round.correctIndex) {
      setFeedback('correct');
      setScore((s) => s + 10 + streak * 2);
      setStreak((s) => s + 1);
      if ((roundNum + 1) % 3 === 0) setDifficulty((d) => Math.min(10, d + 1));
    } else {
      setFeedback('wrong');
      setStreak(0);
    }

    setTimeout(() => {
      if (roundNum >= totalRounds) {
        setIsGameOver(true);
      } else {
        nextRound();
      }
    }, 800);
  };

  const restart = () => {
    setScore(0);
    setStreak(0);
    setRoundNum(0);
    setDifficulty(5);
    setIsGameOver(false);
    nextRound();
  };

  const timeSec = Math.floor((Date.now() - startTime) / 1000);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/patient/games" className="p-2 bg-gentle-pink-50 border border-gentle-pink-200 rounded-xl hover:bg-gentle-pink-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gentle-pink-700" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-charcoal-900">Number Compare</h1>
            <p className="text-xs text-charcoal-600 font-semibold">Tap the larger number</p>
          </div>
        </div>
        <button onClick={restart} className="p-2 bg-gentle-pink-50 border border-gentle-pink-200 rounded-xl hover:bg-gentle-pink-100 transition-colors">
          <RotateCcw className="w-5 h-5 text-gentle-pink-700" />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-around bg-gentle-pink-50 border border-gentle-pink-200 rounded-2xl py-3">
        <div className="text-center">
          <p className="text-xs font-bold text-gentle-pink-700 uppercase">Score</p>
          <p className="text-2xl font-black text-charcoal-900">{score}</p>
        </div>
        <div className="w-px h-8 bg-gentle-pink-200" />
        <div className="text-center">
          <p className="text-xs font-bold text-gentle-pink-700 uppercase">Streak</p>
          <p className="text-2xl font-black text-charcoal-900">{streak}</p>
        </div>
        <div className="w-px h-8 bg-gentle-pink-200" />
        <div className="text-center">
          <p className="text-xs font-bold text-gentle-pink-700 uppercase">Round</p>
          <p className="text-2xl font-black text-charcoal-900">{Math.min(roundNum, totalRounds)}/{totalRounds}</p>
        </div>
      </div>

      {/* Game Area */}
      {!isGameOver && round && (
        <div className="flex flex-col items-center pt-8 space-y-8">
          <p className="text-lg font-black text-charcoal-900">Which number is larger?</p>
          <div className={`flex flex-wrap items-center justify-center gap-4 ${feedback === 'wrong' ? 'animate-pulse' : ''}`}>
            {round.options.map((num, i) => {
              let btnClass = 'bg-white border-2 border-cream-300 hover:border-gentle-pink-500 hover:shadow-lg text-charcoal-900';
              if (feedback === 'correct' && i === round.correctIndex) {
                btnClass = 'bg-sage-100 border-2 border-sage-500 text-sage-800';
              } else if (feedback === 'wrong' && i === round.correctIndex) {
                btnClass = 'bg-gentle-pink-100 border-2 border-gentle-pink-500 text-gentle-pink-800';
              }
              return (
                <button
                  key={i}
                  onClick={() => handleChoice(i)}
                  disabled={!!feedback}
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl font-black transition-all cursor-pointer disabled:cursor-not-allowed ${btnClass}`}
                >
                  {num}
                </button>
              );
            })}
          </div>
          {feedback === 'correct' && (
            <div className="flex items-center space-x-2 text-sage-600 font-bold">
              <Zap className="w-5 h-5" />
              <span>Correct! +{10 + (streak - 1) * 2} points</span>
            </div>
          )}
          {feedback === 'wrong' && (
            <p className="text-gentle-pink-700 font-bold">Not quite! The correct answer was highlighted.</p>
          )}
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 bg-charcoal-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cream-50 border-2 border-gentle-pink-400 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-black text-charcoal-900">Game Complete!</h2>
            <p className="text-sm text-charcoal-600 font-semibold mt-1">Great job exercising your mind.</p>
            <div className="bg-gentle-pink-50 border border-gentle-pink-200 rounded-2xl p-4 mt-4 space-y-1 text-sm font-semibold text-charcoal-800">
              <p>Final Score: {score}</p>
              <p>Time: {timeSec}s</p>
            </div>
            <div className="flex flex-col space-y-2 mt-5">
              <button onClick={restart} className="flex items-center justify-center space-x-2 bg-gentle-pink-500 hover:bg-gentle-pink-700 text-white font-black py-3 rounded-2xl transition-colors">
                <RotateCcw className="w-5 h-5" />
                <span>Play Again</span>
              </button>
              <Link href="/patient/games" className="flex items-center justify-center space-x-2 bg-gentle-pink-50 hover:bg-gentle-pink-100 text-charcoal-800 font-bold py-3 rounded-2xl border border-gentle-pink-200 transition-colors">
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
