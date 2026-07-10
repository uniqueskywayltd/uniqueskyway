import type { MarketAssetKey, MarketQuote } from "@/lib/constants/trust-components";

const ASSET_META: Record<
  MarketAssetKey,
  { symbol: string; name: string; basePrice: number; currency: string }
> = {
  btc: { symbol: "BTC", name: "Bitcoin", basePrice: 118_240, currency: "USD" },
  eth: { symbol: "ETH", name: "Ethereum", basePrice: 3_820, currency: "USD" },
  sol: { symbol: "SOL", name: "Solana", basePrice: 186.4, currency: "USD" },
  bnb: { symbol: "BNB", name: "BNB", basePrice: 612.5, currency: "USD" },
  gold: { symbol: "GOLD", name: "Gold", basePrice: 3_410, currency: "USD" },
  silver: { symbol: "SILVER", name: "Silver", basePrice: 38.2, currency: "USD" },
  crude_oil: { symbol: "WTI", name: "Crude Oil", basePrice: 78.6, currency: "USD" },
  sp500: { symbol: "S&P 500", name: "S&P 500", basePrice: 5_842, currency: "USD" },
  nasdaq: { symbol: "NASDAQ", name: "NASDAQ", basePrice: 18_920, currency: "USD" },
  dxy: { symbol: "DXY", name: "US Dollar Index", basePrice: 104.2, currency: "USD" },
  eur_usd: { symbol: "EUR/USD", name: "EUR/USD", basePrice: 1.0842, currency: "USD" },
  gbp_usd: { symbol: "GBP/USD", name: "GBP/USD", basePrice: 1.2715, currency: "USD" },
};

function seededJitter(key: MarketAssetKey, hourBucket: number): number {
  let hash = hourBucket;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return ((hash % 401) - 200) / 100;
}

export function buildMockQuotes(
  assets: MarketAssetKey[],
  at: Date = new Date(),
): MarketQuote[] {
  const hourBucket = Math.floor(at.getTime() / 3_600_000);

  return assets.map((key) => {
    const meta = ASSET_META[key];
    const change = seededJitter(key, hourBucket);
    const price =
      key === "eur_usd" || key === "gbp_usd"
        ? Number((meta.basePrice * (1 + change / 500)).toFixed(4))
        : Number((meta.basePrice * (1 + change / 100)).toFixed(key === "btc" ? 0 : 2));

    return {
      key,
      symbol: meta.symbol,
      name: meta.name,
      price,
      changePercent24h: change / 10,
      currency: meta.currency,
    };
  });
}
