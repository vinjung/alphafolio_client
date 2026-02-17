import { NextRequest, NextResponse } from 'next/server';
import { getStockDetail } from '@/lib/server/stock';

export const revalidate = 60;

/**
 * GET /api/stock/grade?symbol=005930
 * Fetch stock detail data (basic, grade, price)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const stockData = await getStockDetail(symbol);

    if (!stockData) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: stockData },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Stock grade data fetch failed:', error);

    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
