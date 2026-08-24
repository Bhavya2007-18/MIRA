import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Eye, Puzzle, UserPlus, LogOut, HeartHandshake } from 'lucide-react-native';
import { useMiraStore } from '../store/useMiraStore';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { speakAloud, triggerHaptic } from '../utils/audioService';
import { getTranslation, SUPPORTED_LANGUAGES } from '../utils/translations';

export const HomeScreen: React.FC = () => {
  const { user, navigateTo, logout, selectedLanguage } = useMiraStore();
  const t = getTranslation(selectedLanguage);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const now = new Date();
  const dateFormatted = now.toLocaleDateString(
    selectedLanguage === 'as' ? 'as-IN' : 'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }
  );

  const userName = user?.name ? user.name.split(' ')[0] : 'Bhaben';

  useEffect(() => {
    // Gentle regional welcome speech
    const welcomeMsg =
      selectedLanguage === 'as'
        ? `শুভ প্ৰভাত, ${userName} দেউতা। আজি আপুনি কি কৰিব বিচাৰে? এআই দৃষ্টি, মগজুৰ খেল বা আপোনজনক যোগ কৰক।`
        : `Good morning, ${userName}. What would you like to do today? You can choose AI Vision, Brain Games, or Add a Loved One.`;

    speakAloud(welcomeMsg, undefined, currentLang.speechCode);
  }, [selectedLanguage]);

  const handleCardPress = (action: () => void, promptText: string) => {
    triggerHaptic('heavy');
    speakAloud(promptText, undefined, currentLang.speechCode);
    action();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F3" />

      {/* Top Bar with Greeting, Language Switcher & Sign Out */}
      <View style={styles.header}>
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subGreeting}>{dateFormatted}</Text>
            <Text style={styles.mainGreeting}>
              {t.goodMorning}, {userName} 👋
            </Text>
          </View>

          <View style={styles.headerActions}>
            <LanguageSwitcher compact />

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                triggerHaptic('light');
                logout();
              }}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <LogOut size={20} color="#556B48" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Linked Caretaker Status Chip */}
        <View style={styles.connectedChip}>
          <HeartHandshake size={18} color="#556B48" />
          <Text style={styles.connectedText}>
            {t.connectedCaretaker} (ID: {user?.patientCode || 'MIRA-8821'})
          </Text>
        </View>
      </View>

      {/* 3 Therapeutic Action Cards */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: AI VISION (Soft Pastel Blue #A0B2C6) */}
        <TouchableOpacity
          style={[styles.bigCard, styles.pastelBlueCard]}
          activeOpacity={0.85}
          onPress={() =>
            handleCardPress(
              () => navigateTo('AI_VISION'),
              selectedLanguage === 'as'
                ? 'এআই দৃষ্টি খোলক। মানুহ চিনি পাবলৈ কেমেৰা ধৰক।'
                : 'Opening AI Vision. Point your camera at a person to see their name and memory.'
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`${t.aiVisionTitle}: ${t.aiVisionSubtitle}`}
        >
          <View style={[styles.cardIconWrapper, styles.blueIconWrapper]}>
            <Eye size={42} color="#4B6584" strokeWidth={2.5} />
          </View>
          <View style={styles.cardTextWrapper}>
            <Text style={styles.cardTitle}>{t.aiVisionTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.aiVisionSubtitle}</Text>
            <Text style={styles.cardDescription}>{t.aiVisionDesc}</Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: BRAIN GAMES (Sage Green #8FA382) */}
        <TouchableOpacity
          style={[styles.bigCard, styles.sageGreenCard]}
          activeOpacity={0.85}
          onPress={() =>
            handleCardPress(
              () => navigateTo('GAMES_HUB'),
              selectedLanguage === 'as'
                ? 'মগজুৰ খেল খোলক। স্মৃতিৰ অনুশীলন কৰোঁ আহক।'
                : 'Opening Brain Games. Lets play fun memory and puzzle exercises.'
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`${t.gamesTitle}: ${t.gamesSubtitle}`}
        >
          <View style={[styles.cardIconWrapper, styles.greenIconWrapper]}>
            <Puzzle size={42} color="#556B48" strokeWidth={2.5} />
          </View>
          <View style={styles.cardTextWrapper}>
            <Text style={styles.cardTitle}>{t.gamesTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.gamesSubtitle}</Text>
            <Text style={styles.cardDescription}>{t.gamesDesc}</Text>
          </View>
        </TouchableOpacity>

        {/* Card 3: UPLOAD PERSON (Gentle Pink #E8B4B8) */}
        <TouchableOpacity
          style={[styles.bigCard, styles.gentlePinkCard]}
          activeOpacity={0.85}
          onPress={() =>
            handleCardPress(
              () => navigateTo('UPLOAD_PERSON'),
              selectedLanguage === 'as'
                ? 'আপোনজনক যোগ কৰক। নতুন ছবি আৰু স্মৃতি সংৰক্ষণ কৰক।'
                : 'Opening Add a Loved One. Save a family photo and memory prompt.'
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`${t.uploadTitle}: ${t.uploadSubtitle}`}
        >
          <View style={[styles.cardIconWrapper, styles.pinkIconWrapper]}>
            <UserPlus size={42} color="#A85D65" strokeWidth={2.5} />
          </View>
          <View style={styles.cardTextWrapper}>
            <Text style={styles.cardTitle}>{t.uploadTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.uploadSubtitle}</Text>
            <Text style={styles.cardDescription}>{t.uploadDesc}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Voice Guidance Bar */}
      <VoiceAssistantBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F3'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E4DEC8',
    backgroundColor: '#FBF9F3'
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  subGreeting: {
    color: '#556B48',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  mainGreeting: {
    color: '#2D3748',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 3
  },
  logoutButton: {
    backgroundColor: '#EBF0E8',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#8FA382',
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  connectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE6',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E4DEC8'
  },
  connectedText: {
    color: '#556B48',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14
  },
  bigCard: {
    borderRadius: 24,
    padding: 20,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 125,
    borderWidth: 2,
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  pastelBlueCard: {
    backgroundColor: '#EEF3F8',
    borderColor: '#A0B2C6'
  },
  sageGreenCard: {
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382'
  },
  gentlePinkCard: {
    backgroundColor: '#FDF2F4',
    borderColor: '#E8B4B8'
  },
  cardIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5
  },
  blueIconWrapper: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A0B2C6'
  },
  greenIconWrapper: {
    backgroundColor: '#FFFFFF',
    borderColor: '#8FA382'
  },
  pinkIconWrapper: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8B4B8'
  },
  cardTextWrapper: {
    flex: 1,
    justifyContent: 'center'
  },
  cardTitle: {
    color: '#2D3748',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  cardSubtitle: {
    color: '#556B48',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2
  },
  cardDescription: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3
  }
});
