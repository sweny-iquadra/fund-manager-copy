import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Medal, TrendingUp, Users, DollarSign } from "lucide-react";
import LeaderboardTable from "@/components/leaderboard/leaderboard-table";

export default function Leaderboard() {
  const [location] = useLocation();
  const [selectedContest, setSelectedContest] = useState<string>("");

  // Parse contest ID from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contestId = urlParams.get("contest");
    if (contestId) {
      setSelectedContest(contestId);
    }
  }, [location]);

  const { data: contests, isLoading: contestsLoading } = useQuery({
    queryKey: ["/api/contests"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: modes } = useQuery({
    queryKey: ["/api/modes"],
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/leaderboard", selectedContest],
    queryFn: async () => {
      if (!selectedContest) return null;
      const response = await fetch(
        `/api/leaderboard?contestId=${selectedContest}`
      );
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      return response.json();
    },
    enabled: !!selectedContest,
  });

  // Move all hooks before any conditional returns
  const activeContests = useMemo(() => {
    return (
      (contests as any[])?.filter(
        (contest: any) => contest.status === "active"
      ) || []
    );
  }, [contests]);

  // Auto-select first active contest if no contest is selected
  useEffect(() => {
    if (!selectedContest && activeContests.length > 0) {
      setSelectedContest(activeContests[0].id.toString());
    }
  }, [activeContests.length, selectedContest]);

  if (contestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedContestData = selectedContest
    ? (contests as any[])?.find((c: any) => c.id.toString() === selectedContest)
    : null;

  const category = selectedContestData
    ? (categories as any[])?.find(
        (c: any) => c.id === selectedContestData.categoryId
      )
    : null;

  const mode = selectedContestData
    ? (modes as any[])?.find((m: any) => m.id === selectedContestData.modeId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Leaderboards
          </h1>
          <p className="text-gray-600">
            Track your performance against other traders
          </p>
        </div>

        {activeContests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No active contests</p>
              <p className="text-sm text-gray-400">
                Leaderboards will be available when contests are active
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Contest Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Select Contest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedContest}
                  onValueChange={setSelectedContest}
                  defaultValue={activeContests[0]?.id.toString()}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a contest to view leaderboard" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeContests.map((contest: any) => {
                      const cat = (categories as any[])?.find(
                        (c: any) => c.id === contest.categoryId
                      );
                      const mod = (modes as any[])?.find(
                        (m: any) => m.id === contest.modeId
                      );
                      return (
                        <SelectItem
                          key={contest.id}
                          value={contest.id.toString()}
                        >
                          {contest.contestName} - {cat?.name} ({mod?.name})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedContestData && (
              <>
                {/* Contest Info */}
                <Card className="bg-gradient-to-r from-primary to-blue-700 text-white">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {selectedContestData.contestName}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{category?.name}</Badge>
                          <Badge
                            variant="outline"
                            className="text-white border-white"
                          >
                            {mode?.name}
                          </Badge>
                        </div>
                        <p className="text-blue-100">
                          Contest ends{" "}
                          {new Date(
                            selectedContestData.endDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-accent">
                          ${selectedContestData.prizePool}
                        </div>
                        <div className="text-sm text-blue-100">Prize Pool</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {Math.ceil(
                            (new Date(selectedContestData.endDate).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}
                        </div>
                        <div className="text-xs text-blue-100">Days Left</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          ${selectedContestData.entryFee}
                        </div>
                        <div className="text-xs text-blue-100">Entry Fee</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {leaderboard?.length || 0}
                        </div>
                        <div className="text-xs text-blue-100">
                          Participants
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Leaderboard */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Medal className="h-5 w-5 mr-2" />
                      Live Rankings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {leaderboardLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-gray-500 mt-4">
                          Loading leaderboard...
                        </p>
                      </div>
                    ) : leaderboard && leaderboard.length > 0 ? (
                      <LeaderboardTable leaderboard={leaderboard} />
                    ) : (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">
                          No leaderboard data available
                        </p>
                        <p className="text-sm text-gray-400">
                          Rankings will appear once the contest starts and
                          participants make their allocations
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Prize Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Prize Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <div className="text-lg font-bold text-yellow-800">
                          1st Place
                        </div>
                        <div className="text-sm text-yellow-600">
                          $
                          {Math.round(
                            Number(selectedContestData.prizePool) * 0.5
                          )}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Medal className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                        <div className="text-lg font-bold text-gray-800">
                          2nd Place
                        </div>
                        <div className="text-sm text-gray-600">
                          $
                          {Math.round(
                            Number(selectedContestData.prizePool) * 0.3
                          )}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <Medal className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-lg font-bold text-orange-800">
                          3rd Place
                        </div>
                        <div className="text-sm text-orange-600">
                          $
                          {Math.round(
                            Number(selectedContestData.prizePool) * 0.2
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
