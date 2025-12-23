import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Activity,
  PieChart,
  BarChart3,
  Target,
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface PortfolioPerformanceProps {
  contestId: number;
  participantId: number;
  portfolioValue: number;
}

interface AllocationPerformance {
  symbol: string;
  companyName?: string;
  allocation: number;
  amount: number;
  purchasePrice: number;
  currentPrice: number;
  currentValue: number;
  return: number;
  returnAmount: number;
  returnPercent: number;
}

interface PerformanceData {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalInvested: number;
  availableCash: number;
  allocations: AllocationPerformance[];
  ranking?: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B6B",
  "#4ECDC4",
  "#95E1D3",
];

export default function PortfolioPerformance({
  contestId,
  participantId,
  portfolioValue = 1000000,
}: PortfolioPerformanceProps) {
  const [performanceData, setPerformanceData] =
    useState<PerformanceData | null>(null);

  // Fetch portfolio allocations
  const { data: allocationsData, isLoading: allocationsLoading } =
    useQuery<any>({
      queryKey: ["/api/contests", contestId, "portfolio"],
    });

  // Fetch leaderboard data to get ranking and performance
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard", contestId.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?contestId=${contestId}`);
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      return response.json();
    },
  });

  // Calculate performance data
  useEffect(() => {
    if (
      !allocationsData?.allocations ||
      !Array.isArray(allocationsData.allocations)
    ) {
      // No allocations - portfolio value is unchanged
      setPerformanceData({
        totalValue: portfolioValue,
        totalReturn: 0,
        totalReturnPercent: 0,
        totalInvested: 0,
        availableCash: portfolioValue,
        allocations: [],
        ranking: leaderboard?.find(
          (entry: any) => entry.participantId === participantId
        )?.ranking,
      });
      return;
    }

    const calculatePerformance = async () => {
      const allocations = allocationsData.allocations;
      const allocationPerformances: AllocationPerformance[] = [];
      let totalCurrentValue = 0;
      let totalInvested = 0;

      // Get all unique symbols
      const symbolSet = new Set<string>(allocations.map((a: any) => a.symbol));
      const symbols = Array.from(symbolSet);

      try {
        // Fetch current prices for all symbols
        const pricePromises = symbols.map((symbol) => {
          // Check if symbol is crypto with proper mapping
          const cryptoSymbolMap: { [key: string]: string } = {
            BTC: "bitcoin",
            BITCOIN: "bitcoin",
            ETH: "ethereum",
            ETHEREUM: "ethereum",
            ADA: "cardano",
            CARDANO: "cardano",
            DOT: "polkadot",
            POLKADOT: "polkadot",
            SOL: "solana",
            SOLANA: "solana",
            MATIC: "polygon",
            POLYGON: "polygon",
            LINK: "chainlink",
            CHAINLINK: "chainlink",
            AVAX: "avalanche-2",
            AVALANCHE: "avalanche-2",
            UNI: "uniswap",
            UNISWAP: "uniswap",
            ATOM: "cosmos",
            COSMOS: "cosmos",
            LTC: "litecoin",
            LITECOIN: "litecoin",
            XRP: "ripple",
            RIPPLE: "ripple",
            BNB: "binancecoin",
            BINANCE: "binancecoin",
            DOGE: "dogecoin",
            DOGECOIN: "dogecoin",
          };

          const cryptoId = cryptoSymbolMap[symbol.toUpperCase()];
          const isCrypto =
            !!cryptoId ||
            symbol.toLowerCase().includes("coin") ||
            symbol.toLowerCase().includes("token");

          return fetch(
            `/api/${isCrypto ? "crypto" : "stocks"}/price/${
              isCrypto ? cryptoId || symbol.toLowerCase() : symbol
            }`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            }
          )
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null);
        });

        const priceResults = await Promise.all(pricePromises);
        const priceMap = new Map();

        symbols.forEach((symbol, index) => {
          const priceData = priceResults[index];
          if (priceData) {
            priceMap.set(symbol, priceData.price);
          }
        });

        // Calculate performance for each allocation
        for (const allocation of allocations) {
          const purchasePrice = parseFloat(allocation.purchasePrice || "0");
          const amountInvested = parseFloat(allocation.amount || "0");
          const currentPrice = priceMap.get(allocation.symbol);

          totalInvested += amountInvested;

          if (purchasePrice > 0 && currentPrice && currentPrice > 0) {
            // We have both purchase price and current price - calculate real performance
            const sharesOwned = amountInvested / purchasePrice;
            const currentValue = sharesOwned * currentPrice;
            const returnAmount = currentValue - amountInvested;
            const returnPercent = (returnAmount / amountInvested) * 100;

            totalCurrentValue += currentValue;

            allocationPerformances.push({
              symbol: allocation.symbol,
              companyName: allocation.companyName,
              allocation: parseFloat(allocation.allocation || "0"),
              amount: amountInvested,
              purchasePrice,
              currentPrice,
              currentValue,
              return: returnAmount,
              returnAmount,
              returnPercent,
            });
          } else if (currentPrice && currentPrice > 0) {
            // We have current price but no purchase price (likely crypto)
            // Assume purchase price equals current price (no gain/loss)
            totalCurrentValue += amountInvested;
            allocationPerformances.push({
              symbol: allocation.symbol,
              companyName: allocation.companyName,
              allocation: parseFloat(allocation.allocation || "0"),
              amount: amountInvested,
              purchasePrice: currentPrice,
              currentPrice,
              currentValue: amountInvested,
              return: 0,
              returnAmount: 0,
              returnPercent: 0,
            });
          } else {
            // No price data available at all - assume no change
            const fallbackPrice = purchasePrice > 0 ? purchasePrice : 1;
            totalCurrentValue += amountInvested;
            allocationPerformances.push({
              symbol: allocation.symbol,
              companyName: allocation.companyName,
              allocation: parseFloat(allocation.allocation || "0"),
              amount: amountInvested,
              purchasePrice: fallbackPrice,
              currentPrice: fallbackPrice,
              currentValue: amountInvested,
              return: 0,
              returnAmount: 0,
              returnPercent: 0,
            });
          }
        }

        const availableCash = portfolioValue - totalInvested;
        const totalValue = totalCurrentValue + availableCash;
        const totalReturn = totalCurrentValue - totalInvested;
        const totalReturnPercent =
          totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

        // Find ranking from leaderboard
        const ranking = leaderboard?.find(
          (entry: any) => entry.participantId === participantId
        )?.ranking;

        setPerformanceData({
          totalValue,
          totalReturn,
          totalReturnPercent,
          totalInvested,
          availableCash,
          allocations: allocationPerformances,
          ranking,
        });
      } catch (error) {
        console.error("Error calculating performance:", error);
        // Fallback to basic data
        setPerformanceData({
          totalValue: portfolioValue,
          totalReturn: 0,
          totalReturnPercent: 0,
          totalInvested: 0,
          availableCash: portfolioValue,
          allocations: [],
          ranking: leaderboard?.find(
            (entry: any) => entry.participantId === participantId
          )?.ranking,
        });
      }
    };

    calculatePerformance();
  }, [allocationsData, portfolioValue, leaderboard, participantId, contestId]);

  if (allocationsLoading || leaderboardLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading performance data...</p>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">Unable to load performance data</p>
        <p className="text-sm text-gray-400">Please try refreshing the page</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
  };

  // Prepare pie chart data
  const pieChartData = [
    ...performanceData.allocations.map((alloc, index) => ({
      name: alloc.companyName || alloc.symbol,
      value: alloc.currentValue,
      fill: COLORS[index % COLORS.length],
    })),
    ...(performanceData.availableCash > 0
      ? [
          {
            name: "Available Cash",
            value: performanceData.availableCash,
            fill: "#E5E7EB",
          },
        ]
      : []),
  ];

  // Prepare bar chart data for individual performance
  const barChartData = performanceData.allocations.map((alloc) => ({
    symbol: alloc.symbol,
    invested: alloc.amount,
    current: alloc.currentValue,
    return: alloc.returnPercent,
  }));

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(performanceData.totalValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Return</p>
                <p
                  className={`text-2xl font-bold ${
                    performanceData.totalReturn >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(performanceData.totalReturn)}
                </p>
              </div>
              {performanceData.totalReturn >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Return %</p>
                <p
                  className={`text-2xl font-bold ${
                    performanceData.totalReturnPercent >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatPercent(performanceData.totalReturnPercent)}
                </p>
              </div>
              <Percent className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contest Rank</p>
                <p className="text-2xl font-bold">
                  {performanceData.ranking
                    ? `#${performanceData.ranking}`
                    : "N/A"}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Portfolio Composition
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(1)}%`
                      }
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No allocations to display</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Individual Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Individual Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="symbol" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "return"
                          ? `${value}%`
                          : formatCurrency(Number(value))
                      }
                    />
                    <Legend />
                    <Bar dataKey="invested" fill="#8884d8" name="Invested" />
                    <Bar
                      dataKey="current"
                      fill="#82ca9d"
                      name="Current Value"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No investments to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Allocation Performance */}
      {performanceData.allocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Allocation Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2">Symbol</th>
                    <th className="text-left p-2">Company</th>
                    <th className="text-right p-2">Invested</th>
                    <th className="text-right p-2">Current Value</th>
                    <th className="text-right p-2">Return</th>
                    <th className="text-right p-2">Return %</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.allocations.map((alloc, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="p-2 font-medium">{alloc.symbol}</td>
                      <td className="p-2 text-gray-600">
                        {alloc.companyName || alloc.symbol}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(alloc.amount)}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(alloc.currentValue)}
                      </td>
                      <td
                        className={`p-2 text-right ${
                          alloc.returnAmount >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(alloc.returnAmount)}
                      </td>
                      <td
                        className={`p-2 text-right ${
                          alloc.returnPercent >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatPercent(alloc.returnPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Portfolio Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Invested</p>
              <p className="text-xl font-bold">
                {formatCurrency(performanceData.totalInvested)}
              </p>
              <Progress
                value={(performanceData.totalInvested / portfolioValue) * 100}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(
                  (performanceData.totalInvested / portfolioValue) *
                  100
                ).toFixed(1)}
                % of portfolio
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Available Cash</p>
              <p className="text-xl font-bold">
                {formatCurrency(performanceData.availableCash)}
              </p>
              <Progress
                value={(performanceData.availableCash / portfolioValue) * 100}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(
                  (performanceData.availableCash / portfolioValue) *
                  100
                ).toFixed(1)}
                % available
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Number of Holdings</p>
              <p className="text-xl font-bold">
                {performanceData.allocations.length}
              </p>
              <Badge variant="outline" className="mt-2">
                Max: 10 holdings
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
