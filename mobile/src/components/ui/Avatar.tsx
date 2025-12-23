import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight } from '@/lib/theme';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ source, name, size = 40, style }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray[200],
  },
  placeholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.semibold,
  },
});
