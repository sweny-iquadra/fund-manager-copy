import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme';
import { Avatar } from '@/components/ui/Avatar';
import { LeaderboardEntry } from '@/lib/types';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  const formatPercent = (value: string) => {
    const num = parseFloat(value);
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Ionicons name="trophy" size={20} color="#FFD700" />;
    }
    if (rank === 2) {
      return <Ionicons name="trophy" size={20} color="#C0C0C0" />;
    }
    if (rank === 3) {
      return <Ionicons name="trophy" size={20} color="#CD7F32" />;
    }
    return <Text style={styles.rankNumber}>{rank}</Text>;
  };

  const totalReturn = parseFloat(entry.totalReturn);
  const isPositive = totalReturn >= 0;

  return (
    <View style={[styles.row, isCurrentUser && styles.currentUser]}>
      <View style={styles.rankContainer}>{getRankBadge(entry.ranking)}</View>

      <Avatar
        source={entry.user?.profileImageUrl}
        name={`${entry.user?.firstName || ''} ${entry.user?.lastName || ''}`}
        size={40}
      />

      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {entry.user?.firstName} {entry.user?.lastName}
          {isCurrentUser && ' (You)'}
        </Text>
        <Text style={styles.portfolioValue}>{formatCurrency(entry.portfolioValue)}</Text>
      </View>

      <View style={styles.returnContainer}>
        <Text style={[styles.returnPercent, isPositive ? styles.gain : styles.loss]}>
          {formatPercent(entry.totalReturn)}
        </Text>
        <Text style={[styles.returnAmount, isPositive ? styles.gain : styles.loss]}>
          {isPositive ? '+' : ''}{formatCurrency(entry.totalReturnAmount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  currentUser: {
    backgroundColor: colors.gray[50],
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  portfolioValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  returnContainer: {
    alignItems: 'flex-end',
  },
  returnPercent: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  returnAmount: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  gain: {
    color: colors.gain,
  },
  loss: {
    color: colors.loss,
  },
});
