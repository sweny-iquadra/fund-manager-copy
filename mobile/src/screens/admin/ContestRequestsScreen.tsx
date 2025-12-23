import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '@/lib/theme';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';

interface ContestRequestsScreenProps {
  onGoBack: () => void;
}

export function ContestRequestsScreen({ onGoBack }: ContestRequestsScreenProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['contest-requests'],
    queryFn: () => api.get<any[]>('/api/admin/contest-requests'),
    enabled: !!user?.isSuperAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/admin/contest-requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest-requests'] });
      queryClient.invalidateQueries({ queryKey: ['contests'] });
      Alert.alert('Success', 'Contest request approved');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to approve request');
    },
  });

  const denyMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/admin/contest-requests/${id}/deny`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest-requests'] });
      Alert.alert('Success', 'Contest request denied');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to deny request');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'denied': return 'error';
      default: return 'default';
    }
  };

  const handleApprove = (id: number) => {
    Alert.alert(
      'Approve Request',
      'Are you sure you want to approve this contest request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => approveMutation.mutate(id) },
      ]
    );
  };

  const handleDeny = (id: number) => {
    Alert.alert(
      'Deny Request',
      'Are you sure you want to deny this contest request?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deny', style: 'destructive', onPress: () => denyMutation.mutate(id) },
      ]
    );
  };

  if (!user?.isSuperAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          icon="lock-closed-outline"
          title="Access Denied"
          description="You need super admin privileges to view this page"
          actionLabel="Go Back"
          onAction={onGoBack}
        />
      </SafeAreaView>
    );
  }

  const renderRequest = ({ item }: { item: any }) => (
    <Card style={styles.requestCard}>
      <CardContent>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.contestName}>{item.contestName}</Text>
            <Text style={styles.adminName}>
              by {item.admin?.firstName} {item.admin?.lastName}
            </Text>
          </View>
          <Badge label={item.status.toUpperCase()} variant={getStatusVariant(item.status) as any} />
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="trophy-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>Prize Pool: {formatCurrency(item.prizePool)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="ticket-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>Entry Fee: {formatCurrency(item.entryFee)}</Text>
          </View>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actions}>
            <Button
              title="Approve"
              onPress={() => handleApprove(item.id)}
              loading={approveMutation.isPending}
              variant="primary"
              size="sm"
              style={styles.approveButton}
            />
            <Button
              title="Deny"
              onPress={() => handleDeny(item.id)}
              loading={denyMutation.isPending}
              variant="destructive"
              size="sm"
              style={styles.denyButton}
            />
          </View>
        )}
      </CardContent>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Contest Requests</Text>
      </View>

      {isLoading ? (
        <Loading fullScreen text="Loading requests..." />
      ) : (
        <FlatList
          data={requests || []}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No Pending Requests"
              description="All contest requests have been processed"
              style={styles.emptyState}
            />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  listContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: 0,
  },
  requestCard: {
    marginBottom: spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  requestInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  contestName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  adminName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  requestDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  approveButton: {
    flex: 1,
  },
  denyButton: {
    flex: 1,
  },
  emptyState: {
    marginTop: spacing.xl,
  },
});
