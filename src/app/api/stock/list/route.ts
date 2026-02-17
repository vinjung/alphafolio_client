import { NextResponse } from 'next/server';
import { getAllStocksForSearch } from '@/lib/server/stock';

export const revalidate = 3600;

/**
 * GET /api/stock/list
 * Get all stocks for client-side search caching
 * Cached for 1 hour (stock basic info rarely changes)
 */
export async function GET() {
  try {
    const stocks = await getAllStocksForSearch();

    return NextResponse.json(
      { data: stocks },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch stock list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock list' },
      { status: 500 }
    );
  }
}
