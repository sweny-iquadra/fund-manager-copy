import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/lib/theme';
import { portfolioApi, stocksApi, contestsApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';

interface PortfolioScreenProps {
  contestId: number;
  onGoBack: () => void;
}

interface Allocation {
  symbol: string;
  companyName: string;
  allocation: number;
  currentPrice?: number;
  change?: number;
}

export function PortfolioScreen({ contestId, onGoBack }: PortfolioScreenProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { data: contest } = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestsApi.getById(contestId),
  });

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', contestId],
    queryFn: () => portfolioApi.get(contestId),
  });

  const { data: performance } = useQuery({
    queryKey: ['performance', contestId],
    queryFn: () => portfolioApi.getPerformance(contestId),
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['stocks', 'search', searchQuery],
    queryFn: () => stocksApi.search(searchQuery, contest?.category?.name),
    enabled: searchQuery.length >= 2,
  });

  const saveMutation = useMutation({
    mutationFn: (allocs: any[]) => portfolioApi.update(contestId, allocs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', contestId] });
      queryClient.invalidateQueries({ queryKey: ['performance', contestId] });
      Alert.alert('Success', 'Portfolio saved successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to save portfolio');
    },
  });

  React.useEffect(() => {
    if (portfolio?.allocations) {
      setAllocations(
        portfolio.allocations.map((a: any) => ({
          symbol: a.symbol,
          companyName: a.companyName || a.symbol,
          allocation: parseFloat(a.allocation),
        }))
      );
    }
  }, [portfolio]);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['portfolio', contestId] });
    setRefreshing(false);
  };

  const totalAllocation = allocations.reduce((sum, a) => sum + a.allocation, 0);
  const remainingAllocation = 100 - totalAllocation;
  const maxInvestments = contest?.category?.maxInvestments || 10;

  const addStock = (stock: any) => {
    if (allocations.length >= maxInvestments) {
      Alert.alert('Limit Reached', `Maximum ${maxInvestments} investments allowed`);
      return;
    }
    if (allocations.find((a) => a.symbol === stock.symbol)) {
      Alert.alert('Already Added', 'This stock is already in your portfolio');
      return;
    }
    setAllocations([
      ...allocations,
      {
        symbol: stock.symbol,
        companyName: stock.name || stock.symbol,
        allocation: 0,
      },
    ]);
    setSearchQuery('');
  };

  const removeStock = (symbol: string) => {
    setAllocations(allocations.filter((a) => a.symbol !== symbol));
  };

  const updateAllocation = (symbol: string, value: number) => {
    setAllocations(
      allocations.map((a) =>
        a.symbol === symbol ? { ...a, allocation: Math.min(100, Math.max(0, value)) } : a
      )
    );
  };

  const handleSave = () => {
    if (totalAllocation !== 100) {
      Alert.alert('Invalid Allocation', 'Total allocation must equal 100%');
      return;
    }
    saveMutation.mutate(
      allocations.map((a) => ({
        symbol: a.symbol,
        companyName: a.companyName,
        allocation: a.allocation.toString(),
        amount: ((a.allocation / 100) * 1000000).toFixed(2),
      }))
    );
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return <Loading fullScreen text="Loading portfolio..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <Text style={styles.subtitle}>{contest?.contestName}</Text>
        </View>

        {performance && (
          <Card style={styles.performanceCard}>
            <CardContent>
              <View style={styles.performanceRow}>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceLabel}>Portfolio Value</Text>
                  <Text style={styles.performanceValue}>
                    {formatCurrency(performance.portfolioValue || 1000000)}
                  </Text>
                </View>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceLabel}>Total Return</Text>
                  <Text
                    style={[
                      styles.performanceValue,
                      (performance.totalReturn || 0) >= 0 ? styles.gain : styles.loss,
                    ]}
                  >
                    {formatPercent(performance.totalReturn || 0)}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        <View style={styles.allocationSummary}>
          <View style={styles.allocationBar}>
            <View
              style={[
                styles.allocationFill,
                { width: `${Math.min(totalAllocation, 100)}%` },
                totalAllocation > 100 && styles.allocationOverflow,
              ]}
            />
          </View>
          <Text style={styles.allocationText}>
            {totalAllocation.toFixed(0)}% allocated ({remainingAllocation.toFixed(0)}% remaining)
          </Text>
        </View>

        <Card style={styles.searchCard}>
          <CardHeader>
            <Text style={styles.cardTitle}>Add Investments</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stocks, crypto..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textMuted}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {searchLoading && <Loading size="small" text="Searching..." />}

            {searchResults && searchResults.length > 0 && (
              <View style={styles.searchResults}>
                {searchResults.slice(0, 5).map((stock: any) => (
                  <TouchableOpacity
                    key={stock.symbol}
                    style={styles.searchResult}
                    onPress={() => addStock(stock)}
                  >
                    <View>
                      <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                      <Text style={styles.stockName} numberOfLines={1}>
                        {stock.name}
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        <Card style={styles.allocationsCard}>
          <CardHeader style={styles.allocationsHeader}>
            <Text style={styles.cardTitle}>Your Allocations</Text>
            <Badge
              label={`${allocations.length}/${maxInvestments}`}
              variant={allocations.length >= maxInvestments ? 'warning' : 'default'}
            />
          </CardHeader>
          <CardContent>
            {allocations.length === 0 ? (
              <View style={styles.emptyAllocations}>
                <Ionicons name="pie-chart-outline" size={48} color={colors.gray[300]} />
                <Text style={styles.emptyText}>No investments added yet</Text>
                <Text style={styles.emptySubtext}>Search and add stocks above</Text>
              </View>
            ) : (
              allocations.map((allocation) => (
                <View key={allocation.symbol} style={styles.allocationItem}>
                  <View style={styles.allocationInfo}>
                    <Text style={styles.allocationSymbol}>{allocation.symbol}</Text>
                    <Text style={styles.allocationName} numberOfLines={1}>
                      {allocation.companyName}
                    </Text>
                  </View>
                  <View style={styles.allocationControls}>
                    <TextInput
                      style={styles.allocationInput}
                      value={allocation.allocation.toString()}
                      onChangeText={(text) => {
                        const num = parseFloat(text) || 0;
                        updateAllocation(allocation.symbol, num);
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text style={styles.percentSign}>%</Text>
                    <TouchableOpacity
                      onPress={() => removeStock(allocation.symbol)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </CardContent>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Save Portfolio"
            onPress={handleSave}
            loading={saveMutation.isPending}
            disabled={allocations.length === 0 || totalAllocation !== 100}
            fullWidth
            size="lg"
          />
          {totalAllocation !== 100 && allocations.length > 0 && (
            <Text style={styles.warningText}>
              Allocation must equal 100% to save
            </Text>
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
  header: {
    padding: spacing.lg,
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
  performanceCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  performanceValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  gain: {
    color: colors.gain,
  },
  loss: {
    color: colors.loss,
  },
  allocationSummary: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  allocationBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  allocationFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  allocationOverflow: {
    backgroundColor: colors.error,
  },
  allocationText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  searchCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
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
  searchResults: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  searchResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stockSymbol: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  stockName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    maxWidth: 200,
  },
  allocationsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  allocationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyAllocations: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  allocationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  allocationInfo: {
    flex: 1,
  },
  allocationSymbol: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  allocationName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  allocationControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocationInput: {
    width: 50,
    height: 36,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  percentSign: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    marginRight: spacing.md,
  },
  removeButton: {
    padding: spacing.xs,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  warningText: {
    fontSize: fontSize.sm,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
