import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioChartData, ChartTimeRange } from '@/lib/server/portfolio';

const VALID_RANGES: ChartTimeRange[] = ['최대', '1년', '6개월', '3개월', '1개월'];

/**
 * GET /api/portfolio/chart?portfolioId=xxx&range=1주
 * Fetch chart data for portfolio performance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const range = searchParams.get('range') as ChartTimeRange | null;

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'portfolioId is required' },
        { status: 400 }
      );
    }

    const timeRange: ChartTimeRange =
      range && VALID_RANGES.includes(range) ? range : '최대';

    const chartData = await getPortfolioChartData(portfolioId, timeRange);

    return NextResponse.json(
      { data: chartData },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Portfolio chart data fetch failed:', error);

    return NextResponse.json(
      { error: 'Failed to fetch portfolio chart data' },
      { status: 500 }
    );
  }
}
