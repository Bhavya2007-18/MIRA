import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Eye,
  Puzzle,
  UserPlus,
  LogOut,
  HeartHandshake,
  Video,
  PhoneOff,
  Navigation,
  ShieldAlert,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { Camera } from 'expo-camera';
import { useMiraStore } from '../store/useMiraStore';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { speakAloud, triggerHaptic } from '../utils/audioService';
import { getTranslation, SUPPORTED_LANGUAGES } from '../utils/translations';
import { useLocationTracker } from '../hooks/useLocationTracker';

const TELEHEALTH_BASE_URL = 'http://localhost:8000/api/v1/telehealth';

export const HomeScreen: React.FC = () => {
  const { user, navigateTo, logout, selectedLanguage } = useMiraStore();
  const t = getTranslation(selectedLanguage);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const patientId = user?.patientCode || user?.id || 'test_patient_1';

  // 1. Real-time GPS location tracker hook (fetches GPS & pings backend every 10s)
  const { isTracking } = useLocationTracker(patientId);

  // 2. Video Call state variable: isCalling (boolean, default false)
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString(
    selectedLanguage === 'as' ? 'as-IN' : 'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }
  );

  const userName = user?.name ? user.name.split(' ')[0] : 'Bhaben';

  // Request Camera & Microphone permissions before rendering WebRTC WebView
  const requestMediaPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const micStatus = await Camera.requestMicrophonePermissionsAsync();

      if (!cameraStatus.granted || !micStatus.granted) {
        const errorMsg =
          selectedLanguage === 'as'
            ? 'ভিডিঅ’ কলৰ বাবে কেমেৰা আৰু মাইক্ৰ’ফোনৰ অনুমতি প্ৰয়োজন। অনুগ্ৰহ কৰি অনুমতি দিয়ক।'
            : 'Camera and microphone access are required to talk with your caretaker. Please grant permissions.';
        setPermissionError(errorMsg);
        speakAloud(errorMsg, undefined, currentLang.speechCode);
        return false;
      }

      setPermissionError(null);
      return true;
    } catch {
      // Fallback on platform discrepancy
      return true;
    }
  }, [selectedLanguage, currentLang.speechCode]);

  useEffect(() => {
    // Gentle regional welcome speech
    const welcomeMsg =
      selectedLanguage === 'as'
        ? `শুভ প্ৰভাত, ${userName} দেউতা। আজি আপুনি কি কৰিব বিচাৰে? তত্ত্বাৱধায়কৰ সৈতে কথা পাতক, এআই দৃষ্টি বা মগজুৰ খেল বাছনি কৰক।`
        : `Good morning, ${userName}. What would you like to do today? You can choose Talk to Caretaker, AI Vision, or Brain Games.`;

    speakAloud(welcomeMsg, undefined, currentLang.speechCode);
  }, [selectedLanguage]);

  // Polling mechanism to check if caretaker is calling: GET /api/v1/telehealth/call/{patient_id}
  useEffect(() => {
    let isMounted = true;

    const checkIncomingCall = async () => {
      try {
        const cleanId = patientId.trim().replace(/\s+/g, '-');
        const res = await fetch(`${TELEHEALTH_BASE_URL}/call/${encodeURIComponent(cleanId)}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.is_calling) {
            setIsCalling(true);
            triggerHaptic('heavy');
            speakAloud(
              selectedLanguage === 'as'
                ? 'আপোনাৰ তত্ত্বাৱধায়কে ভিডিঅ’ কল কৰিছে। সংযোগ কৰা হৈছে।'
                : 'Your caretaker is initiating a video call. Connecting now.',
              undefined,
              currentLang.speechCode
            );
          }
        }
      } catch {
        // Fail silently for offline robustness
      }
    };

    checkIncomingCall();
    const pollInterval = setInterval(checkIncomingCall, 6000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [patientId, selectedLanguage, currentLang.speechCode]);

  // When patient initiates call by pressing "Talk to Caretaker" button
  const handleTalkToCaretaker = async () => {
    triggerHaptic('heavy');
    const promptText =
      selectedLanguage === 'as'
        ? 'তত্ত্বাৱধায়কৰ সৈতে ভিডিঅ’ কল আৰম্ভ কৰা হৈছে। অলপ অপেক্ষা কৰক।'
        : 'Starting video call with your caretaker. Please wait a moment.';
    speakAloud(promptText, undefined, currentLang.speechCode);

    // Request permissions and set isCalling to true
    await requestMediaPermissions();
    setIsCalling(true);

    // Notify backend
    try {
      const cleanId = patientId.trim().replace(/\s+/g, '-');
      await fetch(`${TELEHEALTH_BASE_URL}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: cleanId }),
      });
    } catch {
      // Backend offline: connects directly via WebRTC
    }
  };

  // When patient presses "Hang Up", set isCalling back to false
  const handleHangUp = async () => {
    triggerHaptic('medium');
    const endPrompt = selectedLanguage === 'as' ? 'কল সমাপ্ত হ’ল।' : 'Call ended.';
    speakAloud(endPrompt, undefined, currentLang.speechCode);

    setIsCalling(false);

    const cleanId = patientId.trim().replace(/\s+/g, '-');
    try {
      await fetch(`${TELEHEALTH_BASE_URL}/call/${encodeURIComponent(cleanId)}/end`, {
        method: 'POST',
      });
    } catch {
      // Best effort
    }
  };

  const handleCardPress = (action: () => void, promptText: string) => {
    triggerHaptic('heavy');
    speakAloud(promptText, undefined, currentLang.speechCode);
    action();
  };

  // 4. If isCalling is true, conditionally render a full-screen <WebView> pointing to https://meet.jit.si/mira-care-test_patient_1
  if (isCalling) {
    return (
      <SafeAreaView style={styles.fullScreenCallContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* Video Call Top Bar */}
        <View style={styles.callTopBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.callTopBarTitle}>Talk to Caretaker</Text>
            <Text style={styles.callTopBarSubtitle}>
              {selectedLanguage === 'as' ? 'সুৰক্ষিত লাইভ ভিডিঅ’ সংযোগ' : 'Encrypted Jitsi Meet Video'}
            </Text>
          </View>

          {/* 5. "Hang Up" button that sets isCalling back to false */}
          <TouchableOpacity
            style={styles.hangUpButton}
            onPress={handleHangUp}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Hang Up"
          >
            <PhoneOff size={22} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text style={styles.hangUpButtonText}>Hang Up</Text>
          </TouchableOpacity>
        </View>

        {/* Full-screen WebView with WebRTC hardware props */}
        <View style={styles.callWebViewContainer}>
          {Platform.OS === 'web' ? (
            // @ts-ignore
            <iframe
              src="https://meet.jit.si/mira-care-test_patient_1"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
            />
          ) : (
            <WebView
              source={{ uri: 'https://meet.jit.si/mira-care-test_patient_1' }}
              style={styles.callWebView}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              originWhitelist={['*']}
              userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36"
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

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

        {/* Linked Caretaker & Live GPS Status Chips */}
        <View style={styles.chipsRow}>
          <View style={styles.connectedChip}>
            <HeartHandshake size={18} color="#556B48" />
            <Text style={styles.connectedText}>
              {t.connectedCaretaker} ({patientId})
            </Text>
          </View>

          <View style={[styles.gpsChip, isTracking && styles.gpsChipActive]}>
            <Navigation size={14} color={isTracking ? '#2F855A' : '#718096'} />
            <Text style={[styles.gpsText, isTracking && styles.gpsTextActive]}>
              {isTracking ? 'GPS Live' : 'GPS Idle'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Cards Scroll View */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Denied Regional Alert Banner */}
        {permissionError && (
          <View style={styles.permissionAlertCard}>
            <View style={styles.permissionAlertHeader}>
              <ShieldAlert size={24} color="#DC2626" />
              <Text style={styles.permissionAlertTitle}>
                {selectedLanguage === 'as' ? 'অনুমতি প্ৰয়োজন' : 'Permissions Needed'}
              </Text>
            </View>
            <Text style={styles.permissionAlertMessage}>{permissionError}</Text>
            <TouchableOpacity
              style={styles.permissionRetryButton}
              onPress={requestMediaPermissions}
              accessibilityRole="button"
              accessibilityLabel="Grant camera and microphone permissions"
            >
              <Text style={styles.permissionRetryText}>
                {selectedLanguage === 'as' ? 'অনুমতি দিয়ক' : 'Grant Permissions'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 1. Large, high-contrast button labeled "Talk to Caretaker" prominently at the top */}
        <TouchableOpacity
          style={[styles.bigCard, styles.amberGoldCard]}
          activeOpacity={0.85}
          onPress={handleTalkToCaretaker}
          accessibilityRole="button"
          accessibilityLabel="Talk to Caretaker"
        >
          <View style={[styles.cardIconWrapper, styles.amberIconWrapper]}>
            <Video size={42} color="#B45309" strokeWidth={2.5} />
          </View>
          <View style={styles.cardTextWrapper}>
            <Text style={[styles.cardTitle, styles.amberTitle]}>Talk to Caretaker</Text>
            <Text style={styles.amberSubtitle}>
              {selectedLanguage === 'as' ? 'মুখামুখিকৈ ভিডিঅ’ কল কৰক' : 'One-Touch Video Call'}
            </Text>
            <Text style={styles.cardDescription}>
              {selectedLanguage === 'as'
                ? 'পৰিয়াল আৰু ডাক্তৰৰ সৈতে পোনপটীয়াকৈ মুখামুখিকৈ কথা পাতক।'
                : 'Touch here to instantly connect on video with your family.'}
            </Text>
          </View>
        </TouchableOpacity>

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
    backgroundColor: '#FBF9F3',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E4DEC8',
    backgroundColor: '#FBF9F3',
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subGreeting: {
    color: '#556B48',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mainGreeting: {
    color: '#2D3748',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 3,
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
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  connectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE6',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4DEC8',
  },
  connectedText: {
    color: '#556B48',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  gpsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE6',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4DEC8',
    gap: 4,
  },
  gpsChipActive: {
    backgroundColor: '#EBF5EE',
    borderColor: '#A7D7B5',
  },
  gpsText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: '700',
  },
  gpsTextActive: {
    color: '#2F855A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  permissionAlertCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },
  permissionAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionAlertTitle: {
    color: '#991B1B',
    fontSize: 16,
    fontWeight: '900',
  },
  permissionAlertMessage: {
    color: '#7F1D1D',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 18,
  },
  permissionRetryButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  permissionRetryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
    elevation: 4,
  },
  amberGoldCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
    borderWidth: 2.5,
  },
  amberIconWrapper: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F59E0B',
  },
  amberTitle: {
    color: '#78350F',
    fontSize: 23,
    fontWeight: '900',
  },
  amberSubtitle: {
    color: '#B45309',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  pastelBlueCard: {
    backgroundColor: '#EEF3F8',
    borderColor: '#A0B2C6',
  },
  sageGreenCard: {
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382',
  },
  gentlePinkCard: {
    backgroundColor: '#FDF2F4',
    borderColor: '#E8B4B8',
  },
  cardIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5,
  },
  blueIconWrapper: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A0B2C6',
  },
  greenIconWrapper: {
    backgroundColor: '#FFFFFF',
    borderColor: '#8FA382',
  },
  pinkIconWrapper: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8B4B8',
  },
  cardTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#2D3748',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    color: '#556B48',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  cardDescription: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  fullScreenCallContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  callTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1.5,
    borderBottomColor: '#334155',
  },
  callTopBarTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  callTopBarSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  hangUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  hangUpButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  callWebViewContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  callWebView: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});

export default HomeScreen;
