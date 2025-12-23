import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing } from '@/lib/theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  color?: string;
}

export function Logo({ size = 'md', showText = true, color = colors.primary }: LogoProps) {
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  };

  const textSizes = {
    sm: fontSize.md,
    md: fontSize.xl,
    lg: fontSize.xxxl,
  };

  return (
    <View style={styles.container}>
      <Ionicons name="trending-up" size={iconSizes[size]} color={color} />
      {showText && (
        <Text style={[styles.text, { fontSize: textSizes[size], color }]}>
          FinanceFantasy
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    fontWeight: fontWeight.bold,
  },
});
