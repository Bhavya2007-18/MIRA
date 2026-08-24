import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
import { RotateCcw, ArrowLeft, Trophy, Sparkles, Heart } from 'lucide-react-native';
import { useMiraStore } from '../../store/useMiraStore';
import { Header } from '../../components/Header';
import { speakAloud, triggerHaptic } from '../../utils/audioService';
import { getTranslation, SUPPORTED_LANGUAGES } from '../../utils/translations';

interface CardItem {
  uid: number;
  pairId: string;
  name: string;
  nameAs: string;
  iconText: string;
  category: 'FAMILY' | 'LANDMARK' | 'CULTURE';
  isFlipped: boolean;
  isMatched: boolean;
}

// 8 Distinct North Eastern Indian Themed Matching Pairs (Total 16 Cards)
const NER_CARD_PAIRS: Omit<CardItem, 'uid' | 'isFlipped' | 'isMatched'>[] = [
  // 1. Family: Priya Hazarika
  {
    pairId: 'priya',
    name: 'Priya (Daughter)',
    nameAs: 'প্ৰিয়া (কন্যা)',
    iconText: '👩‍💼',
    category: 'FAMILY'
  },
  // 2. Family: Rohan Sangma
  {
    pairId: 'rohan',
    name: 'Rohan (Grandson)',
    nameAs: 'ৰোহণ (নাতি)',
    iconText: '👦',
    category: 'FAMILY'
  },
  // 3. Landmark: Kamakhya Temple
  {
    pairId: 'kamakhya',
    name: 'Kamakhya Temple',
    nameAs: 'কামাখ্যা মন্দিৰ',
    iconText: '🛕',
    category: 'LANDMARK'
  },
  // 4. Landmark: Living Root Bridge
  {
    pairId: 'root_bridge',
    name: 'Living Root Bridge',
    nameAs: 'লিভিং ৰুট ব্ৰিজ',
    iconText: '🌿',
    category: 'LANDMARK'
  },
  // 5. Cultural Item: Assamese Jaapi
  {
    pairId: 'jaapi',
    name: 'Assam Jaapi',
    nameAs: 'অসমীয়া জাপি',
    iconText: '👒',
    category: 'CULTURE'
  },
  // 6. Cultural Item: Bihu Dhol
  {
    pairId: 'bihu_dhol',
    name: 'Bihu Dhol',
    nameAs: 'বিহু ঢোল',
    iconText: '🥁',
    category: 'CULTURE'
  },
  // 7. Cultural Item: Bamboo Basket
  {
    pairId: 'bamboo_basket',
    name: 'Bamboo Craft',
    nameAs: 'বাঁহৰ সাজ',
    iconText: '🧺',
    category: 'CULTURE'
  },
  // 8. Cultural Item: Muga Silk Weave
  {
    pairId: 'muga_silk',
    name: 'Muga Silk',
    nameAs: 'মুগা ৰেচম',
    iconText: '✨',
    category: 'CULTURE'
  }
];

export const CardGame: React.FC = () => {
  const { navigateTo, recordGameTelemetryAndEvaluate, selectedLanguage, adaptiveDifficulties } = useMiraStore();
  const t = getTranslation(selectedLanguage);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  // 4x4 Grid state (16 cards total)
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [movesCount, setMovesCount] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const lastActionTimeRef = useRef<number>(Date.now());

  // Initialize & Shuffle 4x4 deck (8 pairs doubled = 16 cards)
  const initializeGame = () => {
    const fullDeck: CardItem[] = [];
    let uidCounter = 0;

    // Create pair duplicates
    NER_CARD_PAIRS.forEach((item) => {
      // First copy
      fullDeck.push({
        ...item,
        uid: uidCounter++,
        isFlipped: false,
        isMatched: false
      });
      // Second copy
      fullDeck.push({
        ...item,
        uid: uidCounter++,
        isFlipped: false,
        isMatched: false
      });
    });

    // Fisher-Yates Shuffle
    const shuffled = [...fullDeck].sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setSelectedIndices([]);
    setMovesCount(0);
    setErrorsCount(0);
    setIsCompleted(false);
    setReactionTimes([]);
    const now = Date.now();
    setStartTime(now);
    lastActionTimeRef.current = now;

    speakAloud(
      selectedLanguage === 'as'
        ? '৪x৪ কাৰ্ডৰ খেল আৰম্ভ হ’ল। দুখন দুখন কাৰ্ড টিপি যোৰ মিলাওক।'
        : '4x4 Card Memory started. Tap two cards to match North Eastern family and heritage.',
      undefined,
      currentLang.speechCode
    );
  };

  useEffect(() => {
    initializeGame();
  }, []);

  const handleCardPress = (index: number) => {
    const card = cards[index];
    if (card.isFlipped || card.isMatched || selectedIndices.length >= 2) {
      return;
    }

    const now = Date.now();
    const reactionDelta = now - lastActionTimeRef.current;
    setReactionTimes((prev) => [...prev, reactionDelta]);
    lastActionTimeRef.current = now;

    triggerHaptic('light');

    // Flip the tapped card
    const updated = [...cards];
    updated[index].isFlipped = true;
    setCards(updated);

    const newSelected = [...selectedIndices, index];
    setSelectedIndices(newSelected);

    if (newSelected.length === 2) {
      setMovesCount((prev) => prev + 1);
      const [firstIdx, secondIdx] = newSelected;
      const firstCard = updated[firstIdx];
      const secondCard = updated[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // MATCH FOUND
        triggerHaptic('success');
        const displayName = selectedLanguage === 'as' ? firstCard.nameAs : firstCard.name;
        speakAloud(`${t.matchFound} ${displayName}!`, undefined, currentLang.speechCode);

        setTimeout(() => {
          setCards((prev) => {
            const nextState = prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            );

            // Check victory condition (all 16 cards matched)
            if (nextState.every((c) => c.isMatched)) {
              handleVictory(movesCount + 1, errorsCount);
            }
            return nextState;
          });
          setSelectedIndices([]);
        }, 500);
      } else {
        // MISMATCH
        triggerHaptic('warning');
        setErrorsCount((prev) => prev + 1);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setSelectedIndices([]);
        }, 1100);
      }
    }
  };

  const handleVictory = (totalMoves: number, errors: number) => {
    setIsCompleted(true);
    const durationSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const avgReaction =
      reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 1420;

    // Accuracy score based on 8 perfect pair moves
    const accuracy = Math.max(50, Math.min(100, Math.round((8 / Math.max(8, totalMoves)) * 100)));

    // Record Telemetry and execute AI adaptive evaluation
    recordGameTelemetryAndEvaluate({
      gameType: 'CARD_MATCH',
      reactionTimeMs: avgReaction,
      accuracyRate: accuracy,
      errorsCount: errors,
      completedDurationSec: durationSec,
      difficulty: adaptiveDifficulties['CARD_MATCH'] >= 7 ? 'HARD' : adaptiveDifficulties['CARD_MATCH'] >= 5 ? 'MEDIUM' : 'EASY'
    });

    speakAloud(
      selectedLanguage === 'as'
        ? `অভিনন্দন! আপুনি ${durationSec} ছেকেণ্ডত আটাইকেইটা যোৰ মিলালে!`
        : `Congratulations! You solved all 8 pairs in ${durationSec} seconds!`,
      undefined,
      currentLang.speechCode
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F3" />

      <Header
        title={t.cardMatchTitle}
        subtitle={t.cardMatchSubtitle}
        showBack
        onBack={() => navigateTo('GAMES_HUB')}
        rightElement={
          <TouchableOpacity
            style={styles.restartBtn}
            onPress={initializeGame}
            accessibilityRole="button"
            accessibilityLabel={t.playAgain}
          >
            <RotateCcw size={22} color="#556B48" />
          </TouchableOpacity>
        }
      />

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t.moves}</Text>
          <Text style={styles.statValue}>{movesCount}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{t.errors}</Text>
          <Text style={[styles.statValue, errorsCount > 0 && { color: '#A85D65' }]}>
            {errorsCount}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>PAIRS</Text>
          <Text style={styles.statValue}>
            {cards.filter((c) => c.isMatched).length / 2} / 8
          </Text>
        </View>
      </View>

      {/* 4x4 Grid (16 Cards) */}
      <ScrollView contentContainerStyle={styles.gridScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {cards.map((card, index) => {
            const isRevealed = card.isFlipped || card.isMatched;
            const displayName = selectedLanguage === 'as' ? card.nameAs : card.name;

            return (
              <TouchableOpacity
                key={card.uid}
                style={[
                  styles.cardTile,
                  isRevealed ? styles.cardRevealed : styles.cardHidden,
                  card.isMatched && styles.cardMatched
                ]}
                onPress={() => handleCardPress(index)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={isRevealed ? displayName : `Card ${index + 1}`}
              >
                {isRevealed ? (
                  <View style={styles.cardFrontContent}>
                    <Text style={styles.cardEmoji}>{card.iconText}</Text>
                    <Text style={styles.cardName} numberOfLines={2}>
                      {displayName}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cardBackContent}>
                    <Sparkles size={24} color="#8FA382" />
                    <Text style={styles.cardBackText}>{t.tapToFlip}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Victory Celebration Modal */}
      {isCompleted && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionCard}>
            <View style={styles.trophyCircle}>
              <Trophy size={48} color="#D97706" />
            </View>

            <Text style={styles.victoryTitle}>{t.victoryTitle}</Text>
            <Text style={styles.victorySubtitle}>{t.victorySubtitle}</Text>

            <View style={styles.telemetryBox}>
              <Text style={styles.telemetryLine}>
                ⏱ {t.timeSpent}: {Math.round((Date.now() - startTime) / 1000)}s
              </Text>
              <Text style={styles.telemetryLine}>🎯 {t.moves}: {movesCount}</Text>
              <Text style={styles.telemetryLine}>📊 {t.telemetrySaved}</Text>
            </View>

            <View style={styles.modalButtonStack}>
              <TouchableOpacity style={styles.playAgainBtn} onPress={initializeGame}>
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

const windowWidth = Dimensions.get('window').width;
const cardWidth = (windowWidth - 40 - 24) / 4; // 4 columns with padding & gap

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F3'
  },
  restartBtn: {
    backgroundColor: '#EBF0E8',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#8FA382',
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F3EFE6',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E4DEC8'
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E4DEC8'
  },
  statLabel: {
    color: '#556B48',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  statValue: {
    color: '#2D3748',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 1
  },
  gridScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8
  },
  cardTile: {
    width: cardWidth,
    height: cardWidth * 1.25, // responsive proportional aspect ratio
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    padding: 4
  },
  cardHidden: {
    backgroundColor: '#EEF3F8',
    borderColor: '#A0B2C6',
    shadowColor: '#4B6584'
  },
  cardRevealed: {
    backgroundColor: '#FDF2F4',
    borderColor: '#E8B4B8',
    shadowColor: '#A85D65'
  },
  cardMatched: {
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382',
    shadowColor: '#556B48'
  },
  cardBackContent: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardBackText: {
    color: '#556B48',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4
  },
  cardFrontContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  cardEmoji: {
    fontSize: 28
  },
  cardName: {
    color: '#2D3748',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 13
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
    padding: 22,
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
  telemetryBox: {
    backgroundColor: '#F3EFE6',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginVertical: 14,
    borderWidth: 1.5,
    borderColor: '#E4DEC8'
  },
  telemetryLine: {
    color: '#2D3748',
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 2
  },
  modalButtonStack: {
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
