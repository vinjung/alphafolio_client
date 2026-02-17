import { db } from '@/lib/server/db';
import { getCurrentSession } from '@/lib/server/session';
import {
  favorites,
  portfolioMaster,
  portfolioDailyPerformance,
  krIntradayTotal,
  usDaily,
  usStockBasic,
  krStockGrade,
  usStockGrade,
} from '@schema';
import { eq, and, desc } from 'drizzle-orm';

export type FavoriteItemType = 'PORTFOLIO' | 'STOCK';

export type ToggleFavoriteResult = {
  success: boolean;
  isFavorite: boolean;
  message: string;
};

export type FavoritePortfolioItem = {
  portfolioId: string;
  portfolioName: string;
  country: string;
  initialBudget: number;
  benchmark: string | null;
  analysisDate: string | null;
  cumulativeReturn: string | null;
  benchmarkCumulativeReturn: string | null;
};

export type FavoriteStockItem = {
  symbol: string;
  stockName: string | null;
  country: 'KR' | 'US';
  currentPrice: string | null;
  cumulativeReturn: string | null;
  finalGrade: string | null;
  valueScore: string | null;
  qualityScore: string | null;
  momentumScore: string | null;
  growthScore: string | null;
};

/**
 * Toggle favorite status for an item
 * If already favorited, remove it. Otherwise, add it.
 */
export async function toggleFavorite(
  itemType: FavoriteItemType,
  itemId: string
): Promise<ToggleFavoriteResult> {
  const { user } = await getCurrentSession();

  if (!user) {
    return {
      success: false,
      isFavorite: false,
      message: '로그인이 필요합니다.',
    };
  }

  // Check if already favorited
  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, user.id),
        eq(favorites.itemType, itemType),
        eq(favorites.itemId, itemId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Remove favorite
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return {
      success: true,
      isFavorite: false,
      message: '즐겨찾기에서 제거되었습니다.',
    };
  } else {
    // Add favorite
    await db.insert(favorites).values({
      userId: user.id,
      itemType,
      itemId,
    });
    return {
      success: true,
      isFavorite: true,
      message: '즐겨찾기에 추가되었습니다.',
    };
  }
}

/**
 * Check if an item is favorited by the current user
 */
export async function checkFavoriteStatus(
  itemType: FavoriteItemType,
  itemId: string
): Promise<boolean> {
  const { user } = await getCurrentSession();

  if (!user) {
    return false;
  }

  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, user.id),
        eq(favorites.itemType, itemType),
        eq(favorites.itemId, itemId)
      )
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * Get all favorited portfolios for the current user
 */
export async function getFavoritePortfolios(): Promise<FavoritePortfolioItem[]> {
  const { user } = await getCurrentSession();

  if (!user) {
    return [];
  }

  // Get favorite portfolio IDs
  const favoriteItems = await db
    .select({ itemId: favorites.itemId })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, user.id),
        eq(favorites.itemType, 'PORTFOLIO')
      )
    )
    .orderBy(desc(favorites.createdAt));

  if (favoriteItems.length === 0) {
    return [];
  }

  const result: FavoritePortfolioItem[] = [];

  for (const item of favoriteItems) {
    // Get portfolio info
    const portfolio = await db
      .select({
        portfolioId: portfolioMaster.portfolioId,
        portfolioName: portfolioMaster.portfolioName,
        country: portfolioMaster.country,
        initialBudget: portfolioMaster.initialBudget,
        benchmark: portfolioMaster.benchmark,
        analysisDate: portfolioMaster.analysisDate,
      })
      .from(portfolioMaster)
      .where(eq(portfolioMaster.portfolioId, item.itemId))
      .limit(1);

    if (portfolio.length === 0) {
      continue;
    }

    // Get latest performance
    const performance = await db
      .select({
        cumulativeReturn: portfolioDailyPerformance.cumulativeReturn,
        benchmarkCumulativeReturn: portfolioDailyPerformance.benchmarkCumulativeReturn,
      })
      .from(portfolioDailyPerformance)
      .where(eq(portfolioDailyPerformance.portfolioId, item.itemId))
      .orderBy(desc(portfolioDailyPerformance.date))
      .limit(1);

    result.push({
      portfolioId: portfolio[0].portfolioId,
      portfolioName: portfolio[0].portfolioName,
      country: portfolio[0].country,
      initialBudget: portfolio[0].initialBudget,
      benchmark: portfolio[0].benchmark,
      analysisDate: portfolio[0].analysisDate,
      cumulativeReturn: performance[0]?.cumulativeReturn ?? null,
      benchmarkCumulativeReturn: performance[0]?.benchmarkCumulativeReturn ?? null,
    });
  }

  return result;
}

/**
 * Get all favorited stocks for the current user
 * Returns stock info with grade data for PortfolioTable compatibility
 */
export async function getFavoriteStocks(): Promise<FavoriteStockItem[]> {
  const { user } = await getCurrentSession();

  if (!user) {
    return [];
  }

  // Get favorite stock symbols
  const favoriteItems = await db
    .select({ itemId: favorites.itemId })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, user.id),
        eq(favorites.itemType, 'STOCK')
      )
    )
    .orderBy(desc(favorites.createdAt));

  if (favoriteItems.length === 0) {
    return [];
  }

  const result: FavoriteStockItem[] = [];

  for (const item of favoriteItems) {
    const symbol = item.itemId;

    // Try KR stock first
    const krStock = await db
      .select({
        symbol: krIntradayTotal.symbol,
        stockName: krIntradayTotal.stockName,
        close: krIntradayTotal.close,
        changeRate: krIntradayTotal.changeRate,
      })
      .from(krIntradayTotal)
      .where(eq(krIntradayTotal.symbol, symbol))
      .orderBy(desc(krIntradayTotal.date))
      .limit(1);

    if (krStock.length > 0) {
      // Get KR stock grade
      const krGrade = await db
        .select({
          finalGrade: krStockGrade.finalGrade,
          valueScore: krStockGrade.valueScore,
          qualityScore: krStockGrade.qualityScore,
          momentumScore: krStockGrade.momentumScore,
          growthScore: krStockGrade.growthScore,
        })
        .from(krStockGrade)
        .where(eq(krStockGrade.symbol, symbol))
        .orderBy(desc(krStockGrade.date))
        .limit(1);

      result.push({
        symbol: krStock[0].symbol,
        stockName: krStock[0].stockName,
        country: 'KR',
        currentPrice: krStock[0].close,
        cumulativeReturn: krStock[0].changeRate,
        finalGrade: krGrade[0]?.finalGrade ?? null,
        valueScore: krGrade[0]?.valueScore ?? null,
        qualityScore: krGrade[0]?.qualityScore ?? null,
        momentumScore: krGrade[0]?.momentumScore ?? null,
        growthScore: krGrade[0]?.growthScore ?? null,
      });
      continue;
    }

    // Try US stock
    const usStock = await db
      .select({
        symbol: usDaily.symbol,
        close: usDaily.close,
        changeRate: usDaily.changeRate,
      })
      .from(usDaily)
      .where(eq(usDaily.symbol, symbol))
      .orderBy(desc(usDaily.date))
      .limit(1);

    if (usStock.length > 0) {
      // Get stock name from us_stock_basic
      const usBasic = await db
        .select({ stockName: usStockBasic.stockName })
        .from(usStockBasic)
        .where(eq(usStockBasic.symbol, symbol))
        .limit(1);

      // Get US stock grade
      const usGrade = await db
        .select({
          finalGrade: usStockGrade.finalGrade,
          valueScore: usStockGrade.valueScore,
          qualityScore: usStockGrade.qualityScore,
          momentumScore: usStockGrade.momentumScore,
          growthScore: usStockGrade.growthScore,
        })
        .from(usStockGrade)
        .where(eq(usStockGrade.symbol, symbol))
        .orderBy(desc(usStockGrade.date))
        .limit(1);

      result.push({
        symbol: usStock[0].symbol,
        stockName: usBasic[0]?.stockName ?? null,
        country: 'US',
        currentPrice: usStock[0].close,
        cumulativeReturn: usStock[0].changeRate,
        finalGrade: usGrade[0]?.finalGrade ?? null,
        valueScore: usGrade[0]?.valueScore ?? null,
        qualityScore: usGrade[0]?.qualityScore ?? null,
        momentumScore: usGrade[0]?.momentumScore ?? null,
        growthScore: usGrade[0]?.growthScore ?? null,
      });
    }
  }

  return result;
}
