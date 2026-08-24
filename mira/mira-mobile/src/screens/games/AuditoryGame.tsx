import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Animated
} from 'react-native';
import { Volume2, Trophy, RotateCcw, ArrowLeft, CheckCircle2, XCircle, Sparkles } from 'lucide-react-native';
import { useMiraStore } from '../../store/useMiraStore';
import { Header } from '../../components/Header';
import { SOUND_QUESTIONS, SoundQuestion, SoundQuestionOption } from '../../utils/mockData';
import { playAcousticSound } from '../../utils/soundSynthesizer';
import { speakAloud, triggerHaptic } from '../../utils/audioService';
import { getTranslation, SUPPORTED_LANGUAGES } from '../../utils/translations';

export const AuditoryGame: React.FC = () => {
  const { navigateTo, recordGameTelemetryAndEvaluate, selectedLanguage, adaptiveDifficulties } = useMiraStore();
  const t = getTranslation(selectedLanguage);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const [questionIndex, setQuestionIndex] = useState(0);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [soundHasFinished, setSoundHasFinished] = useState(false); // Controls revealing image options
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [errorsCount, setErrorsCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const soundEndedTimeRef = useRef<number>(0);
  const reactionTimesRef = useRef<number[]>([]);

  const currentQ: SoundQuestion = SOUND_QUESTIONS[questionIndex] || SOUND_QUESTIONS[0];

  useEffect(() => {
    startRound();
  }, [questionIndex]);

  const startRound = () => {
    setSelectedOptionId(null);
    setHasAnswered(false);
    setSoundHasFinished(false);
    setIsPlayingSound(false);

    // Initial gentle instructions
    speakAloud(
      selectedLanguage === 'as'
        ? 'সেউজীয়া শব্দ শুনক বুটামত টিপক। শব্দ শুনি উঠি ছবি বাছক।'
        : 'Tap the Play Sound button to listen, then choose the picture that made the sound.',
      undefined,
      currentLang.speechCode
    );
  };

  const handlePlaySound = async () => {
    if (isPlayingSound) return;

    triggerHaptic('heavy');
    setIsPlayingSound(true);
    setSoundHasFinished(false);

    // Play actual procedural acoustic sound (No text description spoken!)
    await playAcousticSound(currentQ.soundType, () => {
      // Audio playback has finished!
      setIsPlayingSound(false);
      setSoundHasFinished(true); // REVEAL 3 large visual options
      soundEndedTimeRef.current = Date.now(); // START REACTION TIMER THIS EXACT MILLISECOND
      triggerHaptic('light');
    });
  };

  const handleSelectOption = (option: SoundQuestionOption) => {
    if (hasAnswered || !soundHasFinished) return;

    // Milliseconds from audio completion to patient tap
    const reactionTime = Math.max(150, Date.now() - soundEndedTimeRef.current);
    reactionTimesRef.current.push(reactionTime);
    setSelectedOptionId(option.id);
    setHasAnswered(true);

    const displayName = selectedLanguage === 'as' ? option.labelAs : option.label;

    if (option.isCorrect) {
      triggerHaptic('success');
      speakAloud(
        `${t.soundCorrect} ${displayName}!`,
        undefined,
        currentLang.speechCode
      );

      setTimeout(() => {
        if (questionIndex + 1 < SOUND_QUESTIONS.length) {
          setQuestionIndex((prev) => prev + 1);
        } else {
          finishGame(errorsCount);
        }
      }, 1600);
    } else {
      triggerHaptic('warning');
      setErrorsCount((prev) => prev + 1);
      speakAloud(t.soundWrong, undefined, currentLang.speechCode);

      setTimeout(() => {
        setHasAnswered(false);
        setSelectedOptionId(null);
      }, 1400);
    }
  };

  const finishGame = (totalErrors: number) => {
    setIsCompleted(true);
    const avgReaction =
      reactionTimesRef.current.length > 0
        ? Math.round(
            reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length
          )
        : 1450;

    const accuracy =
      totalErrors === 0
        ? 100
        : Math.max(50, Math.round((SOUND_QUESTIONS.length / (SOUND_QUESTIONS.length + totalErrors)) * 100));

    recordGameTelemetryAndEvaluate({
      gameType: 'AUDITORY_RECALL',
      reactionTimeMs: avgReaction,
      accuracyRate: accuracy,
      errorsCount: totalErrors,
      completedDurationSec: 24,
      difficulty: adaptiveDifficulties['AUDITORY_RECALL'] >= 7 ? 'HARD' : adaptiveDifficulties['AUDITORY_RECALL'] >= 5 ? 'MEDIUM' : 'EASY'
    });

    speakAloud(t.soundMasterDesc, undefined, currentLang.speechCode);
  };

  const handleRestart = () => {
    setQuestionIndex(0);
    setErrorsCount(0);
    setIsCompleted(false);
    reactionTimesRef.current = [];
    startRound();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F3" />

      <Header
        title={t.auditoryTitle}
        subtitle={`${t.auditorySubtitle} (${questionIndex + 1}/${SOUND_QUESTIONS.length})`}
        showBack
        onBack={() => navigateTo('GAMES_HUB')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Massive Play Sound Trigger Button */}
        <TouchableOpacity
          style={[styles.playSoundButton, isPlayingSound && styles.playSoundActive]}
          onPress={handlePlaySound}
          disabled={isPlayingSound}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isPlayingSound ? t.playingSound : t.playSoundBtn}
        >
          <Volume2 size={38} color="#FFFFFF" />
          <Text style={styles.playSoundText}>
            {isPlayingSound ? t.playingSound : t.playSoundBtn}
          </Text>
        </TouchableOpacity>

        {/* Dynamic Instructional Banner */}
        <View style={styles.promptBanner}>
          <Sparkles size={20} color="#556B48" />
          <Text style={styles.promptHeader}>
            {soundHasFinished
              ? t.whichSoundMatches
              : selectedLanguage === 'as'
              ? 'প্ৰথমে ওপৰৰ বুটামত টিপি শব্দ শুনক 🎵'
              : 'Tap "Play Sound" above first to listen 🎵'}
          </Text>
        </View>

        {/* 3 Large Image Options (Revealed after sound finishes) */}
        {soundHasFinished ? (
          <View style={styles.optionsContainer}>
            {currentQ.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const isCorrectChoice = isSelected && opt.isCorrect;
              const isWrongChoice = isSelected && !opt.isCorrect;
              const displayLabel = selectedLanguage === 'as' ? opt.labelAs : opt.label;

              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    isCorrectChoice && styles.optionCardCorrect,
                    isWrongChoice && styles.optionCardWrong
                  ]}
                  onPress={() => handleSelectOption(opt)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={displayLabel}
                >
                  <Image source={{ uri: opt.imageUrl }} style={styles.optionImage} />
                  
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionLabel}>{displayLabel}</Text>
                  </View>

                  {isCorrectChoice && (
                    <View style={styles.resultBadge}>
                      <CheckCircle2 size={32} color="#556B48" />
                    </View>
                  )}
                  {isWrongChoice && (
                    <View style={styles.resultBadge}>
                      <XCircle size={32} color="#A85D65" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingIcon}>🎧</Text>
            <Text style={styles.waitingText}>
              {isPlayingSound
                ? selectedLanguage === 'as'
                  ? 'মন দি শব্দটো শুনক...'
                  : 'Listening to authentic audio...'
                : selectedLanguage === 'as'
                ? 'ছবি চাবলৈ প্ৰথমে শব্দ শুনক।'
                : 'Options will reveal immediately after sound finishes playing.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Completion Modal */}
      {isCompleted && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionCard}>
            <View style={styles.trophyCircle}>
              <Trophy size={48} color="#D97706" />
            </View>

            <Text style={styles.victoryTitle}>{t.soundMaster}</Text>
            <Text style={styles.victorySubtitle}>{t.soundMasterDesc}</Text>

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40
  },
  playSoundButton: {
    backgroundColor: '#8FA382',
    borderColor: '#556B48',
    borderWidth: 2.5,
    borderRadius: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 82, // >= 72px touch target
    shadowColor: '#556B48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 14
  },
  playSoundActive: {
    backgroundColor: '#556B48',
    borderColor: '#8FA382'
  },
  playSoundText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 12
  },
  promptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EFE6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E4DEC8',
    marginVertical: 8
  },
  promptHeader: {
    color: '#2D3748',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginLeft: 8
  },
  optionsContainer: {
    marginTop: 8
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4DEC8',
    borderWidth: 2,
    borderRadius: 22,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 92,
    position: 'relative',
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  optionCardCorrect: {
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382',
    borderWidth: 2.5
  },
  optionCardWrong: {
    backgroundColor: '#FDF2F4',
    borderColor: '#E8B4B8',
    borderWidth: 2.5
  },
  optionImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F3EFE6'
  },
  optionTextContainer: {
    marginLeft: 16,
    flex: 1
  },
  optionLabel: {
    color: '#2D3748',
    fontSize: 20,
    fontWeight: '800'
  },
  resultBadge: {
    marginRight: 10
  },
  waitingCard: {
    backgroundColor: '#F3EFE6',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E4DEC8',
    padding: 28,
    alignItems: 'center',
    marginTop: 16
  },
  waitingIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  waitingText: {
    color: '#556B48',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24
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
