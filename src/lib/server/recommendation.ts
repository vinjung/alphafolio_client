import { db } from '@/lib/server/db';
import { dailyRecommendation } from '@schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCacheRedis, calculateTTL, CacheKeys } from '@/lib/redis';

export type DailyRecommendation = typeof dailyRecommendation.$inferSelect;

export type RecommendationItem = {
  stockName: string;
  symbol: string;
  date: string;
  country: string;
  rank: number;
  finalGrade: string | null;
  finalScore: string | null;
  signalOverall: string | null;
  timeSeriesText: string | null;
  riskProfileText: string | null;
  volatilityAnnual: string | null;
  maxDrawdown1Y: string | null;
  var95: string | null;
  cvar95: string | null;
  beta: string | null;
  sectorMomentum: string | null;
  rsValue: string | null;
  rsRank: string | null;
  industryRank: number | null;
  sectorRank: number | null;
  close: string | null;
  changeRate: string | null;
};

/**
 * Get daily recommendations by country
 * Returns the most recent date's data, sorted by rank
 */
export async function getDailyRecommendations(
  country: 'KR' | 'US'
): Promise<RecommendationItem[]> {
  const cacheKey = CacheKeys.recommendation(country);

  // Try cache first
  const redis = await getCacheRedis();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Redis error - continue to DB query
    }
  }

  // First, get the most recent date for the given country
  const latestDateResult = await db
    .select({ date: dailyRecommendation.date })
    .from(dailyRecommendation)
    .where(eq(dailyRecommendation.country, country))
    .orderBy(desc(dailyRecommendation.date))
    .limit(1);

  if (latestDateResult.length === 0) {
    return [];
  }

  const latestDate = latestDateResult[0].date;

  // Get all recommendations for the latest date
  const results = await db
    .select()
    .from(dailyRecommendation)
    .where(
      and(
        eq(dailyRecommendation.country, country),
        eq(dailyRecommendation.date, latestDate)
      )
    )
    .orderBy(dailyRecommendation.rank);

  const result = results.map((r) => ({
    stockName: r.stockName || '',
    symbol: r.symbol,
    date: r.date,
    country: r.country || country,
    rank: r.rank || 0,
    finalGrade: r.finalGrade,
    finalScore: r.finalScore,
    signalOverall: r.signalOverall,
    timeSeriesText: r.timeSeriesText,
    riskProfileText: r.riskProfileText,
    volatilityAnnual: r.volatilityAnnual,
    maxDrawdown1Y: r.maxDrawdown1Y,
    var95: r.var95,
    cvar95: r.cvar95,
    beta: r.beta,
    sectorMomentum: r.sectorMomentum,
    rsValue: r.rsValue,
    rsRank: r.rsRank,
    industryRank: r.industryRank,
    sectorRank: r.sectorRank,
    close: r.close,
    changeRate: r.changeRate,
  }));

  // Store in cache
  if (redis && result.length > 0) {
    try {
      const ttl = calculateTTL(country);
      await redis.set(cacheKey, JSON.stringify(result), { EX: ttl });
    } catch {
      // Cache write error - ignore
    }
  }

  return result;
}
