import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, fontWeight, borderRadius, gradients, shadows } from '@/lib/theme';
import { userApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';

interface AccountScreenProps {
  onLogout: () => void;
}

export function AccountScreen({ onLogout }: AccountScreenProps) {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['user', 'stats'],
    queryFn: () => userApi.getStats(),
  });

  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['user', 'transactions'],
    queryFn: () => userApi.getTransactions(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchTransactions()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          onLogout();
        },
      },
    ]);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'entry_fee':
        return 'ticket-outline';
      case 'prize_payout':
        return 'trophy-outline';
      case 'deposit':
        return 'arrow-down-circle-outline';
      case 'withdrawal':
        return 'arrow-up-circle-outline';
      default:
        return 'cash-outline';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'prize_payout':
      case 'deposit':
        return colors.success;
      case 'entry_fee':
      case 'withdrawal':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

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
          <View style={styles.profileSection}>
            <Avatar
              source={user?.profileImageUrl}
              name={`${user?.firstName || ''} ${user?.lastName || ''}`}
              size={80}
            />
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.badges}>
              {user?.isSuperAdmin && <Badge label="SUPER ADMIN" variant="warning" />}
              {user?.isAdmin && !user?.isSuperAdmin && <Badge label="ADMIN" variant="primary" />}
            </View>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Account Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(user?.balance || '0')}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statsGrid}>
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

          <Card style={styles.transactionsCard}>
            <CardHeader>
              <Text style={styles.cardTitle}>Recent Transactions</Text>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <Loading size="small" text="Loading transactions..." />
              ) : transactions && transactions.length > 0 ? (
                transactions.slice(0, 10).map((transaction: any) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      <Ionicons
                        name={getTransactionIcon(transaction.type) as any}
                        size={20}
                        color={getTransactionColor(transaction.type)}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription} numberOfLines={1}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: getTransactionColor(transaction.type) },
                      ]}
                    >
                      {parseFloat(transaction.amount) >= 0 ? '+' : ''}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTransactions}>
                  <Ionicons name="receipt-outline" size={48} color={colors.gray[300]} />
                  <Text style={styles.emptyText}>No transactions yet</Text>
                </View>
              )}
            </CardContent>
          </Card>

          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="person-outline" size={22} color={colors.text} />
              <Text style={styles.menuText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              <Text style={styles.menuText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.text} />
              <Text style={styles.menuText}>Security</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={22} color={colors.text} />
              <Text style={styles.menuText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="document-text-outline" size={22} color={colors.text} />
              <Text style={styles.menuText}>Terms & Privacy</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </Card>

          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="destructive"
            fullWidth
            size="lg"
            style={styles.logoutButton}
          />

          <Text style={styles.version}>Version 1.0.0</Text>
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
    paddingBottom: spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
    marginTop: spacing.md,
  },
  userEmail: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
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
  content: {
    padding: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionsCard: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  transactionDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  emptyTransactions: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  menuCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    marginLeft: spacing.md,
  },
  logoutButton: {
    marginBottom: spacing.lg,
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
});
