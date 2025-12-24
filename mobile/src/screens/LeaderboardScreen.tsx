import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme';
import { contestsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';

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
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>See how you rank against others</Text>
      </View>

      {contests && contests.length > 0 && (
        <View style={styles.contestSelector}>
          <Text style={styles.selectorLabel}>Select Contest</Text>
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
                  numberOfLines={1}
                >
                  {contest.contestName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {selectedContest && (
        <Card style={styles.contestCard}>
          <CardContent>
            <View style={styles.contestInfo}>
              <View style={styles.contestDetails}>
                <Text style={styles.contestName}>{selectedContest.contestName}</Text>
                <Text style={styles.contestMode}>{selectedContest.mode?.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => onNavigateToContest(selectedContest.id)}
              >
                <Text style={styles.viewButtonText}>View</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>
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
      <FlatList
        data={leaderboard || []}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          leaderboardLoading ? (
            <Loading text="Loading leaderboard..." />
          ) : (
            <EmptyState
              icon="podium-outline"
              title="No Rankings Yet"
              description="Rankings will appear once the contest starts"
              style={styles.emptyState}
            />
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
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
  contestSelector: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  selectorLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  contestOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    maxWidth: '48%',
  },
  contestOptionActive: {
    backgroundColor: colors.primary,
  },
  contestOptionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  contestOptionTextActive: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.medium,
  },
  contestCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  contestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contestDetails: {
    flex: 1,
  },
  contestName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  contestMode: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: 2,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  emptyState: {
    marginTop: spacing.xl,
  },
});
