import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { Trophy, RotateCcw, ArrowLeft, Check, X, Sparkles } from 'lucide-react-native';
import { useMiraStore } from '../../store/useMiraStore';
import { Header } from '../../components/Header';
import { speakAloud, triggerHaptic } from '../../utils/audioService';
import { getTranslation, SUPPORTED_LANGUAGES } from '../../utils/translations';

interface NumberPairRound {
  leftNum: number;
  rightNum: number;
}

const ROUNDS: NumberPairRound[] = [
  { leftNum: 42, rightNum: 78 },
  { leftNum: 89, rightNum: 53 },
  { leftNum: 34, rightNum: 61 },
  { leftNum: 95, rightNum: 72 }
];

export const MathsGame: React.FC = () => {
  const { navigateTo, recordGameTelemetryAndEvaluate, selectedLanguage, adaptiveDifficulties } = useMiraStore();
  const t = getTranslation(selectedLanguage);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [selectedSide, setSelectedSide] = useState<'LEFT' | 'RIGHT' | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [errorsCount, setErrorsCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const roundStartTimeRef = useRef<number>(Date.now());
  const reactionTimesRef = useRef<number[]>([]);

  const round = ROUNDS[currentRoundIdx] || ROUNDS[0];

  useEffect(() => {
    startRound();
  }, [currentRoundIdx]);

  const startRound = () => {
    setSelectedSide(null);
    setFeedbackStatus(null);
    roundStartTimeRef.current = Date.now();

    speakAloud(t.tapLarger, undefined, currentLang.speechCode);
  };

  const handleSelectSide = (side: 'LEFT' | 'RIGHT') => {
    if (feedbackStatus !== null) return;

    const reactionTime = Date.now() - roundStartTimeRef.current;
    reactionTimesRef.current.push(reactionTime);
    setSelectedSide(side);

    const chosenNum = side === 'LEFT' ? round.leftNum : round.rightNum;
    const otherNum = side === 'LEFT' ? round.rightNum : round.leftNum;

    if (chosenNum > otherNum) {
      // CORRECT
      triggerHaptic('success');
      setFeedbackStatus('CORRECT');
      speakAloud(
        `${t.largerCorrect} (${chosenNum} > ${otherNum})`,
        undefined,
        currentLang.speechCode
      );

      setTimeout(() => {
        if (currentRoundIdx + 1 < ROUNDS.length) {
          setCurrentRoundIdx((prev) => prev + 1);
        } else {
          finishGame(errorsCount);
        }
      }, 1400);
    } else {
      // WRONG
      triggerHaptic('warning');
      setFeedbackStatus('WRONG');
      setErrorsCount((prev) => prev + 1);
      speakAloud(t.smallerTryAgain, undefined, currentLang.speechCode);

      setTimeout(() => {
        setFeedbackStatus(null);
        setSelectedSide(null);
      }, 1300);
    }
  };

  const finishGame = (totalErrors: number) => {
    setIsCompleted(true);
    const avgReaction =
      reactionTimesRef.current.length > 0
        ? Math.round(
            reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length
          )
        : 1200;

    const accuracy =
      totalErrors === 0
        ? 100
        : Math.max(50, Math.round((ROUNDS.length / (ROUNDS.length + totalErrors)) * 100));

    recordGameTelemetryAndEvaluate({
      gameType: 'MATHS_COMPARE',
      reactionTimeMs: avgReaction,
      accuracyRate: accuracy,
      errorsCount: totalErrors,
      completedDurationSec: 16,
      difficulty: adaptiveDifficulties['MATHS_COMPARE'] >= 7 ? 'HARD' : adaptiveDifficulties['MATHS_COMPARE'] >= 5 ? 'MEDIUM' : 'EASY'
    });

    speakAloud(t.mathsStarDesc, undefined, currentLang.speechCode);
  };

  const handleRestart = () => {
    setCurrentRoundIdx(0);
    setErrorsCount(0);
    setIsCompleted(false);
    reactionTimesRef.current = [];
    startRound();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F3" />

      <Header
        title={t.mathsTitle}
        subtitle={`${t.mathsSubtitle} (${currentRoundIdx + 1}/${ROUNDS.length})`}
        showBack
        onBack={() => navigateTo('GAMES_HUB')}
      />

      {/* Target Question Banner */}
      <View style={styles.instructionBanner}>
        <Sparkles size={22} color="#556B48" />
        <Text style={styles.instructionText}>{t.tapLarger}</Text>
      </View>

      {/* Screen Split into Two Halves */}
      <View style={styles.splitContainer}>
        {/* Left Half */}
        <TouchableOpacity
          style={[
            styles.halfSide,
            styles.leftSide,
            selectedSide === 'LEFT' && feedbackStatus === 'CORRECT' && styles.sideCorrect,
            selectedSide === 'LEFT' && feedbackStatus === 'WRONG' && styles.sideWrong
          ]}
          onPress={() => handleSelectSide('LEFT')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Left number: ${round.leftNum}`}
        >
          <Text style={styles.bigNumberText}>{round.leftNum}</Text>
          {selectedSide === 'LEFT' && feedbackStatus === 'CORRECT' && (
            <View style={styles.badgeFeedback}>
              <Check size={38} color="#FFFFFF" strokeWidth={3} />
            </View>
          )}
          {selectedSide === 'LEFT' && feedbackStatus === 'WRONG' && (
            <View style={styles.badgeFeedbackWrong}>
              <X size={38} color="#FFFFFF" strokeWidth={3} />
            </View>
          )}
        </TouchableOpacity>

        {/* Divider Visual */}
        <View style={styles.divider}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* Right Half */}
        <TouchableOpacity
          style={[
            styles.halfSide,
            styles.rightSide,
            selectedSide === 'RIGHT' && feedbackStatus === 'CORRECT' && styles.sideCorrect,
            selectedSide === 'RIGHT' && feedbackStatus === 'WRONG' && styles.sideWrong
          ]}
          onPress={() => handleSelectSide('RIGHT')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Right number: ${round.rightNum}`}
        >
          <Text style={styles.bigNumberText}>{round.rightNum}</Text>
          {selectedSide === 'RIGHT' && feedbackStatus === 'CORRECT' && (
            <View style={styles.badgeFeedback}>
              <Check size={38} color="#FFFFFF" strokeWidth={3} />
            </View>
          )}
          {selectedSide === 'RIGHT' && feedbackStatus === 'WRONG' && (
            <View style={styles.badgeFeedbackWrong}>
              <X size={38} color="#FFFFFF" strokeWidth={3} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Completion Modal */}
      {isCompleted && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionCard}>
            <View style={styles.trophyCircle}>
              <Trophy size={48} color="#D97706" />
            </View>

            <Text style={styles.victoryTitle}>{t.mathsStar}</Text>
            <Text style={styles.victorySubtitle}>{t.mathsStarDesc}</Text>

            <View style={styles.telemetrySummary}>
              <Text style={styles.telemetryText}>🎯 {t.errors}: {errorsCount}</Text>
              <Text style={styles.telemetryText}>📊 {t.telemetrySaved}</Text>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.playAgainBtn} onPress={handleRestart}>
                <RotateCcw size={22} color="#FFFFFF" />
                <Text style={styles.modalBtnText}>{t.playAgain}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backHubBtn}
                onPress={() => navigateTo('GAMES_HUB')}
              >
                <ArrowLeft size={22} color="#2D3748" />
                <Text style={styles.backHubText}>{t.allGames}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F3'
  },
  instructionBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EBF0E8',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#8FA382'
  },
  instructionText: {
    color: '#556B48',
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 8
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    position: 'relative'
  },
  halfSide: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative'
  },
  leftSide: {
    backgroundColor: '#EEF3F8',
    borderColor: '#A0B2C6',
    shadowColor: '#4B6584'
  },
  rightSide: {
    backgroundColor: '#FDF2F4',
    borderColor: '#E8B4B8',
    shadowColor: '#A85D65'
  },
  sideCorrect: {
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382'
  },
  sideWrong: {
    backgroundColor: '#FDF2F4',
    borderColor: '#E8B4B8'
  },
  bigNumberText: {
    color: '#2D3748',
    fontSize: 68,
    fontWeight: '900'
  },
  badgeFeedback: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: '#8FA382',
    padding: 12,
    borderRadius: 28
  },
  badgeFeedbackWrong: {
    position: 'absolute',
    bottom: 24,
    backgroundColor: '#A85D65',
    padding: 12,
    borderRadius: 28
  },
  divider: {
    position: 'absolute',
    alignSelf: 'center',
    top: '46%',
    left: '46%',
    backgroundColor: '#F3EFE6',
    borderColor: '#E4DEC8',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 10
  },
  vsText: {
    color: '#556B48',
    fontSize: 15,
    fontWeight: '900'
  },
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 55, 72, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100
  },
  completionCard: {
    backgroundColor: '#FBF9F3',
    borderColor: '#8FA382',
    borderWidth: 2.5,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10
  },
  trophyCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  victoryTitle: {
    color: '#2D3748',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center'
  },
  victorySubtitle: {
    color: '#556B48',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4
  },
  telemetrySummary: {
    backgroundColor: '#F3EFE6',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginVertical: 16,
    borderWidth: 1.5,
    borderColor: '#E4DEC8'
  },
  telemetryText: {
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 2
  },
  modalButtonRow: {
    flexDirection: 'column',
    width: '100%',
    gap: 10
  },
  playAgainBtn: {
    backgroundColor: '#8FA382',
    borderColor: '#556B48',
    borderWidth: 1.5,
    borderRadius: 18,
    minHeight: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  backHubBtn: {
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382',
    borderWidth: 1.5,
    borderRadius: 18,
    minHeight: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8
  },
  backHubText: {
    color: '#2D3748',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8
  }
});
