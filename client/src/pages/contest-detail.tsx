import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Trophy,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  Settings,
} from "lucide-react";
import LeaderboardTable from "@/components/leaderboard/leaderboard-table";
import ContestAdminManagement from "@/components/contest-admin-management";

export default function ContestDetail() {
  const params = useParams();
  const contestId = params.id;
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: contest, isLoading: contestLoading } = useQuery({
    queryKey: ["/api/contests", contestId],
    retry: false,
    enabled: !!contestId,
  });

  const { data: participations = [] } = useQuery({
    queryKey: ["/api/user/participations"],
    retry: false,
    enabled: !!user,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/contests", contestId, "leaderboard"],
    retry: false,
    enabled: !!contestId,
  });

  // Check if current user is contest admin
  const { data: isContestAdmin = false } = useQuery({
    queryKey: ["/api/contests", contestId, "is-admin"],
    retry: false,
    enabled: !!contestId && !!user,
  });

  const joinContestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/contests/${contestId}/join`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contests", contestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/participations"] });
      toast({
        title: "Success",
        description: "You have successfully joined the contest!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to join contest. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || contestLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !contest) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Contest not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isParticipating = participations.some(
    (p) => p.contestId === contest.id
  );
  const isActive =
    new Date(contest.startDate) <= new Date() &&
    new Date(contest.endDate) >= new Date();
  const isUpcoming = new Date(contest.startDate) > new Date();
  const isFinished = new Date(contest.endDate) < new Date();
  const canJoin =
    !isParticipating && !isFinished && new Date(contest.closeDate) > new Date();

  // Check admin privileges
  const isLegacyAdmin = contest.adminId === user?.id;
  const isOwner = isLegacyAdmin || isContestAdmin; // For now, treat all as potential owners
  const showAdminTab = isLegacyAdmin || isContestAdmin;

  const getStatusColor = () => {
    if (isFinished) return "bg-gray-100 text-gray-800";
    if (isActive) return "bg-green-100 text-green-800";
    if (isUpcoming) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusText = () => {
    if (isFinished) return "Finished";
    if (isActive) return "Active";
    if (isUpcoming) return "Upcoming";
    return "Unknown";
  };

  const getModeColor = () => {
    if (contest.contestType === "eliminator") return "bg-red-100 text-red-800";
    return "bg-blue-100 text-blue-800";
  };

  const daysLeft = Math.ceil(
    (new Date(contest.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const registrationDaysLeft = Math.ceil(
    (new Date(contest.closeDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/contests")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {contest.contestName}
              </h1>
              <Badge className={getStatusColor()}>{getStatusText()}</Badge>
              <Badge className={getModeColor()}>
                {contest.contestType === "eliminator"
                  ? "Eliminator"
                  : "Classic"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{contest.mode.name}</span>
              <span>•</span>
              <span>{contest.category.name}</span>
              <span>•</span>
              <span>
                Created by {contest.admin.firstName || contest.admin.email}
              </span>
            </div>
          </div>
        </div>

        {/* Contest Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                ${contest.prizePool}
              </div>
              <div className="text-sm text-gray-600">Prize Pool</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                ${contest.entryFee}
              </div>
              <div className="text-sm text-gray-600">Entry Fee</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {contest.participantCount}
              </div>
              <div className="text-sm text-gray-600">Participants</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {isFinished ? "Finished" : daysLeft > 0 ? daysLeft : "Today"}
              </div>
              <div className="text-sm text-gray-600">
                {isFinished ? "Contest Over" : "Days Left"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Alert */}
        {canJoin && registrationDaysLeft <= 3 && (
          <Card className="border-amber-200 bg-amber-50 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                <div>
                  <p className="font-medium text-amber-800">
                    Registration Closing Soon
                  </p>
                  <p className="text-sm text-amber-700">
                    Registration closes{" "}
                    {new Date(contest.closeDate).toLocaleDateString()} -
                    {registrationDaysLeft === 0
                      ? " Today!"
                      : ` ${registrationDaysLeft} days left`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {isParticipating ? (
            <>
              <Button asChild>
                <a href={`/contests/${contest.id}/portfolio`}>
                  <Target className="h-4 w-4 mr-2" />
                  Manage Portfolio
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`/leaderboard?contest=${contest.id}`}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Leaderboard
                </a>
              </Button>
            </>
          ) : canJoin ? (
            <Button
              onClick={() => joinContestMutation.mutate()}
              disabled={joinContestMutation.isPending}
              size="lg"
            >
              {joinContestMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Join Contest
            </Button>
          ) : (
            <Button disabled>
              {isFinished ? "Contest Finished" : "Registration Closed"}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList
            className={`grid w-full ${
              showAdminTab ? "grid-cols-4" : "grid-cols-3"
            }`}
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            {showAdminTab && (
              <TabsTrigger value="admin">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Contest Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Registration Opens</span>
                    <span className="font-medium">
                      {new Date(contest.openDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Registration Closes</span>
                    <span className="font-medium">
                      {new Date(contest.closeDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Contest Starts</span>
                    <span className="font-medium">
                      {new Date(contest.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Contest Ends</span>
                    <span className="font-medium">
                      {new Date(contest.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Prize Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">1st Place</span>
                    <span className="font-medium text-yellow-600">
                      $
                      {Math.round(
                        Number(contest.prizePool) * 0.5
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">2nd Place</span>
                    <span className="font-medium text-gray-600">
                      $
                      {Math.round(
                        Number(contest.prizePool) * 0.3
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">3rd Place</span>
                    <span className="font-medium text-orange-600">
                      $
                      {Math.round(
                        Number(contest.prizePool) * 0.2
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">
                        Total Prize Pool
                      </span>
                      <span className="font-bold text-green-600">
                        ${contest.prizePool}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Live Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard && leaderboard.length > 0 ? (
                  <LeaderboardTable leaderboard={leaderboard} />
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      No rankings available yet
                    </p>
                    <p className="text-sm text-gray-400">
                      Rankings will appear once the contest starts and
                      participants make their allocations
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contest Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Portfolio Allocation</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>
                      Each participant receives a virtual portfolio of
                      $1,000,000
                    </li>
                    <li>
                      You can allocate across up to{" "}
                      {contest.category.maxInvestments} investments
                    </li>
                    <li>
                      Allocations must be submitted before the registration
                      deadline
                    </li>
                    <li>No changes allowed once the contest starts</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Scoring</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Rankings based on total portfolio return percentage</li>
                    <li>Returns calculated from contest start to end date</li>
                    <li>Ties broken by allocation submission time</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Investment Rules</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Category: {contest.category.name}</li>
                    <li>Investment Mode: {contest.mode.name}</li>
                    <li>{contest.category.rules}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {showAdminTab && (
            <TabsContent value="admin" className="mt-6">
              <ContestAdminManagement
                contestId={contestId!}
                contestName={contest.contestName}
                isOwner={isOwner}
                currentUserId={user.id}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
