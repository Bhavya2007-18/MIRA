import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { triggerHaptic } from '../utils/audioService';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useMiraStore } from '../store/useMiraStore';
import { getTranslation } from '../utils/translations';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  hideLanguageSwitcher?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'MIRA',
  subtitle,
  showBack = false,
  onBack,
  rightElement,
  hideLanguageSwitcher = false
}) => {
  const { selectedLanguage } = useMiraStore();
  const t = getTranslation(selectedLanguage);

  const handleBack = () => {
    triggerHaptic('light');
    if (onBack) onBack();
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={t.back}
          >
            <ChevronLeft size={30} color="#556B48" />
            <Text style={styles.backText}>{t.back}</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <View style={styles.rightContainer}>
          {!hideLanguageSwitcher && <LanguageSwitcher compact />}
          {rightElement && <View style={styles.extraRight}>{rightElement}</View>}
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{title}</Text>
        {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FBF9F3',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E4DEC8'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 48
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF0E8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#8FA382',
    minHeight: 46
  },
  backText: {
    color: '#556B48',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 4
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  extraRight: {
    marginLeft: 4
  },
  titleContainer: {
    marginTop: 4
  },
  titleText: {
    color: '#2D3748',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  subtitleText: {
    color: '#556B48',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4
  }
});
