import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/lib/theme';
import { portfolioApi, stocksApi, contestsApi, api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';

interface PortfolioScreenProps {
  contestId?: number;
  onGoBack: () => void;
}

interface Allocation {
  id?: number;
  symbol: string;
  companyName: string;
  allocation: number;
  amount: number;
  purchasePrice?: number;
  currentPrice?: number;
}

type TabType = 'allocate' | 'performance';

const PORTFOLIO_VALUE = 1000000;

export function PortfolioScreen({ contestId: initialContestId, onGoBack }: PortfolioScreenProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('allocate');
  const [selectedContestId, setSelectedContestId] = useState<number | null>(initialContestId || null);

  const { data: participations } = useQuery({
    queryKey: ['user-participations'],
    queryFn: () => api.get<any[]>('/api/user/participations'),
  });

  const { data: allContests } = useQuery({
    queryKey: ['contests'],
    queryFn: () => contestsApi.getAll(),
  });

  const activeParticipations = useMemo(() => {
    if (!participations || !allContests) return [];
    return participations.filter((p: any) => {
      const contest = allContests.find((c: any) => c.id === p.contestId);
      return contest && new Date(contest.endDate) > new Date();
    });
  }, [participations, allContests]);

  useEffect(() => {
    if (activeParticipations.length > 0 && !selectedContestId) {
      const firstParticipation = activeParticipations[0];
      setSelectedContestId(firstParticipation.contestId);
    }
  }, [activeParticipations, selectedContestId]);

  const contestId = selectedContestId || initialContestId;

  const { data: contest } = useQuery({
    queryKey: ['contest', contestId],
    queryFn: () => contestsApi.getById(contestId!),
    enabled: !!contestId,
  });

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', contestId],
    queryFn: () => portfolioApi.get(contestId!),
    enabled: !!contestId,
  });

  const { data: performance } = useQuery({
    queryKey: ['performance', contestId],
    queryFn: () => portfolioApi.getPerformance(contestId!),
    enabled: !!contestId,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['stocks', 'search', searchQuery],
    queryFn: () => stocksApi.search(searchQuery, contest?.category?.name),
    enabled: searchQuery.length >= 2,
  });

  const updateAllocationMutation = useMutation({
    mutationFn: (data: { symbol: string; allocation: number; amount: number; companyName: string }) =>
      api.put(`/api/contests/${contestId}/portfolio/${data.symbol}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', contestId] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to save allocation');
    },
  });

  const removeAllocationMutation = useMutation({
    mutationFn: (symbol: string) => api.delete(`/api/contests/${contestId}/portfolio/${symbol}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', contestId] });
      Alert.alert('Success', 'Allocation removed');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to remove allocation');
    },
  });

  useEffect(() => {
    if (portfolio?.allocations) {
      setAllocations(
        portfolio.allocations.map((a: any) => ({
          id: a.id,
          symbol: a.symbol,
          companyName: a.companyName || a.symbol,
          allocation: parseFloat(a.allocation),
          amount: parseFloat(a.amount),
          purchasePrice: a.purchasePrice ? parseFloat(a.purchasePrice) : undefined,
        }))
      );
    } else {
      setAllocations([]);
    }
  }, [portfolio]);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['portfolio', contestId] });
    await queryClient.invalidateQueries({ queryKey: ['performance', contestId] });
    setRefreshing(false);
  };

  const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0);
  const totalAllocation = allocations.reduce((sum, a) => sum + a.allocation, 0);
  const availableCash = PORTFOLIO_VALUE - totalAmount;
  const maxInvestments = contest?.category?.maxInvestments || 10;
  const isAllocationOpen = contest ? new Date(contest.closeDate) > new Date() : false;

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
        amount: 0,
      },
    ]);
    setSearchQuery('');
  };

  const removeStock = (allocation: Allocation) => {
    if (allocation.id) {
      removeAllocationMutation.mutate(allocation.symbol);
    }
    setAllocations(allocations.filter((a) => a.symbol !== allocation.symbol));
  };

  const updateAllocationAmount = (symbol: string, value: number) => {
    const newAllocations = allocations.map((a) => {
      if (a.symbol === symbol) {
        const amount = Math.min(PORTFOLIO_VALUE, Math.max(0, value));
        const allocation = (amount / PORTFOLIO_VALUE) * 100;
        return { ...a, amount, allocation };
      }
      return a;
    });
    setAllocations(newAllocations);
  };

  const updateAllocationPercent = (symbol: string, value: number) => {
    const newAllocations = allocations.map((a) => {
      if (a.symbol === symbol) {
        const allocation = Math.min(100, Math.max(0, value));
        const amount = (allocation / 100) * PORTFOLIO_VALUE;
        return { ...a, amount, allocation };
      }
      return a;
    });
    setAllocations(newAllocations);
  };

  const saveAllocation = (allocation: Allocation) => {
    if (!allocation.symbol.trim() || allocation.amount <= 0) return;
    updateAllocationMutation.mutate({
      symbol: allocation.symbol,
      allocation: allocation.allocation,
      amount: allocation.amount,
      companyName: allocation.companyName,
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (!contestId && activeParticipations.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio Management</Text>
          <Text style={styles.subtitle}>Manage your virtual $1,000,000 portfolio</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="pie-chart-outline" size={64} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>No active contests</Text>
          <Text style={styles.emptySubtext}>Join a contest to start managing your portfolio</Text>
          <Button title="Browse Contests" onPress={onGoBack} style={styles.browseButton} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <Loading fullScreen text="Loading portfolio..." />;
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'allocate', label: 'Allocate Portfolio' },
    { key: 'performance', label: 'Performance' },
  ];

  const renderContestSelector = () => {
    if (activeParticipations.length <= 1) return null;

    return (
      <Card style={styles.selectorCard}>
        <CardHeader>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="trophy-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Select Contest</Text>
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedContestId}
              onValueChange={(value) => setSelectedContestId(value)}
              style={styles.picker}
            >
              {activeParticipations.map((p: any) => {
                const c = allContests?.find((c: any) => c.id === p.contestId);
                return (
                  <Picker.Item
                    key={p.contestId}
                    label={`${c?.contestName || 'Contest'} - ${c?.category?.name || ''}`}
                    value={p.contestId}
                  />
                );
              })}
            </Picker>
          </View>
        </CardContent>
      </Card>
    );
  };

  const renderSummary = () => (
    <Card style={styles.summaryCard}>
      <CardHeader>
        <View style={styles.summaryHeaderRow}>
          <View style={[styles.cardHeaderRow, styles.summaryTitleContainer]}>
            <Ionicons name="pie-chart" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{contest?.contestName}</Text>
          </View>
          <Badge label={contest?.category?.name || ''} variant="outline" style={styles.summaryBadge} />
        </View>
      </CardHeader>
      <CardContent>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(PORTFOLIO_VALUE)}</Text>
            <Text style={styles.summaryLabel}>Portfolio Value</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(parseFloat(contest?.prizePool || '0'))}</Text>
            <Text style={styles.summaryLabel}>Prize Pool</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>
              {contest && new Date(contest.endDate) > new Date()
                ? Math.ceil((new Date(contest.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : 0}
            </Text>
            <Text style={styles.summaryLabel}>Days Left</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{isAllocationOpen ? 'Open' : 'Closed'}</Text>
            <Text style={styles.summaryLabel}>Allocation</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  const renderAllocationBar = () => (
    <View style={styles.allocationSummary}>
      <View style={styles.allocationBar}>
        <View
          style={[
            styles.allocationFill,
            { width: `${Math.min((totalAmount / PORTFOLIO_VALUE) * 100, 100)}%` },
            totalAmount > PORTFOLIO_VALUE && styles.allocationOverflow,
          ]}
        />
      </View>
      <View style={styles.allocationBadges}>
        <Badge
          label={`${formatCurrency(totalAmount)} allocated`}
          variant={totalAmount > PORTFOLIO_VALUE ? 'error' : 'default'}
        />
        <Badge label={`${allocations.filter((a) => a.symbol.trim()).length}/${maxInvestments} stocks`} variant="outline" />
        <Badge label={`${formatCurrency(availableCash)} available`} variant="success" />
      </View>
    </View>
  );

  const renderAllocateTab = () => (
    <View style={styles.tabContent}>
      {!isAllocationOpen && (
        <View style={styles.closedBanner}>
          <Ionicons name="lock-closed" size={20} color={colors.warning} />
          <View style={styles.closedText}>
            <Text style={styles.closedTitle}>Allocation Period Closed</Text>
            <Text style={styles.closedSubtext}>
              You can no longer modify your portfolio allocations.
            </Text>
          </View>
        </View>
      )}

      {isAllocationOpen && allocations.length < maxInvestments && (
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
                      <Text style={styles.stockName} numberOfLines={1}>{stock.name}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      )}

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
              <Text style={styles.emptySubtextSmall}>Search and add stocks above</Text>
            </View>
          ) : (
            allocations.map((allocation) => (
              <View key={allocation.symbol} style={styles.allocationItem}>
                <View style={styles.allocationInfo}>
                  <Text style={styles.allocationSymbol}>{allocation.symbol}</Text>
                  <Text style={styles.allocationName} numberOfLines={1}>{allocation.companyName}</Text>
                </View>
                <View style={styles.allocationControls}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputPrefix}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={allocation.amount > 0 ? Math.round(allocation.amount).toString() : ''}
                      onChangeText={(text) => {
                        const num = parseInt(text.replace(/,/g, '')) || 0;
                        updateAllocationAmount(allocation.symbol, num);
                      }}
                      onBlur={() => {
                        if (allocation.id && allocation.amount > 0) {
                          saveAllocation(allocation);
                        }
                      }}
                      keyboardType="numeric"
                      editable={isAllocationOpen}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={styles.percentInput}
                      value={allocation.allocation > 0 ? allocation.allocation.toFixed(1) : ''}
                      onChangeText={(text) => {
                        const num = parseFloat(text) || 0;
                        updateAllocationPercent(allocation.symbol, num);
                      }}
                      onBlur={() => {
                        if (allocation.id && allocation.amount > 0) {
                          saveAllocation(allocation);
                        }
                      }}
                      keyboardType="numeric"
                      editable={isAllocationOpen}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                    />
                    <Text style={styles.inputSuffix}>%</Text>
                  </View>
                  {isAllocationOpen && !allocation.id && allocation.amount > 0 && (
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => saveAllocation(allocation)}
                    >
                      <Ionicons name="checkmark" size={18} color={colors.textOnPrimary} />
                    </TouchableOpacity>
                  )}
                  {isAllocationOpen && (
                    <TouchableOpacity
                      onPress={() => removeStock(allocation)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </CardContent>
      </Card>

      {totalAmount > PORTFOLIO_VALUE && (
        <View style={styles.overallocationWarning}>
          <Ionicons name="warning" size={20} color={colors.error} />
          <Text style={styles.overallocationText}>
            Over-allocated by {formatCurrency(totalAmount - PORTFOLIO_VALUE)}. Reduce allocations to stay within limit.
          </Text>
        </View>
      )}
    </View>
  );

  const renderPerformanceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.performanceGrid}>
        <Card style={styles.performanceCard}>
          <CardContent style={styles.performanceCardContent}>
            <View style={styles.performanceRow}>
              <Ionicons name="cash" size={24} color={colors.primary} />
              <View>
                <Text style={styles.performanceLabel}>Total Value</Text>
                <Text style={styles.performanceValue}>
                  {formatCurrency(performance?.totalValue || PORTFOLIO_VALUE)}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card style={styles.performanceCard}>
          <CardContent style={styles.performanceCardContent}>
            <View style={styles.performanceRow}>
              <Ionicons
                name={(performance?.totalReturn || 0) >= 0 ? 'trending-up' : 'trending-down'}
                size={24}
                color={(performance?.totalReturn || 0) >= 0 ? colors.success : colors.error}
              />
              <View>
                <Text style={styles.performanceLabel}>Total Return</Text>
                <Text
                  style={[
                    styles.performanceValue,
                    (performance?.totalReturn || 0) >= 0 ? styles.gain : styles.loss,
                  ]}
                >
                  {formatCurrency(performance?.totalReturn || 0)}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card style={styles.performanceCard}>
          <CardContent style={styles.performanceCardContent}>
            <View style={styles.performanceRow}>
              <Ionicons name="analytics" size={24} color={colors.accent} />
              <View>
                <Text style={styles.performanceLabel}>Return %</Text>
                <Text
                  style={[
                    styles.performanceValue,
                    (performance?.totalReturnPercent || 0) >= 0 ? styles.gain : styles.loss,
                  ]}
                >
                  {formatPercent(performance?.totalReturnPercent || 0)}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card style={styles.performanceCard}>
          <CardContent style={styles.performanceCardContent}>
            <View style={styles.performanceRow}>
              <Ionicons name="trophy" size={24} color={colors.accent} />
              <View>
                <Text style={styles.performanceLabel}>Contest Rank</Text>
                <Text style={styles.performanceValue}>
                  {performance?.ranking ? `#${performance.ranking}` : 'N/A'}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      <Card style={styles.holdingsCard}>
        <CardHeader>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="list" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Holdings Performance</Text>
          </View>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <View style={styles.emptyAllocations}>
              <Ionicons name="bar-chart-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No holdings to display</Text>
            </View>
          ) : (
            allocations.map((allocation) => (
              <View key={allocation.symbol} style={styles.holdingItem}>
                <View style={styles.holdingInfo}>
                  <Text style={styles.holdingSymbol}>{allocation.symbol}</Text>
                  <Text style={styles.holdingName} numberOfLines={1}>{allocation.companyName}</Text>
                </View>
                <View style={styles.holdingValues}>
                  <Text style={styles.holdingInvested}>{formatCurrency(allocation.amount)}</Text>
                  <Text style={styles.holdingAllocation}>{allocation.allocation.toFixed(1)}%</Text>
                </View>
              </View>
            ))
          )}
        </CardContent>
      </Card>

      <Card style={styles.summaryCard}>
        <CardHeader>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="wallet" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Portfolio Summary</Text>
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryRowLabel}>Total Invested</Text>
            <Text style={styles.summaryRowValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(totalAmount / PORTFOLIO_VALUE) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{((totalAmount / PORTFOLIO_VALUE) * 100).toFixed(1)}% of portfolio</Text>

          <View style={[styles.summaryRow, { marginTop: spacing.md }]}>
            <Text style={styles.summaryRowLabel}>Available Cash</Text>
            <Text style={styles.summaryRowValue}>{formatCurrency(availableCash)}</Text>
          </View>

          <View style={[styles.summaryRow, { marginTop: spacing.md }]}>
            <Text style={styles.summaryRowLabel}>Number of Holdings</Text>
            <View style={styles.holdingsCount}>
              <Text style={styles.summaryRowValue}>{allocations.length}</Text>
              <Badge label={`Max: ${maxInvestments}`} variant="outline" />
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );

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
          <Text style={styles.title}>Portfolio Management</Text>
          <Text style={styles.subtitle}>Manage your virtual $1,000,000 portfolio</Text>
        </View>

        {renderContestSelector()}
        {renderSummary()}

        {isAllocationOpen && (
          <View style={styles.deadlineBanner}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <View style={styles.deadlineText}>
              <Text style={styles.deadlineTitle}>Allocation Deadline</Text>
              <Text style={styles.deadlineSubtext}>
                You have until {new Date(contest?.closeDate).toLocaleDateString()} to submit your allocations
              </Text>
            </View>
          </View>
        )}

        {renderAllocationBar()}

        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'allocate' && renderAllocateTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  browseButton: {
    marginTop: spacing.lg,
  },
  selectorCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  summaryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  summaryTitleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  summaryBadge: {
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deadlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  deadlineText: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#92400E',
  },
  deadlineSubtext: {
    fontSize: fontSize.xs,
    color: '#B45309',
    marginTop: 2,
  },
  allocationSummary: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
  allocationBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  closedText: {
    flex: 1,
  },
  closedTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#92400E',
  },
  closedSubtext: {
    fontSize: fontSize.xs,
    color: '#B45309',
    marginTop: 2,
  },
  searchCard: {
    marginBottom: spacing.md,
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
    marginBottom: spacing.md,
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
  emptySubtextSmall: {
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
    marginRight: spacing.sm,
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
    gap: spacing.sm,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
  },
  inputPrefix: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  inputSuffix: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  amountInput: {
    width: 70,
    height: 36,
    textAlign: 'right',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  percentInput: {
    width: 40,
    height: 36,
    textAlign: 'right',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    padding: spacing.xs,
  },
  overallocationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  overallocationText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.error,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  performanceCard: {
    width: '48%',
    flexGrow: 1,
  },
  performanceCardContent: {
    padding: spacing.md,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  performanceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  performanceValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  gain: {
    color: colors.success,
  },
  loss: {
    color: colors.error,
  },
  holdingsCard: {
    marginBottom: spacing.md,
  },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holdingInfo: {
    flex: 1,
  },
  holdingSymbol: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  holdingName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  holdingValues: {
    alignItems: 'flex-end',
  },
  holdingInvested: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  holdingAllocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  summaryRowValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  holdingsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
