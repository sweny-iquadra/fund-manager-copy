import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import {
  Search,
  Filter,
  Users,
  DollarSign,
  Calendar,
  Plus,
  Trophy,
  ChartLine,
} from "lucide-react";

export default function Contests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: contests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/contests"],
    retry: false,
  });

  const { data: modes = [] } = useQuery<any[]>({
    queryKey: ["/api/modes"],
    retry: false,
  });

  const filteredContests = contests.filter((contest) => {
    const matchesSearch =
      contest.contestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contest.mode.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode =
      modeFilter === "all" || contest.modeId.toString() === modeFilter;
    const matchesStatus =
      statusFilter === "all" || contest.status === statusFilter;

    return matchesSearch && matchesMode && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="default">Open</Badge>;
      case "active":
        return <Badge variant="secondary">Active</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getContestTypeBadge = (type: string) => {
    switch (type) {
      case "classic":
        return <Badge variant="secondary">Classic</Badge>;
      case "eliminator":
        return <Badge variant="destructive">Eliminator</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contests</h1>
            <p className="text-gray-600">
              Join competitions and compete for real prizes
            </p>
          </div>
          <Button asChild>
            <Link href="/contests/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Contest
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search contests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Select value={modeFilter} onValueChange={setModeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    {modes.map((mode) => (
                      <SelectItem key={mode.id} value={mode.id.toString()}>
                        {mode.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contest Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Contests
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contests.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Participants
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contests.reduce(
                      (sum, contest) => sum + contest.participantCount,
                      0
                    )}
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
                    Total Prize Pool
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    $
                    {contests
                      .reduce(
                        (sum, contest) =>
                          sum + parseFloat(contest.prizePool || "0"),
                        0
                      )
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contest List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredContests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ChartLine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No contests found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || modeFilter || statusFilter
                    ? "Try adjusting your filters to find more contests."
                    : "Be the first to create a contest!"}
                </p>
                <Button asChild>
                  <Link href="/contests/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Contest
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredContests.map((contest) => (
                <Card
                  key={contest.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {contest.contestName}
                          </h3>
                          {getStatusBadge(contest.status)}
                          {getContestTypeBadge(contest.contestType)}
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {contest.participantCount} participants
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />$
                            {contest.prizePool} prize pool
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Ends{" "}
                            {new Date(contest.endDate).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 mb-4">
                          <Badge variant="secondary">{contest.mode.name}</Badge>
                          <Badge variant="outline">
                            {contest.category.name}
                          </Badge>
                          <Badge variant="outline">
                            Entry: ${contest.entryFee}
                          </Badge>
                        </div>

                        <p className="text-gray-700 text-sm">
                          Created by{" "}
                          {contest.admin.firstName || contest.admin.email}
                        </p>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/contests/${contest.id}`}>
                            View Details
                          </Link>
                        </Button>
                        {contest.status === "open" && (
                          <Button asChild size="sm">
                            <Link href={`/contests/${contest.id}`}>
                              Join Contest
                            </Link>
                          </Button>
                        )}
                        {contest.status === "active" && (
                          <Button asChild variant="secondary" size="sm">
                            <Link href={`/leaderboard?contest=${contest.id}`}>
                              View Leaderboard
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
