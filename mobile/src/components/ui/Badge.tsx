import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/lib/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: any;
}

export function Badge({ label, variant = 'default', size = 'md', style, textStyle }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[`size_${size}`], style]}>
      <Text
        style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },
  default: {
    backgroundColor: colors.gray[100],
  },
  primary: {
    backgroundColor: colors.primary,
  },
  success: {
    backgroundColor: colors.successLight,
  },
  warning: {
    backgroundColor: colors.warningLight,
  },
  error: {
    backgroundColor: colors.errorLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  size_sm: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
  },
  size_md: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  text: {
    fontWeight: fontWeight.medium,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  text_default: {
    color: colors.textSecondary,
  },
  text_primary: {
    color: colors.textOnPrimary,
  },
  text_success: {
    color: colors.success,
  },
  text_warning: {
    color: colors.warning,
  },
  text_error: {
    color: colors.error,
  },
  text_outline: {
    color: colors.textSecondary,
  },
  textSize_sm: {
    fontSize: fontSize.xs,
  },
  textSize_md: {
    fontSize: fontSize.sm,
  },
});
