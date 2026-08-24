import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { triggerHaptic } from '../utils/audioService';

interface BigButtonProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  minHeight?: number;
}

export const BigButton: React.FC<BigButtonProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  backgroundColor = '#8FA382',
  textColor = '#FFFFFF',
  borderColor = '#556B48',
  style,
  textStyle,
  disabled = false,
  minHeight = 76 // Strict elder-accessibility: >= 72px touch target
}) => {
  const handlePress = () => {
    if (disabled) return;
    triggerHaptic('medium');
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? '#CBD5E1' : backgroundColor,
          minHeight: minHeight,
          borderColor: disabled ? '#94A3B8' : borderColor,
          opacity: disabled ? 0.7 : 1
        },
        style
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title} ${subtitle || ''}`}
    >
      <View style={styles.contentRow}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor }, textStyle]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: textColor + 'E6' }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 2,
    shadowColor: '#2D3748',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  iconContainer: {
    marginRight: 16
  },
  textContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'left'
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'left'
  }
});
