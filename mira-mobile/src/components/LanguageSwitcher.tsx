import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView
} from 'react-native';
import { Globe, Check, X } from 'lucide-react-native';
import { useMiraStore } from '../store/useMiraStore';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  LanguageOption,
  getTranslation
} from '../utils/translations';
import { triggerHaptic, speakAloud } from '../utils/audioService';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { selectedLanguage, setLanguage } = useMiraStore();
  const [modalVisible, setModalVisible] = useState(false);

  const t = getTranslation(selectedLanguage);
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const handleSelectLanguage = (lang: LanguageOption) => {
    triggerHaptic('success');
    setLanguage(lang.code);
    setModalVisible(false);

    // Speak quick confirmation in the newly selected language
    const confirmationText =
      lang.code === 'as'
        ? 'ভাষা অসমীয়ালৈ সলনি কৰা হ’ল।'
        : lang.code === 'bn'
        ? 'ভাষা বাংলায় পরিবর্তিত হয়েছে।'
        : lang.code === 'mni'
        ? 'লোন মৈতৈলোন্দা হোংদোক্লে।'
        : lang.code === 'kha'
        ? 'La kylla sha ka Ktien Khasi.'
        : lang.code === 'hi'
        ? 'भाषा हिन्दी में बदली गई।'
        : 'Language switched to English.';

    speakAloud(confirmationText, undefined, lang.speechCode);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.switcherButton, compact && styles.switcherCompact]}
        onPress={() => {
          triggerHaptic('light');
          setModalVisible(true);
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Change Language. Currently ${currentLang.nativeName}`}
      >
        <Globe size={compact ? 18 : 22} color="#556B48" />
        <Text style={[styles.switcherText, compact && styles.switcherTextCompact]}>
          {currentLang.nativeName}
        </Text>
      </TouchableOpacity>

      {/* Full Elder-Friendly Language Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Globe size={28} color="#556B48" />
                <Text style={styles.modalTitle}>Choose Language / ভাষা বাছক</Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close language selector"
              >
                <X size={24} color="#556B48" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select your preferred North Eastern language:
            </Text>

            {/* Language Options List */}
            <View style={styles.optionsList}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;

                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langOptionCard, isSelected && styles.langOptionSelected]}
                    onPress={() => handleSelectLanguage(lang)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.langLeft}>
                      <Text style={styles.flagEmoji}>{lang.flag}</Text>
                      <View>
                        <Text style={[styles.nativeNameText, isSelected && styles.selectedText]}>
                          {lang.nativeName}
                        </Text>
                        <Text style={styles.englishNameText}>{lang.name}</Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Check size={20} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Done Button */}
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>{t.done}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382',
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    minHeight: 44
  },
  switcherCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 38
  },
  switcherText: {
    color: '#2D3748',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 6
  },
  switcherTextCompact: {
    fontSize: 14,
    marginLeft: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 55, 72, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#FBF9F3',
    borderColor: '#E4DEC8',
    borderWidth: 2,
    borderRadius: 28,
    padding: 22,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  modalTitle: {
    color: '#2D3748',
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 8
  },
  closeBtn: {
    backgroundColor: '#F3EFE6',
    padding: 8,
    borderRadius: 14
  },
  modalSubtitle: {
    color: '#556B48',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14
  },
  optionsList: {
    gap: 8,
    marginVertical: 6
  },
  langOptionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4DEC8',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64
  },
  langOptionSelected: {
    backgroundColor: '#EBF0E8',
    borderColor: '#8FA382',
    borderWidth: 2.5
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  flagEmoji: {
    fontSize: 26
  },
  nativeNameText: {
    color: '#2D3748',
    fontSize: 18,
    fontWeight: '800'
  },
  selectedText: {
    color: '#556B48'
  },
  englishNameText: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '600'
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8FA382',
    justifyContent: 'center',
    alignItems: 'center'
  },
  doneBtn: {
    backgroundColor: '#8FA382',
    borderColor: '#556B48',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800'
  }
});
