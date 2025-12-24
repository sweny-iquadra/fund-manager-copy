import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, fontWeight, borderRadius, gradients } from '@/lib/theme';
import { contestsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';

interface ContestDetailScreenProps {
  contestId: number;
  onNavigateToPortfolio: (contestId: number) => void;
  onGoBack: () => void;
}

export function ContestDetailScreen({
  contestId,
  onNavigateToPortfolio,
  onGoBack,
}: ContestDetailScreenProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: contest, isLoading, refetch } = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestsApi.getById(contestId),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', contestId],
    queryFn: () => contestsApi.getLeaderboard(contestId),
    enabled: !!contest,
  });

  const joinMutation = useMutation({
    mutationFn: () => contestsApi.join(contestId),
    onSuccess: () => {
      // Optimistically mark as joined so the Join button hides immediately
      queryClient.setQueryData(['contest', contestId], (existing: any) => {
        if (!existing) return existing;
        return {
          ...existing,
          userParticipating: true,
          participantCount: (existing.participantCount || 0) + 1,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      Alert.alert('Success', 'You have joined the contest!', [
        {
          text: 'Manage Portfolio',
          onPress: () => onNavigateToPortfolio(contestId),
        },
      ]);
      // Also navigate right away to mirror web flow
      onNavigateToPortfolio(contestId);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to join contest');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => contestsApi.leave(contestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest', contestId] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      Alert.alert('Success', 'You have left the contest');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to leave contest');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'success';
      case 'active': return 'primary';
      case 'closed': return 'warning';
      case 'completed': return 'default';
      default: return 'default';
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading contest..." />;
  }

  if (!contest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Contest not found</Text>
          <Button title="Go Back" onPress={onGoBack} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const isParticipating = contest.userParticipating;
  const canJoin = contest.status === 'open' && !isParticipating;
  const canLeave = contest.status === 'open' && isParticipating;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={gradients.financial} style={styles.header}>
          <View style={styles.headerTop}>
            <Badge label={contest.status.toUpperCase()} variant={getStatusVariant(contest.status) as any} />
            <Badge label={contest.contestType === 'classic' ? 'Classic' : 'Eliminator'} variant="outline" />
          </View>
          <Text style={styles.contestName}>{contest.contestName}</Text>
          <Text style={styles.modeName}>{contest.mode?.name}</Text>

          <View style={styles.prizeSection}>
            <Text style={styles.prizeLabel}>Prize Pool</Text>
            <Text style={styles.prizeAmount}>{formatCurrency(contest.prizePool)}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <Ionicons name="ticket-outline" size={24} color={colors.primary} />
                <Text style={styles.statValue}>{formatCurrency(contest.entryFee)}</Text>
                <Text style={styles.statLabel}>Entry Fee</Text>
              </CardContent>
            </Card>

            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <Ionicons name="people-outline" size={24} color={colors.success} />
                <Text style={styles.statValue}>
                  {contest.participantCount}{contest.maxParticipants ? `/${contest.maxParticipants}` : ''}
                </Text>
                <Text style={styles.statLabel}>Participants</Text>
              </CardContent>
            </Card>
          </View>

          <Card style={styles.infoCard}>
            <CardHeader>
              <Text style={styles.cardTitle}>Contest Details</Text>
            </CardHeader>
            <CardContent>
              <View style={styles.infoRow}>
                <Ionicons name="folder-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={styles.infoValue}>{contest.category?.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Start Date</Text>
                <Text style={styles.infoValue}>{formatDate(contest.startDate)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="flag-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>End Date</Text>
                <Text style={styles.infoValue}>{formatDate(contest.endDate)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="layers-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Max Investments</Text>
                <Text style={styles.infoValue}>{contest.category?.maxInvestments || 10}</Text>
              </View>
            </CardContent>
          </Card>

          {contest.category?.rules && (
            <Card style={styles.rulesCard}>
              <CardHeader>
                <Text style={styles.cardTitle}>Rules</Text>
              </CardHeader>
              <CardContent>
                <Text style={styles.rulesText}>{contest.category.rules}</Text>
              </CardContent>
            </Card>
          )}

          {leaderboard && leaderboard.length > 0 && (
            <Card style={styles.leaderboardCard}>
              <CardHeader>
                <Text style={styles.cardTitle}>Leaderboard</Text>
              </CardHeader>
              {leaderboard.slice(0, 5).map((entry: any) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  isCurrentUser={entry.userId === user?.id}
                />
              ))}
            </Card>
          )}

          <View style={styles.actions}>
            {canJoin && (
              <Button
                title={`Join Contest - ${formatCurrency(contest.entryFee)}`}
                onPress={() => joinMutation.mutate()}
                loading={joinMutation.isPending}
                fullWidth
                size="lg"
              />
            )}
            {isParticipating && (
              <Button
                title="Manage Portfolio"
                onPress={() => onNavigateToPortfolio(contestId)}
                fullWidth
                size="lg"
              />
            )}
            {canLeave && (
              <Button
                title="Leave Contest"
                onPress={() => {
                  Alert.alert(
                    'Leave Contest',
                    'Are you sure you want to leave this contest?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Leave', style: 'destructive', onPress: () => leaveMutation.mutate() },
                    ]
                  );
                }}
                variant="outline"
                fullWidth
                style={styles.leaveButton}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  contestName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  modeName: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  prizeSection: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  prizeLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  prizeAmount: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  rulesCard: {
    marginBottom: spacing.lg,
  },
  rulesText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  leaderboardCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  leaveButton: {
    borderColor: colors.error,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
});
