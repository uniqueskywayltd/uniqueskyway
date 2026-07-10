import type { MarketAssetKey, MarketQuote, MarketTickerConfig } from "@/lib/constants/trust-components";
import { MARKET_TICKER_CONFIG_DEFAULT } from "@/lib/constants/trust-components";
import { FEATURE_FLAGS } from "@/lib/constants/feature-flags";
import { SYSTEM_SETTINGS } from "@/lib/constants/system-settings";
import { featureFlagService } from "./feature-flags.service";
import { settingsService } from "./settings.service";
import { buildMockQuotes } from "./market-data/mock.provider";
import { ok } from "./base";
import type { ServiceResult } from "./types";

type CacheEntry = {
  quotes: MarketQuote[];
  lastUpdated: Date;
  provider: string;
};

let cache: CacheEntry | null = null;

export class MarketDataService {
  async getConfig(): Promise<MarketTickerConfig> {
    const stored = await settingsService.get<MarketTickerConfig>(
      SYSTEM_SETTINGS.MARKET_TICKER_CONFIG,
    );
    return { ...MARKET_TICKER_CONFIG_DEFAULT, ...stored };
  }

  async updateConfig(
    config: Partial<MarketTickerConfig>,
    adminUserId: string,
  ): Promise<ServiceResult<MarketTickerConfig>> {
    const current = await this.getConfig();
    const next = { ...current, ...config };
    const result = await settingsService.update(
      SYSTEM_SETTINGS.MARKET_TICKER_CONFIG,
      next,
      adminUserId,
    );
    if (!result.success) return result;
    cache = null;
    return ok(next);
  }

  async getTicker(): Promise<
    ServiceResult<{
      enabled: boolean;
      quotes: MarketQuote[];
      lastUpdated: string;
      provider: string;
    }>
  > {
    const enabled = await featureFlagService.isEnabled(FEATURE_FLAGS.MARKET_TICKER_ENABLED);
    if (!enabled) {
      return ok({ enabled: false, quotes: [], lastUpdated: "", provider: "disabled" });
    }

    const config = await this.getConfig();
    const now = new Date();

    if (
      cache &&
      now.getTime() - cache.lastUpdated.getTime() < config.cacheDurationSeconds * 1000
    ) {
      return ok({
        enabled: true,
        quotes: cache.quotes,
        lastUpdated: cache.lastUpdated.toISOString(),
        provider: cache.provider,
      });
    }

    const quotes = this.fetchFromProvider(config.provider, config.visibleAssets, now);
    cache = { quotes, lastUpdated: now, provider: config.provider };
    return ok({
      enabled: true,
      quotes,
      lastUpdated: now.toISOString(),
      provider: config.provider,
    });
  }

  private fetchFromProvider(
    provider: MarketTickerConfig["provider"],
    assets: MarketAssetKey[],
    at: Date,
  ): MarketQuote[] {
    switch (provider) {
      case "live":
      case "cached":
      case "mock":
      default:
        return buildMockQuotes(assets, at);
    }
  }
}

export const marketDataService = new MarketDataService();
