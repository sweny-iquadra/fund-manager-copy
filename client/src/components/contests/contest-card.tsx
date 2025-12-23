import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Clock, DollarSign, Zap, Target } from "lucide-react";
import type { Contest, Category, Mode } from "@shared/schema";

interface ContestCardProps {
  contest: Contest;
  category?: Category;
  mode?: Mode;
  isParticipating: boolean;
  onJoin: () => void;
  isJoining: boolean;
}

export default function ContestCard({ 
  contest, 
  category, 
  mode, 
  isParticipating, 
  onJoin, 
  isJoining 
}: ContestCardProps) {
  const isActive = new Date(contest.startDate) <= new Date() && new Date(contest.endDate) >= new Date();
  const isUpcoming = new Date(contest.startDate) > new Date();
  const isFinished = new Date(contest.endDate) < new Date();
  const canJoin = !isParticipating && !isFinished && new Date(contest.closeDate) > new Date();

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

  const getModeIcon = () => {
    if (mode?.name === "Eliminator") return <Zap className="h-4 w-4" />;
    return <Trophy className="h-4 w-4" />;
  };

  const getModeColor = () => {
    if (mode?.name === "Eliminator") return "bg-red-100 text-red-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge className={getStatusColor()}>{getStatusText()}</Badge>
          <Badge className={getModeColor()}>
            {getModeIcon()}
            <span className="ml-1">{mode?.name}</span>
          </Badge>
        </div>
        <CardTitle className="text-lg">{contest.contestName}</CardTitle>
        <Badge variant="outline">{category?.name}</Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-4 w-4 text-secondary mr-1" />
              <span className="text-lg font-bold text-secondary">
                ${contest.prizePool}
              </span>
            </div>
            <div className="text-xs text-gray-600">Prize Pool</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-gray-600 mr-1" />
              <span className="text-lg font-bold text-gray-900">
                ${contest.entryFee}
              </span>
            </div>
            <div className="text-xs text-gray-600">Entry Fee</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>
              {isUpcoming ? 
                `Starts ${new Date(contest.startDate).toLocaleDateString()}` :
                `Ends ${new Date(contest.endDate).toLocaleDateString()}`
              }
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            <span>
              {contest.maxParticipants ? 
                `Max ${contest.maxParticipants} participants` :
                "Unlimited participants"
              }
            </span>
          </div>
        </div>

        <div className="pt-4">
          {isParticipating ? (
            <Button className="w-full" disabled>
              <Trophy className="h-4 w-4 mr-2" />
              Joined
            </Button>
          ) : canJoin ? (
            <Button 
              className="w-full" 
              onClick={onJoin}
              disabled={isJoining}
            >
              {isJoining ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Target className="h-4 w-4 mr-2" />
              )}
              Join Contest
            </Button>
          ) : (
            <Button className="w-full" disabled>
              {isFinished ? "Contest Finished" : "Registration Closed"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
