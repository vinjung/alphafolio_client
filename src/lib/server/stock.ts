import { db } from '@/lib/server/db';
import {
  krStockBasic,
  usStockBasic,
  krStockGrade,
  usStockGrade,
  krIntraday,
  usDaily,
  krIntradayTotal,
  krIndicators,
  usIndicators,
} from '@schema';
import { eq, desc, gte, and, or, ilike } from 'drizzle-orm';
import { getCacheRedis, calculateTTL, CacheKeys } from '@/lib/redis';

export type Market = 'KR' | 'US';

export type KrStockBasic = typeof krStockBasic.$inferSelect;
export type UsStockBasic = typeof usStockBasic.$inferSelect;
export type KrStockGrade = typeof krStockGrade.$inferSelect;
export type UsStockGrade = typeof usStockGrade.$inferSelect;
export type KrIntraday = typeof krIntraday.$inferSelect;
export type UsDaily = typeof usDaily.$inferSelect;

export type StockPriceData = {
  close: string | null;
  changeRate: string | null;
  changeAmount: string | null;
};

export type StockBasicResult =
  | { market: 'KR'; data: KrStockBasic }
  | { market: 'US'; data: UsStockBasic }
  | null;

export type StockGradeResult =
  | { market: 'KR'; data: KrStockGrade }
  | { market: 'US'; data: UsStockGrade }
  | null;

/**
 * Check if symbol starts with a number (Korean stock pattern)
 */
function startsWithNumber(symbol: string): boolean {
  return /^\d/.test(symbol);
}

/**
 * Get stock basic info by symbol
 * - If symbol starts with number: search KR first, then US
 * - If symbol starts with letter: search US first, then KR
 * - Returns null if not found in both
 */
export async function getStockBySymbol(symbol: string): Promise<StockBasicResult> {
  const upperSymbol = symbol.toUpperCase();

  if (startsWithNumber(upperSymbol)) {
    // Number prefix: KR first
    const krResult = await db
      .select()
      .from(krStockBasic)
      .where(eq(krStockBasic.symbol, upperSymbol))
      .limit(1);

    if (krResult.length > 0) {
      return { market: 'KR', data: krResult[0] };
    }

    // Fallback to US
    const usResult = await db
      .select()
      .from(usStockBasic)
      .where(eq(usStockBasic.symbol, upperSymbol))
      .limit(1);

    if (usResult.length > 0) {
      return { market: 'US', data: usResult[0] };
    }
  } else {
    // Letter prefix: US first
    const usResult = await db
      .select()
      .from(usStockBasic)
      .where(eq(usStockBasic.symbol, upperSymbol))
      .limit(1);

    if (usResult.length > 0) {
      return { market: 'US', data: usResult[0] };
    }

    // Fallback to KR
    const krResult = await db
      .select()
      .from(krStockBasic)
      .where(eq(krStockBasic.symbol, upperSymbol))
      .limit(1);

    if (krResult.length > 0) {
      return { market: 'KR', data: krResult[0] };
    }
  }

  return null;
}

/**
 * Get latest stock grade by symbol
 * - If symbol starts with number: search KR first, then US
 * - If symbol starts with letter: search US first, then KR
 * - Returns the most recent grade data (sorted by date desc)
 * - Returns null if not found in both
 */
export async function getStockGrade(symbol: string): Promise<StockGradeResult> {
  const upperSymbol = symbol.toUpperCase();

  if (startsWithNumber(upperSymbol)) {
    // Number prefix: KR first
    const krResult = await db
      .select()
      .from(krStockGrade)
      .where(eq(krStockGrade.symbol, upperSymbol))
      .orderBy(desc(krStockGrade.date))
      .limit(1);

    if (krResult.length > 0) {
      return { market: 'KR', data: krResult[0] };
    }

    // Fallback to US
    const usResult = await db
      .select()
      .from(usStockGrade)
      .where(eq(usStockGrade.symbol, upperSymbol))
      .orderBy(desc(usStockGrade.date))
      .limit(1);

    if (usResult.length > 0) {
      return { market: 'US', data: usResult[0] };
    }
  } else {
    // Letter prefix: US first
    const usResult = await db
      .select()
      .from(usStockGrade)
      .where(eq(usStockGrade.symbol, upperSymbol))
      .orderBy(desc(usStockGrade.date))
      .limit(1);

    if (usResult.length > 0) {
      return { market: 'US', data: usResult[0] };
    }

    // Fallback to KR
    const krResult = await db
      .select()
      .from(krStockGrade)
      .where(eq(krStockGrade.symbol, upperSymbol))
      .orderBy(desc(krStockGrade.date))
      .limit(1);

    if (krResult.length > 0) {
      return { market: 'KR', data: krResult[0] };
    }
  }

  return null;
}

/**
 * Grade history data point
 */
export type GradeHistoryItem = {
  date: string;
  finalGrade: string | null;
};

/**
 * Get stock grade history by symbol (most recent N records)
 * - Same KR/US branching as getStockGrade
 * - Returns date + finalGrade only for lightweight response
 */
export async function getStockGradeHistory(
  symbol: string,
  limit: number = 10
): Promise<GradeHistoryItem[]> {
  const upperSymbol = symbol.toUpperCase();

  if (startsWithNumber(upperSymbol)) {
    const krResult = await db
      .select({
        date: krStockGrade.date,
        finalGrade: krStockGrade.finalGrade,
      })
      .from(krStockGrade)
      .where(eq(krStockGrade.symbol, upperSymbol))
      .orderBy(desc(krStockGrade.date))
      .limit(limit);

    if (krResult.length > 0) return krResult;

    const usResult = await db
      .select({
        date: usStockGrade.date,
        finalGrade: usStockGrade.finalGrade,
      })
      .from(usStockGrade)
      .where(eq(usStockGrade.symbol, upperSymbol))
      .orderBy(desc(usStockGrade.date))
      .limit(limit);

    return usResult;
  } else {
    const usResult = await db
      .select({
        date: usStockGrade.date,
        finalGrade: usStockGrade.finalGrade,
      })
      .from(usStockGrade)
      .where(eq(usStockGrade.symbol, upperSymbol))
      .orderBy(desc(usStockGrade.date))
      .limit(limit);

    if (usResult.length > 0) return usResult;

    const krResult = await db
      .select({
        date: krStockGrade.date,
        finalGrade: krStockGrade.finalGrade,
      })
      .from(krStockGrade)
      .where(eq(krStockGrade.symbol, upperSymbol))
      .orderBy(desc(krStockGrade.date))
      .limit(limit);

    return krResult;
  }
}

/**
 * Get stock price data by symbol and market
 * - KR: from kr_intraday (single row per symbol, always current)
 * - US: from us_daily (latest date)
 */
export async function getStockPrice(
  symbol: string,
  market: Market
): Promise<StockPriceData | null> {
  const upperSymbol = symbol.toUpperCase();

  if (market === 'KR') {
    const result = await db
      .select({
        close: krIntraday.close,
        changeRate: krIntraday.changeRate,
        changeAmount: krIntraday.changeAmount,
      })
      .from(krIntraday)
      .where(eq(krIntraday.symbol, upperSymbol))
      .limit(1);

    if (result.length > 0) {
      return {
        close: result[0].close,
        changeRate: result[0].changeRate,
        changeAmount: result[0].changeAmount,
      };
    }
  } else {
    // US: get latest date
    const result = await db
      .select({
        close: usDaily.close,
        changeRate: usDaily.changeRate,
        changeAmount: usDaily.changeAmount,
      })
      .from(usDaily)
      .where(eq(usDaily.symbol, upperSymbol))
      .orderBy(desc(usDaily.date))
      .limit(1);

    if (result.length > 0) {
      return {
        close: result[0].close,
        changeRate: result[0].changeRate,
        changeAmount: result[0].changeAmount,
      };
    }
  }

  return null;
}

/**
 * Get both stock basic info, grade, and price in one call
 * Returns null if stock not found
 */
export async function getStockDetail(symbol: string): Promise<{
  market: Market;
  basic: KrStockBasic | UsStockBasic;
  grade: KrStockGrade | UsStockGrade | null;
  price: StockPriceData | null;
} | null> {
  const basicResult = await getStockBySymbol(symbol);

  if (!basicResult) {
    return null;
  }

  // Fetch grade and price in parallel
  const [gradeResult, priceResult] = await Promise.all([
    getStockGrade(symbol),
    getStockPrice(symbol, basicResult.market),
  ]);

  return {
    market: basicResult.market,
    basic: basicResult.data,
    grade: gradeResult?.data ?? null,
    price: priceResult,
  };
}

/**
 * Get stock detail with Redis caching
 * - Checks cache first (cache_redis Index 0)
 * - Falls back to DB if cache miss
 * - Stores result in cache with TTL based on market
 */
export async function getStockDetailCached(symbol: string) {
  const cacheKey = CacheKeys.stockDetail(symbol);

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

  // Cache miss or Redis unavailable - fetch from DB
  const result = await getStockDetail(symbol);

  // Store in cache if Redis available
  if (result && redis) {
    try {
      const ttl = calculateTTL(result.market);
      await redis.set(cacheKey, JSON.stringify(result), { EX: ttl });
    } catch {
      // Cache write error - ignore
    }
  }

  return result;
}

/**
 * Chart time range type
 */
export type ChartTimeRange = '1주' | '1개월' | '3개월' | '6개월' | '1년';

/**
 * Chart data point (for line/area chart)
 */
export type ChartDataPoint = {
  time: string;
  price: number;
};

/**
 * OHLC data point (for candlestick chart)
 */
export type OHLCDataPoint = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/**
 * Indicator type for chart
 */
export type IndicatorType =
  | 'none'
  | 'rsi'
  | 'macd'
  | 'stochastic'
  | 'bollinger'
  | 'adx'
  | 'cci'
  | 'mfi'
  | 'obv'
  | 'atr';

/**
 * Indicator data point types
 */
export type IndicatorDataPoint = {
  time: string;
  value: number;
};

export type MACDDataPoint = {
  time: string;
  macd: number;
  signal: number;
  histogram: number;
};

export type StochasticDataPoint = {
  time: string;
  slowk: number;
  slowd: number;
};

export type BollingerDataPoint = {
  time: string;
  upper: number;
  middle: number;
  lower: number;
};

export type IndicatorData = {
  rsi?: IndicatorDataPoint[];
  macd?: MACDDataPoint[];
  stochastic?: StochasticDataPoint[];
  bollinger?: BollingerDataPoint[];
  adx?: IndicatorDataPoint[];
  cci?: IndicatorDataPoint[];
  mfi?: IndicatorDataPoint[];
  obv?: IndicatorDataPoint[];
  atr?: IndicatorDataPoint[];
};

/**
 * Combined chart data response
 */
export type ChartDataResponse = {
  data: ChartDataPoint[];
  ohlc: OHLCDataPoint[];
  indicators?: IndicatorData;
};

/**
 * Calculate start date based on time range
 */
function getStartDateForRange(range: ChartTimeRange): Date {
  const now = new Date();
  const result = new Date(now);

  switch (range) {
    case '1주':
      result.setDate(result.getDate() - 7);
      break;
    case '1개월':
      result.setMonth(result.getMonth() - 1);
      break;
    case '3개월':
      result.setMonth(result.getMonth() - 3);
      break;
    case '6개월':
      result.setMonth(result.getMonth() - 6);
      break;
    case '1년':
      result.setFullYear(result.getFullYear() - 1);
      break;
    default:
      result.setDate(result.getDate() - 7);
  }

  return result;
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get stock indicator data
 */
async function getStockIndicators(
  symbol: string,
  range: ChartTimeRange,
  market: Market,
  indicator: IndicatorType
): Promise<IndicatorData> {
  if (indicator === 'none') return {};

  const upperSymbol = symbol.toUpperCase();
  const startDate = getStartDateForRange(range);
  const startDateStr = formatDateString(startDate);

  const table = market === 'KR' ? krIndicators : usIndicators;

  const result = await db
    .select({
      date: table.date,
      rsi: table.rsi,
      macd: table.macd,
      macdSignal: table.macdSignal,
      macdHist: table.macdHist,
      realUpperBand: table.realUpperBand,
      realMiddleBand: table.realMiddleBand,
      realLowerBand: table.realLowerBand,
      atr: table.atr,
      slowk: table.slowk,
      slowd: table.slowd,
      mfi: table.mfi,
      adx: table.adx,
      cci: table.cci,
      obv: table.obv,
    })
    .from(table)
    .where(
      and(
        eq(table.symbol, upperSymbol),
        gte(table.date, startDateStr)
      )
    )
    .orderBy(table.date);

  const filteredResult = result.filter((row) => row.date !== null);

  switch (indicator) {
    case 'rsi':
      return {
        rsi: filteredResult
          .filter((row) => row.rsi !== null)
          .map((row) => ({
            time: row.date!,
            value: parseFloat(row.rsi!),
          })),
      };
    case 'macd':
      return {
        macd: filteredResult
          .filter((row) => row.macd !== null && row.macdSignal !== null)
          .map((row) => ({
            time: row.date!,
            macd: parseFloat(row.macd!),
            signal: parseFloat(row.macdSignal!),
            histogram: parseFloat(row.macdHist || '0'),
          })),
      };
    case 'stochastic':
      return {
        stochastic: filteredResult
          .filter((row) => row.slowk !== null && row.slowd !== null)
          .map((row) => ({
            time: row.date!,
            slowk: parseFloat(row.slowk!),
            slowd: parseFloat(row.slowd!),
          })),
      };
    case 'bollinger':
      return {
        bollinger: filteredResult
          .filter((row) => row.realUpperBand !== null)
          .map((row) => ({
            time: row.date!,
            upper: parseFloat(row.realUpperBand!),
            middle: parseFloat(row.realMiddleBand || '0'),
            lower: parseFloat(row.realLowerBand || '0'),
          })),
      };
    case 'adx':
      return {
        adx: filteredResult
          .filter((row) => row.adx !== null)
          .map((row) => ({
            time: row.date!,
            value: parseFloat(row.adx!),
          })),
      };
    case 'cci':
      return {
        cci: filteredResult
          .filter((row) => row.cci !== null)
          .map((row) => ({
            time: row.date!,
            value: parseFloat(row.cci!),
          })),
      };
    case 'mfi':
      return {
        mfi: filteredResult
          .filter((row) => row.mfi !== null)
          .map((row) => ({
            time: row.date!,
            value: parseFloat(row.mfi!),
          })),
      };
    case 'obv':
      return {
        obv: filteredResult
          .filter((row) => row.obv !== null)
          .map((row) => ({
            time: row.date!,
            value: parseFloat(row.obv!),
          })),
      };
    case 'atr':
      return {
        atr: filteredResult
          .filter((row) => row.atr !== null)
          .map((row) => ({
            time: row.date!,
            value: parseFloat(row.atr!),
          })),
      };
    default:
      return {};
  }
}

/**
 * Get stock chart data for Korean and US stocks with Redis caching
 * Returns both line chart data and OHLC data for candlestick
 * - KR: from kr_intraday_total
 * - US: from us_daily
 */
export async function getStockChartData(
  symbol: string,
  range: ChartTimeRange = '1주',
  market: Market = 'KR',
  indicator: IndicatorType = 'none'
): Promise<ChartDataResponse> {
  const cacheKey = CacheKeys.stockChart(symbol, range);
  const redis = await getCacheRedis();

  // Try cache first (only for chart data without indicators)
  if (indicator === 'none' && redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Redis error - continue to DB query
    }
  }

  const upperSymbol = symbol.toUpperCase();
  const startDate = getStartDateForRange(range);
  const startDateStr = formatDateString(startDate);

  let chartData: { data: ChartDataPoint[]; ohlc: OHLCDataPoint[] };

  if (market === 'KR') {
    const result = await db
      .select({
        date: krIntradayTotal.date,
        open: krIntradayTotal.open,
        high: krIntradayTotal.high,
        low: krIntradayTotal.low,
        close: krIntradayTotal.close,
        volume: krIntradayTotal.volume,
      })
      .from(krIntradayTotal)
      .where(
        and(
          eq(krIntradayTotal.symbol, upperSymbol),
          gte(krIntradayTotal.date, startDateStr)
        )
      )
      .orderBy(krIntradayTotal.date);

    const filteredResult = result.filter((row) => row.close !== null);

    chartData = {
      data: filteredResult.map((row) => ({
        time: row.date,
        price: parseFloat(row.close!),
      })),
      ohlc: filteredResult.map((row) => ({
        time: row.date,
        open: parseFloat(row.open || row.close!),
        high: parseFloat(row.high || row.close!),
        low: parseFloat(row.low || row.close!),
        close: parseFloat(row.close!),
        volume: Number(row.volume || 0),
      })),
    };
  } else {
    // US: from us_daily
    const result = await db
      .select({
        date: usDaily.date,
        open: usDaily.open,
        high: usDaily.high,
        low: usDaily.low,
        close: usDaily.close,
        volume: usDaily.volume,
      })
      .from(usDaily)
      .where(
        and(
          eq(usDaily.symbol, upperSymbol),
          gte(usDaily.date, startDateStr)
        )
      )
      .orderBy(usDaily.date);

    const filteredResult = result.filter((row) => row.close !== null);

    chartData = {
      data: filteredResult.map((row) => ({
        time: row.date,
        price: parseFloat(row.close!),
      })),
      ohlc: filteredResult.map((row) => ({
        time: row.date,
        open: parseFloat(row.open || row.close!),
        high: parseFloat(row.high || row.close!),
        low: parseFloat(row.low || row.close!),
        close: parseFloat(row.close!),
        volume: Number(row.volume || 0),
      })),
    };
  }

  // Fetch indicator data if requested
  if (indicator !== 'none') {
    const indicators = await getStockIndicators(symbol, range, market, indicator);
    return { ...chartData, indicators };
  }

  // Cache chart data (only when no indicators and Redis available)
  if (redis) {
    try {
      const ttl = calculateTTL(market);
      await redis.set(cacheKey, JSON.stringify(chartData), { EX: ttl });
    } catch {
      // Cache write error - ignore
    }
  }

  return chartData;
}

/**
 * Stock search result type
 */
export type StockSearchResult = {
  symbol: string;
  stockName: string;
  stockNameKr?: string | null;
  market: Market;
  exchange: string | null;
};

/**
 * Search stocks by symbol or name
 * - KR: symbol, stockName
 * - US: symbol, stockName, stockNameKr
 * Returns up to 20 results for autocomplete
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = `%${query.trim()}%`;
  const limit = 20;

  // Search KR stocks
  const krResults = await db
    .select({
      symbol: krStockBasic.symbol,
      stockName: krStockBasic.stockName,
      exchange: krStockBasic.exchange,
    })
    .from(krStockBasic)
    .where(
      or(
        ilike(krStockBasic.symbol, searchTerm),
        ilike(krStockBasic.stockName, searchTerm)
      )
    )
    .limit(limit);

  // Search US stocks
  const usResults = await db
    .select({
      symbol: usStockBasic.symbol,
      stockName: usStockBasic.stockName,
      stockNameKr: usStockBasic.stockNameKr,
      exchange: usStockBasic.exchange,
    })
    .from(usStockBasic)
    .where(
      or(
        ilike(usStockBasic.symbol, searchTerm),
        ilike(usStockBasic.stockName, searchTerm),
        ilike(usStockBasic.stockNameKr, searchTerm)
      )
    )
    .limit(limit);

  // Combine and format results
  const combined: StockSearchResult[] = [
    ...krResults.map((r) => ({
      symbol: r.symbol,
      stockName: r.stockName || '',
      market: 'KR' as Market,
      exchange: r.exchange,
    })),
    ...usResults.map((r) => ({
      symbol: r.symbol,
      stockName: r.stockName || '',
      stockNameKr: r.stockNameKr,
      market: 'US' as Market,
      exchange: r.exchange,
    })),
  ];

  // Sort: exact symbol match first, then by stockName
  combined.sort((a, b) => {
    const queryUpper = query.toUpperCase();
    const aExact = a.symbol.toUpperCase() === queryUpper ? 0 : 1;
    const bExact = b.symbol.toUpperCase() === queryUpper ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return (a.stockName || '').localeCompare(b.stockName || '');
  });

  return combined.slice(0, limit);
}

/**
 * Stock list item type (for client-side caching)
 */
export type StockListItem = {
  symbol: string;
  stockName: string;
  stockNameKr?: string | null;
  market: Market;
};

/**
 * Get all stocks for client-side search caching
 * Returns minimal data: symbol, stockName, stockNameKr, market
 */
export async function getAllStocksForSearch(): Promise<StockListItem[]> {
  // Fetch KR stocks
  const krResults = await db
    .select({
      symbol: krStockBasic.symbol,
      stockName: krStockBasic.stockName,
    })
    .from(krStockBasic);

  // Fetch US stocks
  const usResults = await db
    .select({
      symbol: usStockBasic.symbol,
      stockName: usStockBasic.stockName,
      stockNameKr: usStockBasic.stockNameKr,
    })
    .from(usStockBasic);

  // Combine results
  const combined: StockListItem[] = [
    ...krResults.map((r) => ({
      symbol: r.symbol,
      stockName: r.stockName || '',
      market: 'KR' as Market,
    })),
    ...usResults.map((r) => ({
      symbol: r.symbol,
      stockName: r.stockName || '',
      stockNameKr: r.stockNameKr,
      market: 'US' as Market,
    })),
  ];

  return combined;
}

/**
 * Check if stock exists by symbol (exact match)
 */
export async function checkStockExists(symbol: string): Promise<{ exists: boolean; market: Market | null }> {
  const upperSymbol = symbol.toUpperCase();

  // Check KR
  const krResult = await db
    .select({ symbol: krStockBasic.symbol })
    .from(krStockBasic)
    .where(eq(krStockBasic.symbol, upperSymbol))
    .limit(1);

  if (krResult.length > 0) {
    return { exists: true, market: 'KR' };
  }

  // Check US
  const usResult = await db
    .select({ symbol: usStockBasic.symbol })
    .from(usStockBasic)
    .where(eq(usStockBasic.symbol, upperSymbol))
    .limit(1);

  if (usResult.length > 0) {
    return { exists: true, market: 'US' };
  }

  return { exists: false, market: null };
}
