import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/server/session';
import { getStockGradeHistory } from '@/lib/server/stock';

export const revalidate = 60;

/**
 * GET /api/stock/grade-history?symbol=005930
 * Returns the most recent 10 grade history records (date + finalGrade)
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const history = await getStockGradeHistory(symbol, 10);

    return NextResponse.json(
      { data: history },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Grade history fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grade history' },
      { status: 500 }
    );
  }
}
