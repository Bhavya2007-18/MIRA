import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { PhoneOff, Video } from 'lucide-react-native';
import { useMiraStore } from './src/store/useMiraStore';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { AIVisionScreen } from './src/screens/AIVisionScreen';
import { GamesHubScreen } from './src/screens/GamesHubScreen';
import { CardGame } from './src/screens/games/CardGame';
import { AuditoryGame } from './src/screens/games/AuditoryGame';
import { MathsGame } from './src/screens/games/MathsGame';
import { UploadPersonScreen } from './src/screens/UploadPersonScreen';

import { useLocationTracker } from './src/hooks/useLocationTracker';

export default function App() {
  const { currentScreen, isAuthenticated, user } = useMiraStore();
  // 2. State variable isCalling (boolean, default false)
  const [isCalling, setIsCalling] = useState<boolean>(false);

  // 1. Mount real-time device GPS tracker posting to http://192.168.0.100:8000/api/v1/tracking/location
  const patientId = user?.patientCode || user?.id || 'test_patient_1';
  useLocationTracker(patientId);

  // 4. If isCalling is true, conditionally render a full-screen <WebView> pointing to https://meet.jit.si/mira-care-test_patient_1
  if (isCalling) {
    return (
      <SafeAreaView style={styles.fullScreenCallContainer}>
        <StatusBar style="light" backgroundColor="#0F172A" />
        <View style={styles.callTopBar}>
          <View>
            <Text style={styles.callTopBarTitle}>Talk to Caretaker</Text>
            <Text style={styles.callTopBarSubtitle}>Live Video Consultation</Text>
          </View>
          {/* 5. "Hang Up" button that sets isCalling back to false */}
          <TouchableOpacity
            style={styles.hangUpButton}
            onPress={() => setIsCalling(false)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Hang Up"
          >
            <PhoneOff size={22} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text style={styles.hangUpButtonText}>Hang Up</Text>
          </TouchableOpacity>
        </View>

        {/* 5. WebView includes allowsInlineMediaPlayback={true} and mediaPlaybackRequiresUserAction={false} */}
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

  const renderActiveScreen = () => {
    if (!isAuthenticated || currentScreen === 'LOGIN') {
      return <LoginScreen />;
    }

    switch (currentScreen) {
      case 'HOME':
        return <HomeScreen />;
      case 'AI_VISION':
        return <AIVisionScreen />;
      case 'GAMES_HUB':
        return <GamesHubScreen />;
      case 'CARD_GAME':
        return <CardGame />;
      case 'AUDITORY_GAME':
        return <AuditoryGame />;
      case 'MATHS_GAME':
        return <MathsGame />;
      case 'UPLOAD_PERSON':
        return <UploadPersonScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.appRoot}>
      <StatusBar style="dark" backgroundColor="#FBF9F3" />
      {/* 1. Large, high-contrast button labeled "Talk to Caretaker" prominently at the top of the UI */}
      <View style={styles.topCallBanner}>
        <TouchableOpacity
          style={styles.topTalkButton}
          onPress={() => setIsCalling(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Talk to Caretaker"
        >
          <Video size={24} color="#78350F" strokeWidth={2.5} style={{ marginRight: 8 }} />
          <Text style={styles.topTalkButtonText}>Talk to Caretaker</Text>
        </TouchableOpacity>
      </View>
      {renderActiveScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: '#FBF9F3',
  },
  topCallBanner: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#FBF9F3',
  },
  topTalkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 2.5,
    borderColor: '#D97706',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  topTalkButtonText: {
    color: '#78350F',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
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
