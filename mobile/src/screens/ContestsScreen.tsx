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
import { contestsApi, modesApi, categoriesApi } from '@/lib/api';
import { ContestCard } from '@/components/contests/ContestCard';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContestWithDetails } from '@/lib/types';

interface ContestsScreenProps {
  onNavigateToContest: (id: number) => void;
}

type StatusFilter = 'all' | 'open' | 'active' | 'completed';

export function ContestsScreen({ onNavigateToContest }: ContestsScreenProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: contests, isLoading, refetch } = useQuery({
    queryKey: ['contests', statusFilter],
    queryFn: () => contestsApi.getAll(statusFilter !== 'all' ? { status: statusFilter } : undefined),
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

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Contests</Text>
      <Text style={styles.subtitle}>Find and join investment competitions</Text>

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
        data={contests || []}
        renderItem={renderContest}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            title="No Contests Found"
            description={`No ${statusFilter !== 'all' ? statusFilter : ''} contests available right now.`}
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
  filterRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
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
