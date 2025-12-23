import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Trophy,
  DollarSign,
  TrendingUp,
  Target,
  Users,
  Calendar,
  ChartLine,
  Plus,
} from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    retry: false,
    enabled: !!user,
  });

  const { data: participations = [], isLoading: participationsLoading } =
    useQuery({
      queryKey: ["/api/user/participations"],
      retry: false,
      enabled: !!user,
    });

  const { data: contests = [], isLoading: contestsLoading } = useQuery({
    queryKey: ["/api/contests"],
    retry: false,
    enabled: !!user,
  });

  const { data: winnings = [], isLoading: winningsLoading } = useQuery({
    queryKey: ["/api/user/winnings"],
    retry: false,
    enabled: !!user,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const featuredContests = contests.slice(0, 3);
  const recentWinnings = winnings.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName || user.email}!
          </h1>
          <p className="text-gray-600">
            Ready to compete in your next fantasy finance challenge?
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Contests
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalContests || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Winnings
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    $
                    {stats?.totalWinnings
                      ? Number(stats.totalWinnings).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.winRate ? Number(stats.winRate).toFixed(1) : "0.0"}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Contests
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.activeContests || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Contests */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <ChartLine className="h-5 w-5 mr-2" />
                    Featured Contests
                  </CardTitle>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/contests">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contestsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : featuredContests.length === 0 ? (
                  <div className="text-center py-8">
                    <ChartLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No contests available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {featuredContests.map((contest) => (
                      <div
                        key={contest.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {contest.contestName}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {contest.participantCount} participants
                              </span>
                              <span className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />$
                                {contest.prizePool}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(contest.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">
                                {contest.mode.name}
                              </Badge>
                              <Badge variant="outline">
                                {contest.category.name}
                              </Badge>
                              <Badge
                                variant={
                                  contest.status === "open"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {contest.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/contests/${contest.id}`}>View</Link>
                            </Button>
                            {contest.status === "open" && (
                              <Button asChild size="sm">
                                <Link href={`/contests/${contest.id}`}>
                                  Join
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/contests">
                    <Plus className="h-4 w-4 mr-2" />
                    Join Contest
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contests/create">
                    <Trophy className="h-4 w-4 mr-2" />
                    Create Contest
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Winnings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Recent Winnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {winningsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : recentWinnings.length === 0 ? (
                  <div className="text-center py-4">
                    <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No winnings yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentWinnings.map((winning) => (
                      <div
                        key={winning.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            ${winning.prizeAmount}
                          </p>
                          <p className="text-sm text-gray-600">
                            Rank #{winning.finalRanking}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {new Date(winning.awardedDate).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
