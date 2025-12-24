import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows, gradients } from '@/lib/theme';
import { contestsApi, userApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { ContestCard } from '@/components/contests/ContestCard';
import { LinearGradient } from 'expo-linear-gradient';

interface HomeScreenProps {
  onNavigateToContests: () => void;
  onNavigateToCreateContest: () => void;
  onNavigateToContest: (id: number) => void;
  onNavigateToLeaderboard: () => void;
}

export function HomeScreen({
  onNavigateToContests,
  onNavigateToCreateContest,
  onNavigateToContest,
  onNavigateToLeaderboard,
}: HomeScreenProps) {
  const { user } = useAuth();

  const { data: contests, isLoading: contestsLoading, refetch } = useQuery({
    queryKey: ['contests', 'active'],
    queryFn: () => contestsApi.getAll({ status: 'active' }),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user', 'stats'],
    queryFn: () => userApi.getStats(),
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  const activeContests = contests?.slice(0, 3) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={gradients.financial} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.greeting}>
              <Text style={styles.greetingText}>Welcome back,</Text>
              <Text style={styles.userName}>
                {user?.firstName || 'Trader'}
              </Text>
            </View>
            <Avatar
              source={user?.profileImageUrl}
              name={`${user?.firstName || ''} ${user?.lastName || ''}`}
              size={48}
            />
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Account Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(user?.balance || '10000.00')}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Ionicons name="trophy-outline" size={24} color={colors.accent} />
              <Text style={styles.statValue}>{stats?.totalContests || 0}</Text>
              <Text style={styles.statLabel}>Contests</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Ionicons name="cash-outline" size={24} color={colors.success} />
              <Text style={styles.statValue}>{formatCurrency(stats?.totalWinnings || 0)}</Text>
              <Text style={styles.statLabel}>Winnings</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{stats?.winRate?.toFixed(0) || 0}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </CardContent>
          </Card>
        </View>

        <View style={styles.quickActions}>
          <View style={styles.quickActionsHeader}>
            <View>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <Text style={styles.quickActionsSubtitle}>Join or create a contest in seconds.</Text>
            </View>
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="flash-outline" size={20} color={colors.primary} />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, styles.joinAction]}
            onPress={onNavigateToContests}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '12' }]}>
              <Ionicons name="trophy-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.actionTextWrapper}>
              <Text style={styles.actionTitle}>Join a Contest</Text>
              <Text style={styles.actionSubtitle}>Find open contests to start competing</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.createAction]}
            onPress={onNavigateToCreateContest}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.accent + '12' }]}>
              <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.actionTextWrapper}>
              <Text style={styles.actionTitle}>Create a Contest</Text>
              <Text style={styles.actionSubtitle}>Set the rules and invite others</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onNavigateToLeaderboard}>
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="podium-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.actionTextWrapper}>
              <Text style={styles.actionTitle}>Leaderboards</Text>
              <Text style={styles.actionSubtitle}>See who is leading across contests</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Contests</Text>
            <TouchableOpacity onPress={onNavigateToContests}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {contestsLoading ? (
            <Loading text="Loading contests..." />
          ) : activeContests.length > 0 ? (
            activeContests.map((contest: any) => (
              <ContestCard
                key={contest.id}
                contest={contest}
                onPress={() => onNavigateToContest(contest.id)}
              />
            ))
          ) : (
            <Card>
              <CardContent style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={48} color={colors.gray[300]} />
                <Text style={styles.emptyTitle}>No Active Contests</Text>
                <Text style={styles.emptyText}>Check out available contests to join</Text>
                <Button
                  title="Browse Contests"
                  onPress={onNavigateToContests}
                  variant="primary"
                  style={styles.emptyButton}
                />
              </CardContent>
            </Card>
          )}
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
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {},
  greetingText: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceAmount: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: -40,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'column',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  quickActionsSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: '100%',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinAction: {
    borderColor: colors.primary + '30',
    backgroundColor: colors.primary + '08',
  },
  createAction: {
    borderColor: colors.accent + '30',
    backgroundColor: colors.accent + '10',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  actionTextWrapper: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyButton: {
    marginTop: spacing.lg,
  },
});
