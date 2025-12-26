import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/lib/theme';
import { Badge } from '@/components/ui/Badge';
import { ContestWithDetails } from '@/lib/types';

interface ContestCardProps {
  contest: ContestWithDetails;
  onPress: () => void;
}

export function ContestCard({ contest, onPress }: ContestCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'active':
        return 'primary';
      case 'closed':
        return 'warning';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>
            {contest.contestName}
          </Text>
          <Text style={styles.mode}>{contest.mode?.name}</Text>
        </View>
        <Badge label={contest.status.toUpperCase()} variant={getStatusColor(contest.status) as any} size="sm" />
      </View>

      <View style={styles.categoryRow}>
        <Ionicons name="folder-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.category}>{contest.category?.name}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="trophy-outline" size={16} color={colors.accent} />
          <Text style={styles.statValue}>{formatCurrency(contest.prizePool)}</Text>
          <Text style={styles.statLabel}>Prize Pool</Text>
        </View>

        <View style={styles.stat}>
          <Ionicons name="ticket-outline" size={16} color={colors.primary} />
          <Text style={styles.statValue}>{formatCurrency(contest.entryFee)}</Text>
          <Text style={styles.statLabel}>Entry Fee</Text>
        </View>

        <View style={styles.stat}>
          <Ionicons name="people-outline" size={16} color={colors.success} />
          <Text style={styles.statValue}>
            {contest.participantCount}
            {contest.maxParticipants ? `/${contest.maxParticipants}` : ''}
          </Text>
          <Text style={styles.statLabel}>Players</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.dateText}>
            {formatDate(contest.startDate)} - {formatDate(contest.endDate)}
          </Text>
        </View>
        {contest.userParticipating && (
          <Badge label="JOINED" variant="primary" size="sm" />
        )}
      </View>

      <View style={styles.contestType}>
        <Text style={styles.contestTypeText}>
          {contest.contestType === 'classic' ? 'Classic' : 'Eliminator'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  mode: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  category: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  contestType: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  contestTypeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});
