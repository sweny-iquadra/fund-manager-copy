import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  DollarSign,
  Clock,
  PieChart,
  Target,
  AlertCircle,
} from "lucide-react";
import AllocationForm from "@/components/portfolio/allocation-form";
import PortfolioPerformance from "@/components/portfolio/portfolio-performance";

const SELECTED_CONTEST_KEY = "portfolio_selected_contest";

export default function Portfolio() {
  const [selectedContest, setSelectedContest] = useState<string>("");

  const { data: participations, isLoading: participationsLoading } = useQuery<
    any[]
  >({
    queryKey: ["/api/user/participations"],
  });

  const { data: contests } = useQuery<any[]>({
    queryKey: ["/api/contests"],
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  // Calculate active participations
  const activeParticipations = (participations || []).filter((p: any) => {
    const contest = (contests || []).find((c: any) => c.id === p.contestId);
    return contest && new Date(contest.endDate) > new Date();
  });

  // Load saved contest selection from localStorage when data is available
  useEffect(() => {
    if (activeParticipations.length > 0 && !selectedContest) {
      const savedContest = localStorage.getItem(SELECTED_CONTEST_KEY);

      // Check if saved contest is still valid (exists in active participations)
      const isValidSavedContest =
        savedContest &&
        activeParticipations.some((p: any) => p.id.toString() === savedContest);

      if (isValidSavedContest) {
        setSelectedContest(savedContest);
      } else {
        // Fall back to first active participation and save it
        const defaultContest = activeParticipations[0]?.id.toString();
        if (defaultContest) {
          setSelectedContest(defaultContest);
          localStorage.setItem(SELECTED_CONTEST_KEY, defaultContest);
        }
      }
    }
  }, [activeParticipations, selectedContest]);

  if (participationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Save contest selection to localStorage when it changes
  const handleContestChange = (contestId: string) => {
    setSelectedContest(contestId);
    localStorage.setItem(SELECTED_CONTEST_KEY, contestId);
  };

  const selectedParticipation = selectedContest
    ? activeParticipations.find((p: any) => p.id.toString() === selectedContest)
    : activeParticipations[0];

  const selectedContestData = selectedParticipation
    ? (contests || []).find(
        (c: any) => c.id === selectedParticipation.contestId
      )
    : null;

  const category = selectedContestData
    ? (categories || []).find(
        (c: any) => c.id === selectedContestData.categoryId
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Portfolio Management
          </h1>
          <p className="text-gray-600">
            Manage your virtual $1,000,000 portfolio allocations
          </p>
        </div>

        {activeParticipations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No active contests</p>
              <p className="text-sm text-gray-400 mb-4">
                Join a contest to start managing your portfolio
              </p>
              <Button onClick={() => (window.location.href = "/contests")}>
                Browse Contests
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Contest Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Select Contest
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedContest}
                  onValueChange={handleContestChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a contest to manage" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeParticipations.map((participation: any) => {
                      const contest = (contests || []).find(
                        (c: any) => c.id === participation.contestId
                      );
                      const cat = (categories || []).find(
                        (c: any) => c.id === contest?.categoryId
                      );
                      return (
                        <SelectItem
                          key={participation.id}
                          value={participation.id.toString()}
                        >
                          {contest?.contestName} - {cat?.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedParticipation && selectedContestData && (
              <>
                {/* Contest Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <PieChart className="h-5 w-5 mr-2" />
                        {selectedContestData.contestName}
                      </div>
                      <Badge variant="outline">{category?.name}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          $1,000,000
                        </div>
                        <div className="text-sm text-gray-600">
                          Portfolio Value
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          ${selectedContestData.prizePool}
                        </div>
                        <div className="text-sm text-gray-600">Prize Pool</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-accent">
                          {new Date(selectedContestData.endDate) > new Date()
                            ? Math.ceil(
                                (new Date(
                                  selectedContestData.endDate
                                ).getTime() -
                                  new Date().getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            : 0}
                        </div>
                        <div className="text-sm text-gray-600">Days Left</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {new Date(selectedContestData.closeDate) > new Date()
                            ? "Open"
                            : "Closed"}
                        </div>
                        <div className="text-sm text-gray-600">Allocation</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Allocation Deadline Warning */}
                {new Date(selectedContestData.closeDate) > new Date() && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                        <div>
                          <p className="font-medium text-amber-800">
                            Allocation Deadline
                          </p>
                          <p className="text-sm text-amber-700">
                            You have until{" "}
                            {new Date(
                              selectedContestData.closeDate
                            ).toLocaleDateString()}{" "}
                            to submit your allocations
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Portfolio Management */}
                <Tabs defaultValue="allocate" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="allocate">
                      Allocate Portfolio
                    </TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>

                  <TabsContent value="allocate" className="mt-6">
                    <AllocationForm
                      contestId={selectedContestData.id}
                      categoryId={selectedContestData.categoryId}
                      isAllocationOpen={
                        new Date(selectedContestData.closeDate) > new Date()
                      }
                    />
                  </TabsContent>

                  <TabsContent value="performance" className="mt-6">
                    <PortfolioPerformance
                      contestId={selectedContestData.id}
                      participantId={selectedParticipation.id}
                      portfolioValue={parseFloat(
                        selectedParticipation.portfolioValue
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
