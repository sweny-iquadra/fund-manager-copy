import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, spacing } from '@/lib/theme';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  color?: string;
  onPress?: () => void;
}

export function Logo({
  size = 'md',
  showText = true,
  color = colors.primary,
  onPress,
}: LogoProps) {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

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

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    // Default behavior: go to Welcome when logged out, Home when logged in
    try {
      if (isAuthenticated) {
        const parentNav = navigation.getParent?.() || navigation;
        parentNav.navigate('HomeTab');
      } else {
        navigation.navigate('Welcome');
      }
    } catch {
      // best-effort navigation; swallow if navigation context unavailable
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      <Ionicons name="trending-up" size={iconSizes[size]} color={color} />
      {showText && (
        <Text style={[styles.text, { fontSize: textSizes[size], color }]}>
          FinanceFantasy
        </Text>
      )}
    </TouchableOpacity>
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
