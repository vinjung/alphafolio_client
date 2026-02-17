import { db } from '@/lib/server/db';
import {
  portfolioMaster,
  portfolioDailyPerformance,
  portfolioHoldings,
  portfolioStockDaily,
  portfolioRebalancing,
  krStockGrade,
  usStockGrade,
} from '@schema';
import { eq, desc, and, gte, sql, inArray } from 'drizzle-orm';
import { getCacheRedis, calculateTTL, CacheKeys } from '@/lib/redis';

export type ChartTimeRange = '최대' | '1년' | '6개월' | '3개월' | '1개월';

/**
 * Signal item structure for healthy/watch/risk signals
 */
export type SignalItem = {
  id: string;
  icon: string;
  signal: string;
  detail: string;
  priority: number;
  count?: number;
};

/**
 * Portfolio summary structure
 */
export type PortfolioSummary = {
  cash_ratio: number;
  cash_balance: number;
  cumulative_return: number;
  total_return_today: number;
  excess_return_today: number;
  benchmark_cumulative: number;
  total_portfolio_value: number;
  benchmark_return_today: number;
  excess_return_cumulative: number;
};

/**
 * Holdings flow structure (외국인/기관 매매 현황)
 */
export type HoldingsFlow = {
  detail: string;
  foreign_net_buy_count: number;
  foreign_net_sell_count: number;
  institution_net_buy_count: number;
  institution_net_sell_count: number;
};

/**
 * Fear index structure
 */
export type FearIndex = {
  level: string;
  value: number | null;
  detail: string;
};

/**
 * Investor flow structure
 */
export type InvestorFlow = {
  detail: string;
  retail: string;
  foreign: string;
  institution: string;
};

/**
 * Put/Call ratio structure
 */
export type PutCallRatio = {
  value: number | null;
  detail: string;
  signal: string;
};

/**
 * Economic sentiment structure
 */
export type EconomicSentiment = {
  value: number | null;
  detail: string;
};

/**
 * Market sentiment structure (replaces MarketContext)
 */
export type MarketSentiment = {
  overall: string;
  overall_detail: string;
  benchmark_name: string;
  benchmark_change: number | null;
  fear_index: FearIndex;
  investor_flow: InvestorFlow;
  put_call_ratio: PutCallRatio;
  economic_sentiment: EconomicSentiment;
};

/**
 * Technical summary structure
 */
export type TechnicalSummary = {
  detail: string;
  oversold_count: number;
  above_upper_band: number;
  below_lower_band: number;
  overbought_count: number;
};

/**
 * Holdings grade change structure
 */
export type HoldingsGradeChange = {
  detail: string;
  upgraded_count: number;
  unchanged_count: number;
  avg_score_change: number;
  downgraded_count: number;
};

/**
 * Performance attribution item
 */
export type PerformanceAttribution = {
  factor: string;
  sector: string;
  direction: string;
  contribution: number;
};

/**
 * Rebalancing trigger item
 */
export type RebalancingTrigger = {
  detail: string;
  status: string;
  trigger_id: string;
  trigger_name: string;
};

/**
 * Rebalancing status structure
 */
export type RebalancingStatus = {
  summary: string;
  buy_count: number;
  sell_count: number;
  action_type: string;
  action_taken: boolean;
  next_condition: string;
  triggers_checked: RebalancingTrigger[];
};

/**
 * Statistics structure
 */
export type ReportStatistics = {
  win_rate: number;
  stock_count: number;
  max_drawdown: number;
  sector_count: number;
  losing_stocks: number;
  volatility_30d: number;
  winning_stocks: number;
  current_drawdown: number;
  sharpe_ratio_30d: number;
};

/**
 * Daily report data structure from portfolio_daily_performance.daily_report (JSONB)
 * Version 2.0 structure
 */
export type DailyReportData = {
  version?: string;
  report_date?: string;
  portfolio_summary?: PortfolioSummary;
  performance_attribution?: PerformanceAttribution[];
  healthy_signals?: SignalItem[];
  watch_signals?: SignalItem[];
  risk_signals?: SignalItem[];
  market_sentiment?: MarketSentiment;
  holdings_flow?: HoldingsFlow;
  technical_summary?: TechnicalSummary;
  holdings_grade_change?: HoldingsGradeChange;
  rebalancing_status?: RebalancingStatus;
  report_generated_at?: string;
  statistics?: ReportStatistics;
};

/**
 * Helper function to get portfolio country for TTL calculation
 */
async function getPortfolioCountry(portfolioId: string): Promise<'KR' | 'US' | null> {
  const result = await db
    .select({ country: portfolioMaster.country })
    .from(portfolioMaster)
    .where(eq(portfolioMaster.portfolioId, portfolioId))
    .limit(1);

  if (result.length > 0 && result[0].country) {
    return result[0].country as 'KR' | 'US';
  }
  return null;
}

export type PortfolioListItem = {
  portfolioId: string;
  portfolioName: string;
  country: string;
  initialBudget: number;
  benchmark: string | null;
  analysisDate: string | null;
  cumulativeReturn: string | null;
  benchmarkCumulativeReturn: string | null;
};

/**
 * Get list of LIVE portfolios with their latest performance data
 * 최적화: N+1 쿼리 문제 해결 (1 + N → 2개 쿼리로 축소)
 * 캐싱: Redis (KR 시장 기준 TTL)
 */
export async function getPortfolioList(country: 'KR' | 'US'): Promise<PortfolioListItem[]> {
  const cacheKey = CacheKeys.portfolioList(country);

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

  // 쿼리 1: 해당 국가의 LIVE 포트폴리오 조회
  const portfolios = await db
    .select({
      portfolioId: portfolioMaster.portfolioId,
      portfolioName: portfolioMaster.portfolioName,
      country: portfolioMaster.country,
      initialBudget: portfolioMaster.initialBudget,
      benchmark: portfolioMaster.benchmark,
      analysisDate: portfolioMaster.analysisDate,
    })
    .from(portfolioMaster)
    .where(and(eq(portfolioMaster.status, 'LIVE'), eq(portfolioMaster.country, country)))
    .orderBy(desc(portfolioMaster.analysisDate));

  // 포트폴리오가 없으면 빈 배열 반환
  if (portfolios.length === 0) {
    return [];
  }

  const portfolioIds = portfolios.map((p) => p.portfolioId);

  // 쿼리 2: 모든 포트폴리오의 최신 성과 데이터를 한 번에 조회 (윈도우 함수 사용)
  const performanceData = await db
    .select({
      portfolioId: portfolioDailyPerformance.portfolioId,
      cumulativeReturn: portfolioDailyPerformance.cumulativeReturn,
      benchmarkCumulativeReturn: portfolioDailyPerformance.benchmarkCumulativeReturn,
      rowNum: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${portfolioDailyPerformance.portfolioId} ORDER BY ${portfolioDailyPerformance.date} DESC)`.as('row_num'),
    })
    .from(portfolioDailyPerformance)
    .where(inArray(portfolioDailyPerformance.portfolioId, portfolioIds));

  // 각 포트폴리오의 최신 데이터만 필터링 (rowNum === 1)
  // Note: ROW_NUMBER() returns bigint from PostgreSQL, which may be serialized as string or bigint
  const performanceMap = new Map<
    string,
    { cumulativeReturn: string | null; benchmarkCumulativeReturn: string | null }
  >();
  for (const row of performanceData) {
    if (Number(row.rowNum) === 1) {
      performanceMap.set(row.portfolioId, {
        cumulativeReturn: row.cumulativeReturn,
        benchmarkCumulativeReturn: row.benchmarkCumulativeReturn,
      });
    }
  }

  // 결과 조합
  const result = portfolios.map((portfolio) => {
    const performance = performanceMap.get(portfolio.portfolioId);
    return {
      portfolioId: portfolio.portfolioId,
      portfolioName: portfolio.portfolioName,
      country: portfolio.country,
      initialBudget: portfolio.initialBudget,
      benchmark: portfolio.benchmark,
      analysisDate: portfolio.analysisDate,
      cumulativeReturn: performance?.cumulativeReturn ?? null,
      benchmarkCumulativeReturn: performance?.benchmarkCumulativeReturn ?? null,
    };
  });

  // Store in cache with market-specific TTL
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

export type PortfolioDetail = {
  portfolioId: string;
  portfolioName: string;
  country: string;
  analysisDate: string | null;
  initialBudget: number;
  benchmark: string | null;
  totalPortfolioValue: string | null;
  cumulativeReturn: string | null;
  benchmarkCumulativeReturn: string | null;
  stockCount: number | null;
  dailyReport: DailyReportData | null;
  reportDate: string | null;
};

/**
 * Get portfolio detail by ID with latest performance data
 * 캐싱: Redis (포트폴리오 country 기준 TTL)
 */
export async function getPortfolioDetail(portfolioId: string): Promise<PortfolioDetail | null> {
  const cacheKey = CacheKeys.portfolioDetail(portfolioId);

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

  const portfolio = await db
    .select({
      portfolioId: portfolioMaster.portfolioId,
      portfolioName: portfolioMaster.portfolioName,
      country: portfolioMaster.country,
      analysisDate: portfolioMaster.analysisDate,
      initialBudget: portfolioMaster.initialBudget,
      benchmark: portfolioMaster.benchmark,
    })
    .from(portfolioMaster)
    .where(eq(portfolioMaster.portfolioId, portfolioId))
    .limit(1);

  if (portfolio.length === 0) {
    return null;
  }

  // 쿼리 1: 최신 성과 데이터 (포트폴리오 현황용)
  const performance = await db
    .select({
      totalPortfolioValue: portfolioDailyPerformance.totalPortfolioValue,
      cumulativeReturn: portfolioDailyPerformance.cumulativeReturn,
      benchmarkCumulativeReturn: portfolioDailyPerformance.benchmarkCumulativeReturn,
      stockCount: portfolioDailyPerformance.stockCount,
    })
    .from(portfolioDailyPerformance)
    .where(eq(portfolioDailyPerformance.portfolioId, portfolioId))
    .orderBy(desc(portfolioDailyPerformance.date))
    .limit(1);

  // 쿼리 2: 일일 리포트 - daily_report가 존재하는 데이터 중 최신
  const reportData = await db
    .select({
      dailyReport: portfolioDailyPerformance.dailyReport,
      date: portfolioDailyPerformance.date,
    })
    .from(portfolioDailyPerformance)
    .where(
      and(
        eq(portfolioDailyPerformance.portfolioId, portfolioId),
        sql`${portfolioDailyPerformance.dailyReport} IS NOT NULL`
      )
    )
    .orderBy(desc(portfolioDailyPerformance.date))
    .limit(1);

  const result = {
    portfolioId: portfolio[0].portfolioId,
    portfolioName: portfolio[0].portfolioName,
    country: portfolio[0].country,
    analysisDate: portfolio[0].analysisDate,
    initialBudget: portfolio[0].initialBudget,
    benchmark: portfolio[0].benchmark,
    totalPortfolioValue: performance[0]?.totalPortfolioValue ?? null,
    cumulativeReturn: performance[0]?.cumulativeReturn ?? null,
    benchmarkCumulativeReturn: performance[0]?.benchmarkCumulativeReturn ?? null,
    stockCount: performance[0]?.stockCount ?? null,
    dailyReport: reportData[0]?.dailyReport ?? null,
    reportDate: reportData[0]?.date ?? null,
  };

  // Store in cache
  if (redis) {
    try {
      const market = (portfolio[0].country as 'KR' | 'US') || 'KR';
      const ttl = calculateTTL(market);
      await redis.set(cacheKey, JSON.stringify(result), { EX: ttl });
    } catch {
      // Cache write error - ignore
    }
  }

  return result;
}

export type PortfolioHoldingItem = {
  symbol: string;
  stockName: string | null;
  currentPrice: string | null;
  shares: number | null;
  cumulativeReturn: string | null;
  finalGrade: string | null;
  valueScore: string | null;
  qualityScore: string | null;
  momentumScore: string | null;
  growthScore: string | null;
};

/**
 * Get portfolio holdings with grade scores
 * 최적화: N+2 쿼리 문제 해결 (1 + 2N → 3개 쿼리로 축소)
 * 캐싱: Redis (country 기준 TTL)
 */
export async function getPortfolioHoldings(
  portfolioId: string,
  country: string
): Promise<PortfolioHoldingItem[]> {
  const cacheKey = CacheKeys.portfolioHoldings(portfolioId);

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

  // 쿼리 1: 모든 보유 종목 조회
  const holdings = await db
    .select({
      symbol: portfolioHoldings.symbol,
      stockName: portfolioHoldings.stockName,
      currentPrice: portfolioHoldings.currentPrice,
      shares: portfolioHoldings.shares,
    })
    .from(portfolioHoldings)
    .where(
      and(
        eq(portfolioHoldings.portfolioId, portfolioId),
        eq(portfolioHoldings.status, 'ACTIVE')
      )
    );

  // 보유 종목이 없으면 빈 배열 반환
  if (holdings.length === 0) {
    return [];
  }

  const symbols = holdings.map((h) => h.symbol);

  // 쿼리 2: 모든 종목의 최신 누적수익률을 한 번에 조회 (윈도우 함수 사용)
  const stockDailyData = await db
    .select({
      symbol: portfolioStockDaily.symbol,
      cumulativeReturn: portfolioStockDaily.cumulativeReturn,
      rowNum: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${portfolioStockDaily.symbol} ORDER BY ${portfolioStockDaily.date} DESC)`.as('row_num'),
    })
    .from(portfolioStockDaily)
    .where(
      and(
        eq(portfolioStockDaily.portfolioId, portfolioId),
        inArray(portfolioStockDaily.symbol, symbols)
      )
    );

  // 각 종목의 최신 데이터만 필터링 (rowNum === 1)
  // Note: ROW_NUMBER() returns bigint from PostgreSQL, which may be serialized as string or bigint
  const cumulativeReturnMap = new Map<string, string | null>();
  for (const row of stockDailyData) {
    if (Number(row.rowNum) === 1) {
      cumulativeReturnMap.set(row.symbol, row.cumulativeReturn);
    }
  }

  // 쿼리 3: 모든 종목의 최신 등급 정보를 한 번에 조회 (윈도우 함수 사용)
  const gradeTable = country === 'KR' ? krStockGrade : usStockGrade;
  const gradeData = await db
    .select({
      symbol: gradeTable.symbol,
      finalGrade: gradeTable.finalGrade,
      valueScore: gradeTable.valueScore,
      qualityScore: gradeTable.qualityScore,
      momentumScore: gradeTable.momentumScore,
      growthScore: gradeTable.growthScore,
      rowNum: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${gradeTable.symbol} ORDER BY ${gradeTable.date} DESC)`.as('row_num'),
    })
    .from(gradeTable)
    .where(inArray(gradeTable.symbol, symbols));

  // 각 종목의 최신 등급만 필터링 (rowNum === 1)
  // Note: ROW_NUMBER() returns bigint from PostgreSQL, which may be serialized as string or bigint
  const gradeMap = new Map<
    string,
    {
      finalGrade: string | null;
      valueScore: string | null;
      qualityScore: string | null;
      momentumScore: string | null;
      growthScore: string | null;
    }
  >();
  for (const row of gradeData) {
    if (Number(row.rowNum) === 1) {
      gradeMap.set(row.symbol, {
        finalGrade: row.finalGrade,
        valueScore: row.valueScore,
        qualityScore: row.qualityScore,
        momentumScore: row.momentumScore,
        growthScore: row.growthScore,
      });
    }
  }

  // 결과 조합
  const result = holdings.map((holding) => {
    const grade = gradeMap.get(holding.symbol);
    return {
      symbol: holding.symbol,
      stockName: holding.stockName,
      currentPrice: holding.currentPrice,
      shares: holding.shares,
      cumulativeReturn: cumulativeReturnMap.get(holding.symbol) ?? null,
      finalGrade: grade?.finalGrade ?? null,
      valueScore: grade?.valueScore ?? null,
      qualityScore: grade?.qualityScore ?? null,
      momentumScore: grade?.momentumScore ?? null,
      growthScore: grade?.growthScore ?? null,
    };
  });

  // Store in cache
  if (redis && result.length > 0) {
    try {
      const market = (country as 'KR' | 'US') || 'KR';
      const ttl = calculateTTL(market);
      await redis.set(cacheKey, JSON.stringify(result), { EX: ttl });
    } catch {
      // Cache write error - ignore
    }
  }

  return result;
}

export type PortfolioChartDataPoint = {
  time: string;
  cumulativeReturn: number;
  benchmarkCumulativeReturn: number;
};

/**
 * Calculate start date based on time range
 * Returns null for '최대' to indicate no date filtering
 */
function getStartDateForRange(range: ChartTimeRange): Date | null {
  if (range === '최대') {
    return null;
  }

  const now = new Date();
  const result = new Date(now);

  switch (range) {
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
      return null;
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
 * Get portfolio chart data for performance visualization
 * Returns cumulative return and benchmark cumulative return over time
 * 캐싱: Redis (포트폴리오 country 기준 TTL)
 */
export async function getPortfolioChartData(
  portfolioId: string,
  range: ChartTimeRange = '최대'
): Promise<PortfolioChartDataPoint[]> {
  const cacheKey = CacheKeys.portfolioChart(portfolioId, range);

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

  const startDate = getStartDateForRange(range);

  let dbResult;
  if (startDate === null) {
    // '최대' - no date filtering
    dbResult = await db
      .select({
        date: portfolioDailyPerformance.date,
        cumulativeReturn: portfolioDailyPerformance.cumulativeReturn,
        benchmarkCumulativeReturn: portfolioDailyPerformance.benchmarkCumulativeReturn,
      })
      .from(portfolioDailyPerformance)
      .where(eq(portfolioDailyPerformance.portfolioId, portfolioId))
      .orderBy(portfolioDailyPerformance.date);
  } else {
    const startDateStr = formatDateString(startDate);
    dbResult = await db
      .select({
        date: portfolioDailyPerformance.date,
        cumulativeReturn: portfolioDailyPerformance.cumulativeReturn,
        benchmarkCumulativeReturn: portfolioDailyPerformance.benchmarkCumulativeReturn,
      })
      .from(portfolioDailyPerformance)
      .where(
        and(
          eq(portfolioDailyPerformance.portfolioId, portfolioId),
          gte(portfolioDailyPerformance.date, startDateStr)
        )
      )
      .orderBy(portfolioDailyPerformance.date);
  }

  const result = dbResult
    .filter((row) => row.cumulativeReturn !== null && row.benchmarkCumulativeReturn !== null)
    .map((row) => ({
      time: row.date,
      cumulativeReturn: parseFloat(row.cumulativeReturn!),
      benchmarkCumulativeReturn: parseFloat(row.benchmarkCumulativeReturn!),
    }));

  // Store in cache
  if (redis && result.length > 0) {
    try {
      // Get portfolio country for TTL calculation
      const country = await getPortfolioCountry(portfolioId);
      const market = country || 'KR';
      const ttl = calculateTTL(market);
      await redis.set(cacheKey, JSON.stringify(result), { EX: ttl });
    } catch {
      // Cache write error - ignore
    }
  }

  return result;
}

/**
 * Rebalancing report data type
 * report 컬럼의 JSONB 구조
 */
export type RebalancingReportData = Record<string, unknown>;

export type RebalancingReport = {
  rebalancingId: string;
  portfolioId: string;
  planDate: string | null;
  status: string | null;
  report: RebalancingReportData | null;
};

/**
 * Get the latest rebalancing report for a portfolio
 * 항상 존재하는 데이터 중 최신 데이터를 반환
 * 캐싱: Redis (포트폴리오 country 기준 TTL)
 */
export async function getRebalancingReport(
  portfolioId: string
): Promise<RebalancingReport | null> {
  const cacheKey = CacheKeys.portfolioRebalancing(portfolioId);

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

  // Query the latest rebalancing record for this portfolio (report IS NOT NULL)
  const result = await db
    .select({
      rebalancingId: portfolioRebalancing.rebalancingId,
      portfolioId: portfolioRebalancing.portfolioId,
      planDate: portfolioRebalancing.planDate,
      status: portfolioRebalancing.status,
      report: portfolioRebalancing.report,
    })
    .from(portfolioRebalancing)
    .where(
      and(
        eq(portfolioRebalancing.portfolioId, portfolioId),
        sql`${portfolioRebalancing.report} IS NOT NULL`
      )
    )
    .orderBy(desc(portfolioRebalancing.planDate))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const rebalancingData: RebalancingReport = {
    rebalancingId: result[0].rebalancingId,
    portfolioId: result[0].portfolioId,
    planDate: result[0].planDate,
    status: result[0].status,
    report: result[0].report as RebalancingReportData | null,
  };

  // Store in cache
  if (redis) {
    try {
      const country = await getPortfolioCountry(portfolioId);
      const market = country || 'KR';
      const ttl = calculateTTL(market);
      await redis.set(cacheKey, JSON.stringify(rebalancingData), { EX: ttl });
    } catch {
      // Cache write error - ignore
    }
  }

  return rebalancingData;
}
