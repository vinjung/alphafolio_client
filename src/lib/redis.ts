/**
 * Redis client for server-side caching
 * Uses cache_redis (Index 0) for stock-detail page data
 *
 * When Redis is not available, functions return null and the app
 * falls back to direct DB queries (graceful degradation).
 */
import { createClient, RedisClientType } from 'redis';

// Redis database indices
const REDIS_DB = {
  CACHE: 0,    // stock-detail caching
  TASK: 1,     // agent execution state
  STREAM: 2,   // AI chat streaming
  RESULT: 3,   // agent execution results
};

let cacheRedis: RedisClientType | null = null;
let redisDisabled = false;

/**
 * Get Redis client for caching (Index 0)
 * Returns null if Redis is not available (graceful degradation)
 */
export async function getCacheRedis(): Promise<RedisClientType | null> {
  // Skip if Redis is disabled (previous connection failed)
  if (redisDisabled) {
    return null;
  }

  // Return existing connected client
  if (cacheRedis?.isOpen) {
    return cacheRedis;
  }

  // No REDIS_URL in development = skip Redis
  if (!process.env.REDIS_URL) {
    redisDisabled = true;
    return null;
  }

  try {
    const client = createClient({
      url: `${process.env.REDIS_URL}/${REDIS_DB.CACHE}`,
      socket: {
        connectTimeout: 3000,  // 3 second timeout
        reconnectStrategy: false,  // Disable auto-reconnect
      },
    });

    // Suppress error logs (we handle errors gracefully)
    client.on('error', () => {});

    await client.connect();
    cacheRedis = client as RedisClientType;
    return cacheRedis;
  } catch {
    // Connection failed - disable Redis for this session
    console.warn('[Redis] Not available - using DB fallback');
    redisDisabled = true;
    return null;
  }
}

/**
 * Calculate TTL (time-to-live) in seconds until cache expiration.
 * All times are calculated in KST (UTC+9) regardless of server timezone.
 *
 * Korean market (KR):
 * - Expires at 19:59 KST (data updates at 20:00 KST)
 * - Same day if before 19:59, next business day if after
 *
 * US market (US):
 * - Expires at 15:29 KST (data updates at 15:30 KST)
 * - Same day if before 15:29, next business day if after
 */
export function calculateTTL(market: 'KR' | 'US'): number {
  const now = new Date();

  // Convert to KST (UTC+9)
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kstMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000 + KST_OFFSET_MS;
  const kstNow = new Date(kstMs);

  const weekday = kstNow.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const expireHour = market === 'KR' ? 19 : 15;
  const expireMinute = market === 'KR' ? 59 : 29;

  const currentMinutes = kstNow.getHours() * 60 + kstNow.getMinutes();
  const expireMinutesOfDay = expireHour * 60 + expireMinute;
  const isPastExpiry = currentMinutes >= expireMinutesOfDay;

  let daysToAdd: number;

  if (market === 'US') {
    // US data updates Tue-Sat at 15:30 KST (no update on Monday)
    if (weekday === 6 && isPastExpiry) {
      // Saturday after 15:29 → Tuesday
      daysToAdd = 3;
    } else if (weekday === 0) {
      // Sunday → Tuesday
      daysToAdd = 2;
    } else if (weekday === 1) {
      // Monday (no update) → Tuesday
      daysToAdd = 1;
    } else {
      // Tue-Sat: same day if before expiry, next day if after
      daysToAdd = isPastExpiry ? 1 : 0;
    }
  } else {
    // KR data updates Mon-Fri at 20:00 KST
    if (weekday === 6) {
      daysToAdd = 2;
    } else if (weekday === 0) {
      daysToAdd = 1;
    } else if (weekday === 5 && isPastExpiry) {
      daysToAdd = 3;
    } else {
      daysToAdd = isPastExpiry ? 1 : 0;
    }
  }

  // Calculate expire time in KST
  const expireKst = new Date(kstNow);
  expireKst.setDate(expireKst.getDate() + daysToAdd);
  expireKst.setHours(expireHour, expireMinute, 0, 0);

  const ttlMs = expireKst.getTime() - kstNow.getTime();
  const ttlSeconds = Math.floor(ttlMs / 1000);

  // Ensure minimum TTL of 60 seconds
  return Math.max(ttlSeconds, 60);
}

/**
 * Calculate TTL for stock-detail page.
 * KR stocks refresh every 30 minutes during market hours.
 *
 * Korean market (KR):
 * - Market hours: 9:29, 9:59, 10:29, 10:59, 11:29, 11:59,
 *   12:29, 12:59, 13:29, 13:59, 14:29, 14:59, 15:29, 15:59, 19:59
 * - After 19:59: next business day 9:29
 *
 * US market (US):
 * - Expires at 15:29 KST (same as calculateTTL)
 */
export function calculateStockDetailTTL(market: 'KR' | 'US'): number {
  if (market === 'US') {
    return calculateTTL('US');
  }

  const KR_SCHEDULE: [number, number][] = [
    [9, 29], [9, 59], [10, 29], [10, 59],
    [11, 29], [11, 59], [12, 29], [12, 59],
    [13, 29], [13, 59], [14, 29], [14, 59],
    [15, 29], [15, 59], [19, 59],
  ];

  const now = new Date();
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kstMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000 + KST_OFFSET_MS;
  const kstNow = new Date(kstMs);

  const weekday = kstNow.getDay();
  const currentMinutes = kstNow.getHours() * 60 + kstNow.getMinutes();

  // Weekend → Monday 9:29
  if (weekday === 0 || weekday === 6) {
    const daysToMonday = weekday === 0 ? 1 : 2;
    const expireKst = new Date(kstNow);
    expireKst.setDate(expireKst.getDate() + daysToMonday);
    expireKst.setHours(9, 29, 0, 0);
    return Math.max(Math.floor((expireKst.getTime() - kstNow.getTime()) / 1000), 60);
  }

  // Weekday: find next schedule time
  for (const [h, m] of KR_SCHEDULE) {
    if (currentMinutes < h * 60 + m) {
      const expireKst = new Date(kstNow);
      expireKst.setHours(h, m, 0, 0);
      return Math.max(Math.floor((expireKst.getTime() - kstNow.getTime()) / 1000), 60);
    }
  }

  // Past 19:59 → next business day 9:29
  const daysToAdd = weekday === 5 ? 3 : 1;
  const expireKst = new Date(kstNow);
  expireKst.setDate(expireKst.getDate() + daysToAdd);
  expireKst.setHours(9, 29, 0, 0);
  return Math.max(Math.floor((expireKst.getTime() - kstNow.getTime()) / 1000), 60);
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  // Stock related keys
  stockDetail: (symbol: string) => `stock:detail:${symbol.toUpperCase()}`,
  stockChart: (symbol: string, range: string) => `stock:chart:${symbol.toUpperCase()}:${range}`,
  stockStrategy: (symbol: string) => `stock:strategy:${symbol.toUpperCase()}`,
  // Recommendation related keys
  recommendation: (country: string) => `recommendation:daily:${country.toUpperCase()}`,
  // Portfolio related keys
  portfolioList: (country: 'KR' | 'US') => `portfolio:list:${country}`,
  portfolioDetail: (portfolioId: string) => `portfolio:detail:${portfolioId}`,
  portfolioHoldings: (portfolioId: string) => `portfolio:holdings:${portfolioId}`,
  portfolioChart: (portfolioId: string, range: string) => `portfolio:chart:${portfolioId}:${range}`,
  portfolioRebalancing: (portfolioId: string) => `portfolio:rebalancing:${portfolioId}`,
};

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedis(): Promise<void> {
  if (cacheRedis) {
    await cacheRedis.quit();
    cacheRedis = null;
  }
}
