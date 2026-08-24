import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const speakAloud = async (text: string, onDone?: () => void, langCode: string = 'en-US') => {
  try {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Stop any ongoing speech first
    Speech.stop();
    
    Speech.speak(text, {
      language: langCode,
      pitch: 1.0,
      rate: 0.85, // Slower, clearer cadence for elder accessibility
      onDone: () => {
        if (onDone) onDone();
      },
      onError: (err) => {
        console.warn('Speech synthesis error, trying fallback:', err);
        if (onDone) onDone();
      }
    });
  } catch (error) {
    console.log('Audio speech fallback:', text);
    if (onDone) onDone();
  }
};

export const stopSpeech = () => {
  try {
    Speech.stop();
  } catch (err) {
    // Ignore fallback
  }
};

export const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'medium') => {
  try {
    if (Platform.OS === 'web') return;
    
    if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (type === 'heavy') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (type === 'light') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (e) {
    // Graceful no-op on unsupported devices
  }
};
