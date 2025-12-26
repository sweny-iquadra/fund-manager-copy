import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme';
import { contestsApi, modesApi, categoriesApi } from '@/lib/api';
import { ContestCard } from '@/components/contests/ContestCard';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent } from '@/components/ui/Card';
import { ContestWithDetails } from '@/lib/types';

interface ContestsScreenProps {
  onNavigateToContest: (id: number) => void;
  onNavigateToCreateContest?: () => void;
}

type StatusFilter = 'all' | 'open' | 'active' | 'completed';

export function ContestsScreen({ onNavigateToContest, onNavigateToCreateContest }: ContestsScreenProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: contests, isLoading, refetch } = useQuery({
    queryKey: ['contests'],
    queryFn: () => contestsApi.getAll(),
  });

  const { data: modes } = useQuery({
    queryKey: ['modes'],
    queryFn: () => modesApi.getAll(),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  const filteredContests = useMemo(() => {
    if (!contests) return [];
    return contests.filter((contest: any) => {
      const matchesSearch =
        contest.contestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contest.mode?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMode = modeFilter === 'all' || contest.modeId?.toString() === modeFilter;
      const matchesStatus = statusFilter === 'all' || contest.status === statusFilter;
      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [contests, searchTerm, modeFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!contests) return { total: 0, participants: 0, prizePool: 0 };
    return {
      total: contests.length,
      participants: contests.reduce((sum: number, c: any) => sum + (c.participantCount || 0), 0),
      prizePool: contests.reduce((sum: number, c: any) => sum + parseFloat(c.prizePool || '0'), 0),
    };
  }, [contests]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Contests</Text>
          <Text style={styles.subtitle}>Join competitions and compete for prizes</Text>
        </View>
        {onNavigateToCreateContest && (
          <TouchableOpacity style={styles.createButton} onPress={onNavigateToCreateContest}>
            <Ionicons name="add" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Ionicons name="trophy" size={20} color={colors.accent} />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Contests</Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Ionicons name="people" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{stats.participants}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Ionicons name="cash" size={20} color={colors.success} />
            <Text style={styles.statValue}>{formatCurrency(stats.prizePool)}</Text>
            <Text style={styles.statLabel}>Prize Pool</Text>
          </CardContent>
        </Card>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contests..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={colors.textMuted}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Status</Text>
        <View style={styles.filterRow}>
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                statusFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {modes && modes.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Mode</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScrollView}>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  modeFilter === 'all' && styles.filterButtonActive,
                ]}
                onPress={() => setModeFilter('all')}
              >
                <Text style={[styles.filterText, modeFilter === 'all' && styles.filterTextActive]}>
                  All Modes
                </Text>
              </TouchableOpacity>
              {modes.map((mode: any) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[
                    styles.filterButton,
                    modeFilter === mode.id.toString() && styles.filterButtonActive,
                  ]}
                  onPress={() => setModeFilter(mode.id.toString())}
                >
                  <Text
                    style={[
                      styles.filterText,
                      modeFilter === mode.id.toString() && styles.filterTextActive,
                    ]}
                  >
                    {mode.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderContest = ({ item }: { item: ContestWithDetails }) => (
    <View style={styles.cardContainer}>
      <ContestCard contest={item} onPress={() => onNavigateToContest(item.id)} />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <Loading fullScreen text="Loading contests..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredContests}
        renderItem={renderContest}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            title="No Contests Found"
            description={
              searchTerm || statusFilter !== 'all' || modeFilter !== 'all'
                ? 'Try adjusting your filters to find more contests.'
                : 'Be the first to create a contest!'
            }
            style={styles.emptyState}
          />
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  createButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  filterSection: {
    marginTop: spacing.md,
  },
  modeScrollView: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textOnPrimary,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  cardContainer: {
    paddingHorizontal: spacing.lg,
  },
  emptyState: {
    marginTop: spacing.xxl,
  },
});
