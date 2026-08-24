import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, Volume2, ShieldCheck } from 'lucide-react-native';
import { useMiraStore } from '../store/useMiraStore';
import { speakAloud, triggerHaptic } from '../utils/audioService';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getTranslation, SUPPORTED_LANGUAGES } from '../utils/translations';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, selectedLanguage } = useMiraStore();
  const [isLoading, setIsLoading] = useState(false);

  const t = getTranslation(selectedLanguage);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const handleVoiceHelp = () => {
    triggerHaptic('medium');
    const helpMsg =
      selectedLanguage === 'as'
        ? 'মিৰালৈ স্বাগতম। আৰম্ভ কৰিবলৈ মাজৰ গুগল বুটামত টিপক।'
        : 'Welcome to MIRA, your memory companion. Tap the button in the center to sign in with Google.';

    speakAloud(helpMsg, undefined, currentLang.speechCode);
  };

  const handleGoogleLogin = async () => {
    try {
      triggerHaptic('heavy');
      setIsLoading(true);
      speakAloud(t.signingIn, undefined, currentLang.speechCode);
      await new Promise((resolve) => setTimeout(resolve, 700));
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBF9F3" />

      {/* Voice Help & Language Switcher Top Bar */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={styles.voiceHelpButton}
          onPress={handleVoiceHelp}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t.voiceHelp}
        >
          <Volume2 size={24} color="#556B48" />
          <Text style={styles.voiceHelpText}>{t.voiceHelp}</Text>
        </TouchableOpacity>

        <LanguageSwitcher compact />
      </View>

      {/* Main Logo & Title */}
      <View style={styles.centerSection}>
        <View style={styles.logoBadge}>
          <Sparkles size={52} color="#556B48" />
        </View>

        <Text style={styles.appTitle}>{t.appTitle}</Text>
        <Text style={styles.appSubtitle}>{t.appSubtitle}</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardText}>{t.appMission}</Text>
        </View>
      </View>

      {/* Google Login Action Area */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.googleSignInButton, isLoading && styles.buttonLoading]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t.signInGoogle}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <View style={styles.googleContentRow}>
              {/* Google G Logo Custom Circle */}
              <View style={styles.gLogoContainer}>
                <Text style={styles.gLogoLetter}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>{t.signInGoogle}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Security & Access indicator */}
        <View style={styles.securityRow}>
          <ShieldCheck size={20} color="#556B48" />
          <Text style={styles.securityText}>{t.securityNotice}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF9F3',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8
  },
  voiceHelpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382',
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    minHeight: 46
  },
  voiceHelpText: {
    color: '#556B48',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 6
  },
  centerSection: {
    alignItems: 'center',
    marginVertical: 16
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EBF0E8',
    borderWidth: 2.5,
    borderColor: '#8FA382',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4
  },
  appTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#2D3748',
    letterSpacing: 1.5
  },
  appSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#556B48',
    marginTop: 4,
    textAlign: 'center'
  },
  infoCard: {
    backgroundColor: '#F3EFE6',
    borderRadius: 20,
    padding: 16,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: '#E4DEC8',
    maxWidth: 360
  },
  infoCardText: {
    color: '#2D3748',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    textAlign: 'center'
  },
  bottomSection: {
    marginBottom: 16,
    alignItems: 'center'
  },
  googleSignInButton: {
    backgroundColor: '#8FA382',
    borderColor: '#556B48',
    borderWidth: 2,
    borderRadius: 22,
    width: '100%',
    minHeight: 76, // >= 72px elder accessibility target
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#556B48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6
  },
  buttonLoading: {
    backgroundColor: '#556B48'
  },
  googleContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  gLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  gLogoLetter: {
    color: '#EA4335',
    fontSize: 24,
    fontWeight: '900'
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800'
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14
  },
  securityText: {
    color: '#718096',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6
  }
});
