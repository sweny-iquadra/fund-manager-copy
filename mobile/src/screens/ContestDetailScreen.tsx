import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  gradients,
} from "@/lib/theme";
import { contestsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";

interface ContestDetailScreenProps {
  contestId: number;
  onNavigateToPortfolio: (contestId: number) => void;
  onGoBack: () => void;
}

type TabType = "overview" | "leaderboard" | "rules";

export function ContestDetailScreen({
  contestId,
  onNavigateToPortfolio,
  onGoBack,
}: ContestDetailScreenProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const {
    data: contest,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["contest", contestId],
    queryFn: () => contestsApi.getById(contestId),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard", contestId],
    queryFn: () => contestsApi.getLeaderboard(contestId),
    enabled: !!contest,
  });

  const joinMutation = useMutation({
    mutationFn: () => contestsApi.join(contestId),
    onSuccess: () => {
      queryClient.setQueryData(["contest", contestId], (existing: any) => {
        if (!existing) return existing;
        return {
          ...existing,
          userParticipating: true,
          participantCount: (existing.participantCount || 0) + 1,
        };
      });
      queryClient.invalidateQueries({ queryKey: ["contest", contestId] });
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      Alert.alert("Success", "You have joined the contest!", [
        {
          text: "Manage Portfolio",
          onPress: () => onNavigateToPortfolio(contestId),
        },
      ]);
      onNavigateToPortfolio(contestId);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to join contest");
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => contestsApi.leave(contestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contest", contestId] });
      queryClient.invalidateQueries({ queryKey: ["contests"] });
      Alert.alert("Success", "You have left the contest");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to leave contest");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "open":
        return "success";
      case "active":
        return "primary";
      case "closed":
        return "warning";
      case "completed":
        return "default";
      default:
        return "default";
    }
  };

  const getDaysLeft = () => {
    if (!contest) return 0;
    const now = new Date();
    const endDate = new Date(contest.endDate);
    if (endDate < now) return 0;
    return Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getRegistrationDaysLeft = () => {
    if (!contest) return 0;
    const now = new Date();
    const closeDate = new Date(contest.closeDate);
    if (closeDate < now) return 0;
    return Math.ceil(
      (closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
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
  const isActive =
    new Date(contest.startDate) <= new Date() &&
    new Date(contest.endDate) >= new Date();
  const isUpcoming = new Date(contest.startDate) > new Date();
  const isFinished = new Date(contest.endDate) < new Date();
  const canJoin =
    !isParticipating && !isFinished && new Date(contest.closeDate) > new Date();
  const canLeave = contest.status === "open" && isParticipating;
  const registrationDaysLeft = getRegistrationDaysLeft();
  const daysLeft = getDaysLeft();

  const tabs: { key: TabType; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "leaderboard", label: "Leaderboard" },
    { key: "rules", label: "Rules" },
  ];

  const prizeDistribution = {
    first: Math.round(parseFloat(contest.prizePool) * 0.5),
    second: Math.round(parseFloat(contest.prizePool) * 0.3),
    third: Math.round(parseFloat(contest.prizePool) * 0.2),
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.scheduleCard}>
        <CardHeader>
          <View style={styles.cardHeaderRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Contest Schedule</Text>
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Registration Opens</Text>
            <Text style={styles.scheduleValue}>
              {formatDate(contest.openDate)}
            </Text>
          </View>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Registration Closes</Text>
            <Text style={styles.scheduleValue}>
              {formatDate(contest.closeDate)}
            </Text>
          </View>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Contest Starts</Text>
            <Text style={styles.scheduleValue}>
              {formatDate(contest.startDate)}
            </Text>
          </View>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Contest Ends</Text>
            <Text style={styles.scheduleValue}>
              {formatDate(contest.endDate)}
            </Text>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.prizeCard}>
        <CardHeader>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="cash-outline" size={20} color={colors.success} />
            <Text style={styles.cardTitle}>Prize Distribution</Text>
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.prizeRow}>
            <View style={styles.prizeRank}>
              <Ionicons name="medal" size={20} color="#FFD700" />
              <Text style={styles.prizeLabel}>1st Place</Text>
            </View>
            <Text style={[styles.prizeValue, { color: "#FFD700" }]}>
              {formatCurrency(prizeDistribution.first)}
            </Text>
          </View>
          <View style={styles.prizeRow}>
            <View style={styles.prizeRank}>
              <Ionicons name="medal" size={20} color="#C0C0C0" />
              <Text style={styles.prizeLabel}>2nd Place</Text>
            </View>
            <Text style={[styles.prizeValue, { color: "#C0C0C0" }]}>
              {formatCurrency(prizeDistribution.second)}
            </Text>
          </View>
          <View style={styles.prizeRow}>
            <View style={styles.prizeRank}>
              <Ionicons name="medal" size={20} color="#CD7F32" />
              <Text style={styles.prizeLabel}>3rd Place</Text>
            </View>
            <Text style={[styles.prizeValue, { color: "#CD7F32" }]}>
              {formatCurrency(prizeDistribution.third)}
            </Text>
          </View>
          <View style={styles.prizeTotalRow}>
            <Text style={styles.prizeTotalLabel}>Total Prize Pool</Text>
            <Text style={styles.prizeTotalValue}>
              {formatCurrency(contest.prizePool)}
            </Text>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.infoCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>Contest Details</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Ionicons
              name="folder-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{contest.category?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="layers-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.infoLabel}>Investment Mode</Text>
            <Text style={styles.infoValue}>{contest.mode?.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name="person-outline"
              size={18}
              color={colors.textSecondary}
            />
            <Text style={styles.infoLabel}>Created By</Text>
            <Text style={styles.infoValue}>
              {contest.admin?.firstName || contest.admin?.email}
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderLeaderboardTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.leaderboardCard}>
        <CardHeader>
          <View style={styles.cardHeaderRow}>
            <Ionicons
              name="trending-up-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Live Rankings</Text>
          </View>
        </CardHeader>
        {leaderboard && leaderboard.length > 0 ? (
          leaderboard.map((entry: any, index: number) => (
            <LeaderboardRow
              key={entry.id || index}
              entry={entry}
              isCurrentUser={entry.userId === user?.id}
            />
          ))
        ) : (
          <CardContent>
            <View style={styles.emptyLeaderboard}>
              <Ionicons
                name="trending-up-outline"
                size={48}
                color={colors.gray[300]}
              />
              <Text style={styles.emptyTitle}>No rankings available yet</Text>
              <Text style={styles.emptySubtext}>
                Rankings will appear once the contest starts and participants
                make their allocations
              </Text>
            </View>
          </CardContent>
        )}
      </Card>
    </View>
  );

  const renderRulesTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.rulesCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>Portfolio Allocation</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.ruleItem}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.ruleText}>
              Each participant receives a virtual portfolio of $1,000,000
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.ruleText}>
              You can allocate across up to{" "}
              {contest.category?.maxInvestments || 10} investments
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.ruleText}>
              Allocations must be submitted before the registration deadline
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.ruleText}>
              No changes allowed once the contest starts
            </Text>
          </View>
        </CardContent>
      </Card>

      <Card style={styles.rulesCard}>
        <CardHeader>
          <Text style={styles.cardTitle}>Scoring</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.ruleItem}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.success}
            />
            <Text style={styles.ruleText}>
              Rankings based on total portfolio return percentage
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.success}
            />
            <Text style={styles.ruleText}>
              Returns calculated from contest start to end date
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.success}
            />
            <Text style={styles.ruleText}>
              Ties broken by allocation submission time
            </Text>
          </View>
        </CardContent>
      </Card>

      {contest.category?.rules && (
        <Card style={styles.rulesCard}>
          <CardHeader>
            <Text style={styles.cardTitle}>Investment Rules</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.ruleItem}>
              <Ionicons
                name="information-circle"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.ruleText}>
                Category: {contest.category.name}
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons
                name="information-circle"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.ruleText}>
                Investment Mode: {contest.mode?.name}
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons
                name="information-circle"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.ruleText}>{contest.category.rules}</Text>
            </View>
          </CardContent>
        </Card>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={gradients.financial} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.textOnPrimary}
            />
          </TouchableOpacity>

          <View style={styles.headerTop}>
            <Badge
              label={contest.status.toUpperCase()}
              variant={getStatusVariant(contest.status) as any}
            />
            <Badge
              label={
                contest.contestType === "classic" ? "Classic" : "Eliminator"
              }
              variant="outline"
            />
          </View>

          <Text style={styles.contestName}>{contest.contestName}</Text>
          <Text style={styles.modeName}>
            {contest.mode?.name} • {contest.category?.name}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="cash" size={24} color={colors.accent} />
              <Text style={styles.statValue}>
                {formatCurrency(contest.prizePool)}
              </Text>
              <Text style={styles.statLabel}>Prize Pool</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="ticket" size={24} color={colors.textOnPrimary} />
              <Text style={styles.statValue}>
                {formatCurrency(contest.entryFee)}
              </Text>
              <Text style={styles.statLabel}>Entry Fee</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color={colors.textOnPrimary} />
              <Text style={styles.statValue}>{contest.participantCount}</Text>
              <Text style={styles.statLabel}>Participants</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color={colors.textOnPrimary} />
              <Text style={styles.statValue}>
                {isFinished ? "Finished" : daysLeft > 0 ? daysLeft : "Today"}
              </Text>
              <Text style={styles.statLabel}>
                {isFinished ? "Contest Over" : "Days Left"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {canJoin && registrationDaysLeft <= 3 && (
          <View style={styles.warningBanner}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <View style={styles.warningText}>
              <Text style={styles.warningTitle}>Registration Closing Soon</Text>
              <Text style={styles.warningSubtext}>
                Registration closes {formatDate(contest.closeDate)} -{" "}
                {registrationDaysLeft === 0
                  ? "Today!"
                  : `${registrationDaysLeft} days left`}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.actions}>
            {isParticipating ? (
              <>
                <Button
                  title="Manage Portfolio"
                  onPress={() => onNavigateToPortfolio(contestId)}
                  fullWidth
                  size="lg"
                  icon={
                    <Ionicons
                      name="pie-chart"
                      size={20}
                      color={colors.textOnPrimary}
                    />
                  }
                />
                <Button
                  title="View Leaderboard"
                  onPress={() => setActiveTab("leaderboard")}
                  variant="outline"
                  fullWidth
                  icon={
                    <Ionicons
                      name="trending-up"
                      size={20}
                      color={colors.primary}
                    />
                  }
                />
              </>
            ) : canJoin ? (
              <Button
                title={`Join Contest - ${formatCurrency(contest.entryFee)}`}
                onPress={() => joinMutation.mutate()}
                loading={joinMutation.isPending}
                fullWidth
                size="lg"
                icon={
                  <Ionicons
                    name="trophy"
                    size={20}
                    color={colors.textOnPrimary}
                  />
                }
              />
            ) : (
              <Button
                title={isFinished ? "Contest Finished" : "Registration Closed"}
                disabled
                fullWidth
                onPress={() => {}}
              />
            )}
            {canLeave && (
              <Button
                title="Leave Contest"
                onPress={() => {
                  Alert.alert(
                    "Leave Contest",
                    "Are you sure you want to leave this contest?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Leave",
                        style: "destructive",
                        onPress: () => leaveMutation.mutate(),
                      },
                    ]
                  );
                }}
                variant="outline"
                fullWidth
                style={styles.leaveButton}
              />
            )}
          </View>

          <View style={styles.tabsContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "overview" && renderOverviewTab()}
          {activeTab === "leaderboard" && renderLeaderboardTab()}
          {activeTab === "rules" && renderRulesTab()}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  headerTop: {
    flexDirection: "row",
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
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: "#92400E",
  },
  warningSubtext: {
    fontSize: fontSize.xs,
    color: "#B45309",
    marginTop: 2,
  },
  content: {
    padding: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  leaveButton: {
    borderColor: colors.error,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
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
    gap: spacing.lg,
  },
  scheduleCard: {
    marginBottom: 0,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scheduleLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  scheduleValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  prizeCard: {
    marginBottom: 0,
  },
  prizeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prizeRank: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  prizeLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  prizeValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  prizeTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  prizeTotalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  prizeTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  infoCard: {
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
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
  leaderboardCard: {
    overflow: "hidden",
  },
  emptyLeaderboard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  rulesCard: {
    marginBottom: 0,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ruleText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
});
