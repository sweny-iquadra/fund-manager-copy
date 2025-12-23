interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

interface HistoricalData {
  symbol: string;
  prices: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export class FinancialDataService {
  private finnhubApiKey: string;
  private yahooFinanceBaseUrl =
    "https://query1.finance.yahoo.com/v8/finance/chart/";
  private coinGeckoBaseUrl = "https://api.coingecko.com/api/v3/";

  constructor() {
    this.finnhubApiKey =
      process.env.FINNHUB_API_KEY || process.env.FINANCIAL_API_KEY || "demo";
  }

  async getStockPrice(symbol: string): Promise<StockPrice> {
    try {
      // Try Finnhub first
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.finnhubApiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        return {
          symbol,
          price: data.c || 0,
          change: data.d || 0,
          changePercent: data.dp || 0,
          timestamp: Date.now(),
        };
      }

      // Fallback to Yahoo Finance
      const yahooResponse = await fetch(`${this.yahooFinanceBaseUrl}${symbol}`);
      const yahooData = await yahooResponse.json();

      if (yahooData.chart?.result?.[0]) {
        const result = yahooData.chart.result[0];
        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice || 0;
        const previousClose = meta.previousClose || currentPrice;
        const change = currentPrice - previousClose;
        const changePercent =
          previousClose > 0 ? (change / previousClose) * 100 : 0;

        return {
          symbol,
          price: currentPrice,
          change: change,
          changePercent: changePercent,
          timestamp: Date.now(),
        };
      }

      throw new Error("No data available");
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      throw new Error(`Failed to fetch price for ${symbol}`);
    }
  }

  async getMultipleStockPrices(symbols: string[]): Promise<StockPrice[]> {
    const promises = symbols.map((symbol) => this.getStockPrice(symbol));
    return Promise.all(promises);
  }

  async getCryptoPrice(symbol: string): Promise<StockPrice> {
    try {
      const response = await fetch(
        `${this.coinGeckoBaseUrl}simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true`
      );

      const data = await response.json();
      const coinData = data[symbol];

      if (!coinData) {
        throw new Error(`No data found for ${symbol}`);
      }

      const price = coinData.usd || 0;
      const changePercent = coinData.usd_24h_change || 0;
      const change = price * (changePercent / 100);

      return {
        symbol: symbol.toUpperCase(),
        price: price,
        change: change,
        changePercent: changePercent,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error fetching crypto price for ${symbol}:`, error);
      throw new Error(`Failed to fetch crypto price for ${symbol}`);
    }
  }

  async getHistoricalData(
    symbol: string,
    period: string = "1y"
  ): Promise<HistoricalData> {
    try {
      const response = await fetch(
        `${this.yahooFinanceBaseUrl}${symbol}?range=${period}&interval=1d`
      );
      const data = await response.json();

      if (!data.chart?.result?.[0]) {
        throw new Error(`No historical data found for ${symbol}`);
      }

      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const ohlcv = result.indicators.quote[0];

      const prices = timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString().split("T")[0],
        open: ohlcv.open[index],
        high: ohlcv.high[index],
        low: ohlcv.low[index],
        close: ohlcv.close[index],
        volume: ohlcv.volume[index],
      }));

      return {
        symbol,
        prices,
      };
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
  }

  async searchStocks(
    query: string
  ): Promise<{ symbol: string; name: string; type: string }[]> {
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${query}&token=${this.finnhubApiKey}`
      );

      const data = await response.json();

      return (
        data.result?.slice(0, 10).map((item: any) => ({
          symbol: item.symbol,
          name: item.description,
          type: item.type,
        })) || []
      );
    } catch (error) {
      console.error(`Error searching stocks for ${query}:`, error);
      return [];
    }
  }

  async searchCrypto(
    query: string
  ): Promise<{ symbol: string; name: string; type: string }[]> {
    try {
      const response = await fetch(
        `${this.coinGeckoBaseUrl}search?query=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      return (
        data.coins?.slice(0, 10).map((coin: any) => ({
          symbol: coin.id,
          name: coin.name,
          type: "Cryptocurrency",
        })) || []
      );
    } catch (error) {
      console.error(`Error searching crypto for ${query}:`, error);
      return [];
    }
  }

  async searchAll(
    query: string
  ): Promise<{ symbol: string; name: string; type: string }[]> {
    try {
      const [stocks, crypto] = await Promise.all([
        this.searchStocks(query),
        this.searchCrypto(query),
      ]);

      // Combine and sort results, putting stocks first
      return [...stocks, ...crypto].slice(0, 10);
    } catch (error) {
      console.error(`Error searching all assets for ${query}:`, error);
      return [];
    }
  }

  calculatePortfolioValue(allocations: any[], prices: StockPrice[]): number {
    let totalValue = 0;

    for (const allocation of allocations) {
      const price = prices.find((p) => p.symbol === allocation.symbol);
      if (price && allocation.purchasePrice) {
        const shares =
          parseFloat(allocation.amount) / parseFloat(allocation.purchasePrice);
        totalValue += shares * price.price;
      }
    }

    return totalValue;
  }

  calculateReturn(
    initialValue: number,
    currentValue: number
  ): { amount: number; percentage: number } {
    const amount = currentValue - initialValue;
    const percentage = (amount / initialValue) * 100;

    return { amount, percentage };
  }
}

export const financialDataService = new FinancialDataService();
