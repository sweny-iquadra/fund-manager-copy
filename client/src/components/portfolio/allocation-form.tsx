import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Plus,
  Trash2,
  DollarSign,
  Percent,
  PieChart,
  Save,
  Search,
  TrendingUp,
  TrendingDown,
  Bitcoin,
} from "lucide-react";
import CompanySearch from "./company-search";

interface AllocationFormProps {
  contestId: number;
  categoryId: number;
  isAllocationOpen: boolean;
}

interface Allocation {
  id?: number;
  symbol: string;
  allocation: number;
  amount: number;
  companyName?: string;
}

interface PortfolioData {
  allocations: Allocation[];
  portfolioValue: number;
  totalAllocated: number;
  availableCash: number;
  participant: any;
}

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

// Component to display current price for an allocation
function AllocationPriceDisplay({ symbol }: { symbol: string }) {
  // Improved crypto detection logic
  const isCrypto =
    // Common crypto ticker symbols
    [
      "BTC",
      "ETH",
      "ADA",
      "DOT",
      "SOL",
      "MATIC",
      "LINK",
      "AVAX",
      "UNI",
      "ATOM",
      "LTC",
      "XRP",
      "BNB",
      "DOGE",
    ].includes(symbol.toUpperCase()) ||
    // CoinGecko ID format (lowercase names)
    [
      "bitcoin",
      "ethereum",
      "cardano",
      "polkadot",
      "solana",
      "polygon",
      "chainlink",
      "avalanche-2",
      "uniswap",
      "cosmos",
      "litecoin",
      "ripple",
      "binancecoin",
      "dogecoin",
    ].includes(symbol.toLowerCase()) ||
    // Common crypto naming patterns
    symbol.toLowerCase().includes("coin") ||
    symbol.toLowerCase().includes("token") ||
    symbol.toLowerCase().includes("crypto");

  const {
    data: priceData,
    isLoading,
    error: priceError,
  } = useQuery<StockPrice>({
    queryKey: [`/api/${isCrypto ? "crypto" : "stocks"}/price/${symbol}`],
    enabled: !!symbol && symbol.trim() !== "",
    staleTime: 60000, // Cache for 1 minute
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (!symbol || symbol.trim() === "") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="text-xs text-gray-400 flex items-center">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
        Loading price...
      </div>
    );
  }

  if (priceError) {
    return <div className="text-xs text-red-400">Error loading price</div>;
  }

  if (!priceData) {
    return <div className="text-xs text-gray-400">Price unavailable</div>;
  }

  return (
    <div className="text-right">
      <div className="text-sm font-semibold">
        {formatPrice(priceData.price)}
      </div>
      <div
        className={`text-xs flex items-center justify-end ${
          (priceData.change || 0) >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {(priceData.change || 0) >= 0 ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        {priceData.changePercent?.toFixed(2) || "0.00"}%
      </div>
    </div>
  );
}

export default function AllocationForm({
  contestId,
  categoryId,
  isAllocationOpen,
}: AllocationFormProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: portfolioData, isLoading } = useQuery<PortfolioData>({
    queryKey: ["/api/contests", contestId, "portfolio"],
    enabled: !!contestId,
  });

  useEffect(() => {
    if (portfolioData?.allocations && portfolioData.allocations.length > 0) {
      const loadedAllocations: Allocation[] = portfolioData.allocations.map(
        (a: any) => ({
          id: a.id,
          symbol: a.symbol,
          allocation: parseFloat(a.allocation),
          amount: parseFloat(a.amount),
          companyName: a.companyName,
        })
      );

      setAllocations(loadedAllocations);
    } else {
      // Start with empty allocations array - users can add allocations using the buttons
      setAllocations([]);
    }
  }, [portfolioData]);

  // Individual allocation update mutation
  const updateAllocationMutation = useMutation({
    mutationFn: async ({
      symbol,
      allocation,
      amount,
      companyName,
    }: {
      symbol: string;
      allocation: number;
      amount: number;
      companyName?: string;
    }) => {
      await apiRequest(
        "PUT",
        `/api/contests/${contestId}/portfolio/${symbol}`,
        {
          allocation,
          amount,
          companyName: companyName || "",
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Allocation updated successfully!",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/contests", contestId, "portfolio"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update allocation.",
        variant: "destructive",
      });
    },
  });

  // Remove allocation mutation
  const removeAllocationMutation = useMutation({
    mutationFn: async (symbol: string) => {
      await apiRequest(
        "DELETE",
        `/api/contests/${contestId}/portfolio/${symbol}`
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Allocation removed successfully!",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/contests", contestId, "portfolio"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove allocation.",
        variant: "destructive",
      });
    },
  });

  const handleCompanySelect = (company: {
    symbol: string;
    name: string;
    currentPrice?: number;
  }) => {
    // Check if company already exists
    const existingIndex = allocations.findIndex(
      (a) => a.symbol === company.symbol
    );
    if (existingIndex >= 0) {
      toast({
        title: "Company Already Added",
        description: `${company.name} (${company.symbol}) is already in your portfolio.`,
        variant: "destructive",
      });
      return;
    }

    if (allocations.length >= 10) {
      toast({
        title: "Portfolio Limit Reached",
        description: "Maximum 10 companies allowed in portfolio.",
        variant: "destructive",
      });
      return;
    }

    // Add new allocation with company info
    setAllocations([
      ...allocations,
      {
        symbol: company.symbol,
        allocation: 0,
        amount: 0,
        companyName: company.name,
      },
    ]);
  };

  const addNewAllocation = () => {
    if (allocations.length >= 10) {
      toast({
        title: "Portfolio Limit Reached",
        description: "Maximum 10 companies allowed in portfolio.",
        variant: "destructive",
      });
      return;
    }

    setAllocations([
      ...allocations,
      {
        symbol: "",
        allocation: 0,
        amount: 0,
      },
    ]);
  };

  const removeAllocation = (allocation: Allocation, index: number) => {
    if (allocation.id) {
      // Remove from backend if it exists
      removeAllocationMutation.mutate(allocation.symbol);
    }
    // Remove from local state
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateAllocation = (
    index: number,
    field: keyof Allocation,
    value: string | number
  ) => {
    const newAllocations = [...allocations];
    const allocation = { ...newAllocations[index], [field]: value };

    const portfolioValue = portfolioData?.portfolioValue || 1000000;

    // Auto-calculate amount when allocation percentage changes
    if (field === "allocation") {
      const percentage = Number(value);
      allocation.amount = (percentage / 100) * portfolioValue;
    }

    // Auto-calculate allocation when amount changes
    if (field === "amount") {
      const amount = Number(value);
      allocation.allocation = (amount / portfolioValue) * 100;
    }

    newAllocations[index] = allocation;
    setAllocations(newAllocations);

    // Auto-save if this is an existing allocation (has an id) and we're updating amount/allocation
    if (
      allocation.id &&
      (field === "allocation" || field === "amount") &&
      allocation.symbol.trim()
    ) {
      const otherAllocations = newAllocations.filter((_, i) => i !== index);
      const totalOther = otherAllocations.reduce(
        (sum, a) => sum + Number(a.amount),
        0
      );

      // Only save if it doesn't exceed portfolio limit
      if (totalOther + Number(allocation.amount) <= portfolioValue) {
        updateAllocationMutation.mutate({
          symbol: allocation.symbol,
          allocation: Number(allocation.allocation),
          amount: Number(allocation.amount),
          companyName: allocation.companyName,
        });
      }
    }
  };

  const totalAllocation = allocations.reduce(
    (sum, alloc) => sum + Number(alloc.allocation),
    0
  );
  const totalAmount = allocations.reduce(
    (sum, alloc) => sum + Number(alloc.amount),
    0
  );
  const portfolioValue = portfolioData?.portfolioValue || 1000000;
  const availableCash = portfolioValue - totalAmount;

  const isValidAllocation = () => {
    const validAllocations = allocations.filter((a) => a.symbol.trim() !== "");
    return (
      validAllocations.every((a) => a.allocation > 0) &&
      totalAmount <= portfolioValue &&
      validAllocations.length <= 10 &&
      validAllocations.length > 0
    );
  };

  const saveNewAllocation = (allocation: Allocation) => {
    if (!allocation.symbol.trim() || allocation.amount <= 0) return;

    updateAllocationMutation.mutate({
      symbol: allocation.symbol,
      allocation: allocation.allocation,
      amount: allocation.amount,
      companyName: allocation.companyName,
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Portfolio Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                ${portfolioValue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Portfolio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                ${totalAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Allocated</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  availableCash < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                ${availableCash.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Available Cash</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    totalAmount > portfolioValue ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (totalAmount / portfolioValue) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((totalAmount / portfolioValue) * 100).toFixed(1)}% allocated
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Portfolio Allocations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isAllocationOpen && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 font-medium">
                Allocation Period Closed
              </p>
              <p className="text-sm text-amber-700">
                The allocation period for this contest has ended. You can no
                longer modify your portfolio.
              </p>
            </div>
          )}

          {/* Company Search */}
          {isAllocationOpen && allocations.length < 10 && (
            <div className="mb-6">
              <CompanySearch
                onSelectCompany={handleCompanySelect}
                disabled={!isAllocationOpen}
              />
            </div>
          )}

          {/* Add New Allocation Button */}
          {isAllocationOpen && allocations.length < 10 && (
            <div className="mb-4 flex justify-center">
              <Button
                onClick={addNewAllocation}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Allocation
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {/* Empty state when no allocations */}
            {allocations.length === 0 && isAllocationOpen && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No allocations yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start building your portfolio by searching for companies above
                  or adding a new allocation.
                </p>
              </div>
            )}

            {/* Show message when allocations are closed and no allocations exist */}
            {allocations.length === 0 && !isAllocationOpen && (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No portfolio allocations
                </h3>
                <p className="text-gray-600">
                  You did not make any allocations during the allocation period
                  for this contest.
                </p>
              </div>
            )}

            {allocations.map((allocation, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <Label htmlFor={`symbol-${index}`}>Stock Symbol</Label>
                    <Input
                      id={`symbol-${index}`}
                      placeholder="e.g., AAPL"
                      value={allocation.symbol}
                      onChange={(e) =>
                        updateAllocation(
                          index,
                          "symbol",
                          e.target.value.toUpperCase()
                        )
                      }
                      disabled={!isAllocationOpen}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`allocation-${index}`}>Allocation %</Label>
                    <div className="relative">
                      <Input
                        id={`allocation-${index}`}
                        type="number"
                        placeholder="0.0"
                        value={allocation.allocation}
                        onChange={(e) =>
                          updateAllocation(
                            index,
                            "allocation",
                            Number(e.target.value)
                          )
                        }
                        min="0"
                        max="100"
                        step="0.1"
                        disabled={!isAllocationOpen}
                      />
                      <Percent className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`amount-${index}`}>Amount ($)</Label>
                    <div className="relative">
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        placeholder="0"
                        value={allocation.amount}
                        onChange={(e) =>
                          updateAllocation(
                            index,
                            "amount",
                            Number(e.target.value)
                          )
                        }
                        min="0"
                        max={portfolioValue}
                        step="1000"
                        disabled={!isAllocationOpen}
                        className={
                          allocation.amount > portfolioValue
                            ? "border-red-500 focus:border-red-500"
                            : ""
                        }
                      />
                      {/* <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" /> */}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <Label>Current Price</Label>
                    <div className="pt-2">
                      <AllocationPriceDisplay symbol={allocation.symbol} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="flex gap-2">
                      {isAllocationOpen &&
                        !allocation.id &&
                        allocation.symbol.trim() &&
                        allocation.amount > 0 && (
                          <Button
                            onClick={() => saveNewAllocation(allocation)}
                            disabled={updateAllocationMutation.isPending}
                            size="sm"
                          >
                            {updateAllocationMutation.isPending ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      {isAllocationOpen &&
                        (allocations.length > 1 || allocation.id) && (
                          <Button
                            onClick={() => removeAllocation(allocation, index)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Allocation Status */}
          <div className="mt-6 space-y-3">
            {/* Over-allocation Warning */}
            {totalAmount > portfolioValue && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="text-red-600 font-medium">
                    ⚠️ Over-allocated by $
                    {(totalAmount - portfolioValue).toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Reduce your allocations to stay within your $
                  {portfolioValue.toLocaleString()} portfolio limit.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    totalAmount > portfolioValue ? "destructive" : "default"
                  }
                >
                  ${totalAmount.toLocaleString()} allocated
                </Badge>
                <Badge variant="outline">
                  {allocations.filter((a) => a.symbol.trim() !== "").length} /
                  10 stocks
                </Badge>
                <Badge variant="secondary">
                  ${availableCash.toLocaleString()} available
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
