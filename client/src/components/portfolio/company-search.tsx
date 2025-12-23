import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  TrendingUp,
  DollarSign,
  Plus,
  Bitcoin,
  TrendingDown,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CompanySearchProps {
  onSelectCompany: (company: {
    symbol: string;
    name: string;
    currentPrice?: number;
  }) => void;
  disabled?: boolean;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

// Component for individual search result with price information
function SearchResultItem({
  company,
  onSelect,
}: {
  company: SearchResult;
  onSelect: () => void;
}) {
  const { data: priceData, error: priceError } = useQuery<StockPrice>({
    queryKey: [
      `/api/${company.type === "Cryptocurrency" ? "crypto" : "stocks"}/price/${
        company.symbol
      }`,
    ],
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

  return (
    <CommandItem
      key={company.symbol}
      value={company.symbol}
      onSelect={onSelect}
      className="flex items-center justify-between cursor-pointer p-3"
    >
      <div className="flex-1">
        <div className="font-medium flex items-center">
          {company.type === "Cryptocurrency" && (
            <Bitcoin className="h-4 w-4 mr-2 text-orange-500" />
          )}
          {company.name}
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          <Badge
            variant={
              company.type === "Cryptocurrency" ? "secondary" : "outline"
            }
            className="mr-2 text-xs"
          >
            {company.symbol}
          </Badge>
          {company.type}
        </div>
      </div>
      <div className="text-right">
        {priceData ? (
          <div className="space-y-1">
            <div className="font-semibold text-sm">
              {formatPrice(priceData.price)}
            </div>
            <div
              className={`text-xs flex items-center ${
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
        ) : (
          <div className="text-xs text-gray-400">Loading...</div>
        )}
      </div>
    </CommandItem>
  );
}

export default function CompanySearch({
  onSelectCompany,
  disabled = false,
}: CompanySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<SearchResult | null>(
    null
  );

  // Search for companies and crypto
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery<SearchResult[]>({
    queryKey: [`/api/assets/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: searchQuery.length >= 2,
  });

  // Get current price for selected company (stock or crypto)
  const { data: currentPrice } = useQuery<StockPrice>({
    queryKey: selectedCompany
      ? [
          `/api/${
            selectedCompany.type === "Cryptocurrency" ? "crypto" : "stocks"
          }/price/${selectedCompany.symbol}`,
        ]
      : [],
    enabled: !!selectedCompany?.symbol,
  });

  const handleSelectCompany = (company: SearchResult) => {
    setSelectedCompany(company);
    setSearchQuery(company.name);
    setIsOpen(false);
  };

  const handleAddToPortfolio = () => {
    if (selectedCompany) {
      onSelectCompany({
        symbol: selectedCompany.symbol,
        name: selectedCompany.name,
        currentPrice: currentPrice?.price,
      });
      // Reset selection
      setSelectedCompany(null);
      setSearchQuery("");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number, changePercent: number) => {
    const safeChange = change || 0;
    const safeChangePercent = changePercent || 0;
    const sign = safeChange >= 0 ? "+" : "";
    return `${sign}${formatPrice(
      safeChange
    )} (${sign}${safeChangePercent.toFixed(2)}%)`;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="company-search">Search for Companies</Label>
        <div className="relative">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                className="w-full justify-between text-left font-normal"
                disabled={disabled}
              >
                <div className="flex items-center">
                  <Search className="h-4 w-4 mr-2 text-gray-400" />
                  {selectedCompany
                    ? selectedCompany.name
                    : "Search stocks & crypto (e.g., Apple, Tesla, Bitcoin)..."}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search companies..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>
                    {isSearching
                      ? "Searching..."
                      : searchQuery.length < 2
                      ? "Type at least 2 characters to search"
                      : "No companies found"}
                  </CommandEmpty>
                  {searchResults && searchResults.length > 0 && (
                    <CommandGroup>
                      {searchResults.map((company) => (
                        <SearchResultItem
                          key={company.symbol}
                          company={company}
                          onSelect={() => handleSelectCompany(company)}
                        />
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Selected Company Card */}
      {selectedCompany && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="font-semibold text-lg">
                    {selectedCompany.name}
                  </h3>
                  <Badge variant="secondary" className="ml-2">
                    {selectedCompany.symbol}
                  </Badge>
                </div>

                {currentPrice ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(currentPrice.price)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp
                        className={`h-4 w-4 mr-1 ${
                          (currentPrice.change || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          (currentPrice.change || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatChange(
                          currentPrice.change || 0,
                          currentPrice.changePercent || 0
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    <span className="text-sm text-gray-500">
                      Loading current price...
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleAddToPortfolio}
                disabled={disabled || !currentPrice}
                className="ml-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
