import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Layers, Volume2, Calculator, Sparkles, TrendingUp } from 'lucide-react-native';
import { useMiraStore } from '../store/useMiraStore';
import { Header } from '../components/Header';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { speakAloud, triggerHaptic } from '../utils/audioService';
import { getTranslation, SUPPORTED_LANGUAGES } from '../utils/translations';

export const GamesHubScreen: React.FC = () => {
  const { navigateTo, selectedLanguage, activeRecommendation, adaptiveDifficulties } = useMiraStore();
  const t = getTranslation(selectedLanguage);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const hubPrompt =
      selectedLanguage === 'as'
        ? 'মগজুৰ খেলসমূহ। ৪x৪ কাৰ্ড খেল, শব্দ চিনাক্তকৰণ বা সংখ্যাৰ তুলনা বাছক।'
        : 'Brain Games Hub. Choose from 4x4 Card Match, Sound Recall, or Number Compare.';

    speakAloud(hubPrompt, undefined, currentLang.speechCode);
  }, [selectedLanguage]);

  const handleGameSelect = (
    gameRoute: 'CARD_GAME' | 'AUDITORY_GAME' | 'MATHS_GAME',
    speechPrompt: string
  ) => {
    triggerHaptic('heavy');
    speakAloud(speechPrompt, undefined, currentLang.speechCode);
    navigateTo(gameRoute);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F3" />

      <Header
        title={t.brainGamesTitle}
        subtitle={t.brainGamesSubtitle}
        showBack
        onBack={() => navigateTo('HOME')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* AI Personalized Recommendation Callout */}
        {activeRecommendation && (
          <View style={styles.aiRecommendationCard}>
            <View style={styles.aiRecHeader}>
              <Sparkles size={18} color="#D97706" />
              <Text style={styles.aiRecBadge}>AI ADAPTIVE RECOMMENDATION</Text>
            </View>
            <Text style={styles.aiRecText}>{activeRecommendation.reason}</Text>
          </View>
        )}

        {/* Game 1: 4x4 Card Game */}
        <TouchableOpacity
          style={[styles.gameCard, styles.cardPastelBlue]}
          activeOpacity={0.85}
          onPress={() =>
            handleGameSelect(
              'CARD_GAME',
              selectedLanguage === 'as'
                ? '৪x৪ কাৰ্ড খেল আৰম্ভ হৈছে। দুখন দুখন কাৰ্ড টিপি যোৰ মিলাওক।'
                : 'Starting 4x4 Card Match Game. Tap two cards to find matching pairs.'
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`${t.cardGameTitle}: ${t.cardGameDesc}`}
        >
          <View style={[styles.iconCircle, styles.blueIconCircle]}>
            <Layers size={38} color="#4B6584" />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.badgeRow}>
              <Text style={[styles.gameTag, styles.blueGameTag]}>{t.cardGameTag}</Text>
              <View style={styles.diffPill}>
                <Text style={styles.diffPillText}>Level {adaptiveDifficulties['CARD_MATCH'] || 5}</Text>
              </View>
            </View>
            <Text style={styles.gameTitle}>{t.cardGameTitle}</Text>
            <Text style={styles.gameDesc}>{t.cardGameDesc}</Text>
          </View>
        </TouchableOpacity>

        {/* Game 2: Auditory Sound Recall */}
        <TouchableOpacity
          style={[styles.gameCard, styles.cardSageGreen]}
          activeOpacity={0.85}
          onPress={() =>
            handleGameSelect(
              'AUDITORY_GAME',
              selectedLanguage === 'as'
                ? 'শব্দ চিনাক্তকৰণ খেল আৰম্ভ হৈছে। শব্দ শুনি ছবি বাছক।'
                : 'Starting Sound Recall Game. Listen to the sound and choose what made it.'
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`${t.auditoryGameTitle}: ${t.auditoryGameDesc}`}
        >
          <View style={[styles.iconCircle, styles.greenIconCircle]}>
            <Volume2 size={38} color="#556B48" />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.badgeRow}>
              <Text style={[styles.gameTag, styles.greenGameTag]}>{t.auditoryGameTag}</Text>
              <View style={styles.diffPill}>
                <Text style={styles.diffPillText}>Level {adaptiveDifficulties['AUDITORY_RECALL'] || 5}</Text>
              </View>
            </View>
            <Text style={styles.gameTitle}>{t.auditoryGameTitle}</Text>
            <Text style={styles.gameDesc}>{t.auditoryGameDesc}</Text>
          </View>
        </TouchableOpacity>

        {/* Game 3: Maths Comparison */}
        <TouchableOpacity
          style={[styles.gameCard, styles.cardGentlePink]}
          activeOpacity={0.85}
          onPress={() =>
            handleGameSelect(
              'MATHS_GAME',
              selectedLanguage === 'as'
                ? 'সংখ্যাৰ তুলনা খেল আৰম্ভ হৈছে। ডাঙৰ সংখ্যাটো টিপক।'
                : 'Starting Number Compare Game. Tap the larger number on your screen.'
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`${t.mathsGameTitle}: ${t.mathsGameDesc}`}
        >
          <View style={[styles.iconCircle, styles.pinkIconCircle]}>
            <Calculator size={38} color="#A85D65" />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.badgeRow}>
              <Text style={[styles.gameTag, styles.pinkGameTag]}>{t.mathsGameTag}</Text>
              <View style={styles.diffPill}>
                <Text style={styles.diffPillText}>Level {adaptiveDifficulties['MATHS_COMPARE'] || 5}</Text>
              </View>
            </View>
            <Text style={styles.gameTitle}>{t.mathsGameTitle}</Text>
            <Text style={styles.gameDesc}>{t.mathsGameDesc}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>

      <VoiceAssistantBar />
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
    paddingTop: 14
  },
  aiRecommendationCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12
  },
  aiRecHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  aiRecBadge: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginLeft: 6
  },
  aiRecText: {
    color: '#78350F',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20
  },
  gameCard: {
    borderRadius: 24,
    padding: 18,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 120,
    borderWidth: 2,
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  cardPastelBlue: {
    backgroundColor: '#EEF3F8',
    borderColor: '#A0B2C6'
  },
  cardSageGreen: {
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382'
  },
  cardGentlePink: {
    backgroundColor: '#FDF2F4',
    borderColor: '#E8B4B8'
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5
  },
  blueIconCircle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A0B2C6'
  },
  greenIconCircle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#8FA382'
  },
  pinkIconCircle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8B4B8'
  },
  textContainer: {
    flex: 1
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3
  },
  gameTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  blueGameTag: {
    color: '#4B6584'
  },
  greenGameTag: {
    color: '#556B48'
  },
  pinkGameTag: {
    color: '#A85D65'
  },
  diffPill: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4DEC8',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  diffPillText: {
    color: '#556B48',
    fontSize: 11,
    fontWeight: '800'
  },
  gameTitle: {
    color: '#2D3748',
    fontSize: 22,
    fontWeight: '900'
  },
  gameDesc: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2
  }
});
