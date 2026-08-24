import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Volume2, Mic, VolumeX } from 'lucide-react-native';
import { speakAloud, stopSpeech, triggerHaptic } from '../utils/audioService';
import { useMiraStore } from '../store/useMiraStore';
import { getTranslation, SUPPORTED_LANGUAGES } from '../utils/translations';

interface VoiceAssistantBarProps {
  currentPromptText?: string;
}

export const VoiceAssistantBar: React.FC<VoiceAssistantBarProps> = ({
  currentPromptText
}) => {
  const { selectedLanguage } = useMiraStore();
  const t = getTranslation(selectedLanguage);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const defaultPrompt = t.tapToContinue;
  const promptToSpeak = currentPromptText || defaultPrompt;

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const handleToggleVoice = () => {
    triggerHaptic('medium');
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakAloud(
        promptToSpeak,
        () => {
          setIsSpeaking(false);
        },
        currentLangObj.speechCode
      );
    }
  };

  return (
    <View style={styles.floatingContainer}>
      <TouchableOpacity
        style={[styles.barButton, isSpeaking && styles.speakingActive]}
        onPress={handleToggleVoice}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t.voiceAssistant}
      >
        <View style={[styles.iconCircle, isSpeaking && styles.iconCircleActive]}>
          <Volume2 size={28} color={isSpeaking ? '#FFFFFF' : '#556B48'} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.barTitle, isSpeaking && styles.barTitleActive]}>
            {isSpeaking ? t.readingAloud : t.voiceAssistant}
          </Text>
          <Text
            style={[styles.barSubtitle, isSpeaking && styles.barSubtitleActive]}
            numberOfLines={1}
          >
            {isSpeaking ? t.pauseVoice : t.screenInstructions}
          </Text>
        </View>

        <View style={styles.micBadge}>
          <Mic size={20} color="#556B48" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 999
  },
  barButton: {
    backgroundColor: '#F3EFE6',
    borderColor: '#8FA382',
    borderWidth: 2,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    minHeight: 74
  },
  speakingActive: {
    backgroundColor: '#8FA382',
    borderColor: '#556B48'
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF0E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#8FA382'
  },
  iconCircleActive: {
    backgroundColor: '#556B48',
    borderColor: '#EBF0E8'
  },
  textContainer: {
    flex: 1
  },
  barTitle: {
    color: '#2D3748',
    fontSize: 18,
    fontWeight: '800'
  },
  barTitleActive: {
    color: '#FFFFFF'
  },
  barSubtitle: {
    color: '#556B48',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2
  },
  barSubtitleActive: {
    color: '#EBF0E8'
  },
  micBadge: {
    padding: 8,
    backgroundColor: '#EBF0E8',
    borderRadius: 14
  }
});
