import { Trophy, Medal, TrendingUp, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LeaderboardEntry } from "@shared/schema";

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
}

export default function LeaderboardTable({ leaderboard }: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-500" />;
      default:
        return (
          <div className="w-8 h-8 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
            {rank}
          </div>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 text-white">1st</Badge>;
      case 2:
        return <Badge className="bg-gray-400 text-white">2nd</Badge>;
      case 3:
        return <Badge className="bg-orange-500 text-white">3rd</Badge>;
      default:
        return <Badge variant="outline">{rank}th</Badge>;
    }
  };

  const getReturnColor = (returnPercent: number) => {
    if (returnPercent > 0) return "text-green-600";
    if (returnPercent < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getUserInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getUserName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email;
  };

  const getAvatarColor = (rank: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500", 
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-gray-500"
    ];
    return colors[rank % colors.length];
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Rank</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Trader</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Return</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Portfolio Value</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Prize</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 leaderboard-row">
              <td className="py-4 px-4">
                <div className="flex items-center">
                  {entry.ranking <= 3 ? (
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {getRankIcon(entry.ranking)}
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {entry.ranking}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center">
                  {entry.user.profileImageUrl ? (
                    <img
                      src={entry.user.profileImageUrl}
                      alt={getUserName(entry.user)}
                      className="w-8 h-8 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className={`w-8 h-8 ${getAvatarColor(entry.ranking)} text-white rounded-full flex items-center justify-center text-sm font-bold mr-3`}>
                      {getUserInitials(entry.user)}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-900">
                      {getUserName(entry.user)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {getRankBadge(entry.ranking)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center">
                  <TrendingUp className={`h-4 w-4 mr-1 ${getReturnColor(parseFloat(entry.totalReturn))}`} />
                  <span className={`font-semibold ${getReturnColor(parseFloat(entry.totalReturn))}`}>
                    {parseFloat(entry.totalReturn) > 0 ? '+' : ''}
                    {parseFloat(entry.totalReturn).toFixed(2)}%
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  ${parseFloat(entry.totalReturnAmount).toLocaleString()}
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="font-semibold text-gray-900">
                  ${parseFloat(entry.portfolioValue).toLocaleString()}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-accent font-semibold">
                  {entry.ranking === 1 && "🥇 $38,250"}
                  {entry.ranking === 2 && "🥈 $25,500"}
                  {entry.ranking === 3 && "🥉 $12,750"}
                  {entry.ranking > 3 && entry.ranking <= 10 && `$${(1000 * (11 - entry.ranking)).toLocaleString()}`}
                  {entry.ranking > 10 && "-"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
