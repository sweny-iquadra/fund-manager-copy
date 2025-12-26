import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, fontWeight, borderRadius, gradients } from '@/lib/theme';
import { contestsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { Badge } from '@/components/ui/Badge';

interface LeaderboardScreenProps {
  onNavigateToContest: (id: number) => void;
}

export function LeaderboardScreen({ onNavigateToContest }: LeaderboardScreenProps) {
  const { user } = useAuth();
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: contests, isLoading: contestsLoading } = useQuery({
    queryKey: ['contests', 'active'],
    queryFn: () => contestsApi.getAll({ status: 'active' }),
  });

  const { data: leaderboard, isLoading: leaderboardLoading, refetch } = useQuery({
    queryKey: ['leaderboard', selectedContestId],
    queryFn: () => contestsApi.getLeaderboard(selectedContestId!),
    enabled: !!selectedContestId,
  });

  React.useEffect(() => {
    if (contests && contests.length > 0 && !selectedContestId) {
      setSelectedContestId(contests[0].id);
    }
  }, [contests, selectedContestId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const selectedContest = contests?.find((c: any) => c.id === selectedContestId);

  const renderLeaderboardItem = ({ item, index }: { item: any; index: number }) => (
    <LeaderboardRow entry={item} isCurrentUser={item.userId === user?.id} />
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboards</Text>
        <Text style={styles.subtitle}>Track your performance against other traders</Text>
      </View>

      {contests && contests.length > 0 && (
        <Card style={styles.selectorCard}>
          <CardContent>
            <View style={styles.selectorHeader}>
              <Ionicons name="trophy-outline" size={20} color={colors.primary} />
              <Text style={styles.selectorLabel}>Select Contest</Text>
            </View>
            <View style={styles.pickerContainer}>
              {contests.map((contest: any) => (
                <TouchableOpacity
                  key={contest.id}
                  style={[
                    styles.contestOption,
                    selectedContestId === contest.id && styles.contestOptionActive,
                  ]}
                  onPress={() => setSelectedContestId(contest.id)}
                >
                  <Text
                    style={[
                      styles.contestOptionText,
                      selectedContestId === contest.id && styles.contestOptionTextActive,
                    ]}
                  >
                    {contest.contestName}
                  </Text>
                  <Text style={styles.contestOptionSubtext}>
                    {contest.category?.name} · {contest.mode?.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </CardContent>
        </Card>
      )}

      {selectedContest && (
        <LinearGradient colors={gradients.financial} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTitle}>
              <Text style={styles.heroName}>{selectedContest.contestName}</Text>
              <View style={styles.heroBadges}>
                <Badge label={selectedContest.category?.name || ''} variant="primary" />
                <Badge
                  label={selectedContest.mode?.name || ''}
                  variant="outline"
                  style={styles.heroBadgeOutline}
                  textStyle={styles.heroBadgeOutlineText}
                />
              </View>
              <Text style={styles.heroMeta}>
                Contest ends {new Date(selectedContest.endDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.heroPrize}>
              <Text style={styles.heroPrizeValue}>${selectedContest.prizePool}</Text>
              <Text style={styles.heroPrizeLabel}>Prize Pool</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(selectedContest.endDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )}
              </Text>
              <Text style={styles.heroStatLabel}>Days Left</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>${selectedContest.entryFee}</Text>
              <Text style={styles.heroStatLabel}>Entry Fee</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{leaderboard?.length || 0}</Text>
              <Text style={styles.heroStatLabel}>Participants</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewContestButton}
            onPress={() => onNavigateToContest(selectedContest.id)}
          >
            <Text style={styles.viewContestText}>View Contest</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </LinearGradient>
      )}
    </View>
  );

  if (contestsLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Loading fullScreen text="Loading contests..." />
      </SafeAreaView>
    );
  }

  if (!contests || contests.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <EmptyState
          icon="podium-outline"
          title="No Active Contests"
          description="Join a contest to see the leaderboard"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}

        <Card style={styles.leaderboardCard}>
          <CardContent>
            <View style={styles.leaderboardHeader}>
              <View style={styles.leaderboardTitle}>
                <Ionicons name="medal-outline" size={20} color={colors.primary} />
                <Text style={styles.leaderboardTitleText}>Live Rankings</Text>
              </View>
              <Badge label={`${leaderboard?.length || 0} players`} variant="outline" />
            </View>

            {leaderboardLoading ? (
              <Loading text="Loading leaderboard..." />
            ) : leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((entry: any, index: number) => (
                <LeaderboardRow
                  key={entry.id || index}
                  entry={entry}
                  isCurrentUser={entry.userId === user?.id}
                  prizePool={selectedContest ? parseFloat(selectedContest.prizePool || '0') : undefined}
                />
              ))
            ) : (
              <View style={styles.emptyLeaderboard}>
                <Ionicons name="trending-up-outline" size={40} color={colors.gray[300]} />
                <Text style={styles.emptyLeaderboardTitle}>No leaderboard data available</Text>
                <Text style={styles.emptyLeaderboardText}>
                  Rankings will appear once the contest starts and participants make allocations.
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {selectedContest && (
          <Card style={styles.prizeCard}>
            <CardContent>
              <View style={styles.prizeHeader}>
                <Ionicons name="cash-outline" size={20} color={colors.accent} />
                <Text style={styles.prizeTitle}>Prize Distribution</Text>
              </View>
              <View style={styles.prizeGrid}>
                <View style={[styles.prizeTile, styles.prizeFirst]}>
                  <Ionicons name="trophy" size={28} color={colors.accent} />
                  <Text style={styles.prizePlace}>1st Place</Text>
                  <Text style={styles.prizeAmount}>
                    ${Math.round(Number(selectedContest.prizePool) * 0.5)}
                  </Text>
                </View>
                <View style={[styles.prizeTile, styles.prizeSecond]}>
                  <Ionicons name="medal-outline" size={28} color={colors.gray[600]} />
                  <Text style={styles.prizePlace}>2nd Place</Text>
                  <Text style={styles.prizeAmount}>
                    ${Math.round(Number(selectedContest.prizePool) * 0.3)}
                  </Text>
                </View>
                <View style={[styles.prizeTile, styles.prizeThird]}>
                  <Ionicons name="ribbon-outline" size={28} color={colors.warning} />
                  <Text style={styles.prizePlace}>3rd Place</Text>
                  <Text style={styles.prizeAmount}>
                    ${Math.round(Number(selectedContest.prizePool) * 0.2)}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}
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
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  selectorCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectorLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  pickerContainer: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  contestOption: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  contestOptionActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  contestOptionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  contestOptionTextActive: {
    color: colors.primary,
  },
  contestOptionSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heroTitle: {
    flex: 1,
  },
  heroName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  heroBadgeOutline: {
    borderColor: colors.textOnPrimary,
    backgroundColor: 'transparent',
  },
  heroBadgeOutlineText: {
    color: colors.textOnPrimary,
  },
  heroMeta: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  heroPrize: {
    alignItems: 'flex-end',
  },
  heroPrizeValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  heroPrizeLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  heroStatLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  viewContestButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.full,
  },
  viewContestText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  leaderboardCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leaderboardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leaderboardTitleText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptyLeaderboard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyLeaderboardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptyLeaderboardText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  prizeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  prizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  prizeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  prizeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  prizeTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  prizeFirst: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  prizeSecond: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[300],
  },
  prizeThird: {
    backgroundColor: colors.accent + '15',
    borderColor: colors.accent,
  },
  prizePlace: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  prizeAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
});
