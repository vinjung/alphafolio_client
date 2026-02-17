import { NextRequest, NextResponse } from 'next/server';
import { getStockChartData, ChartTimeRange, Market, IndicatorType } from '@/lib/server/stock';

const VALID_RANGES: ChartTimeRange[] = ['1주', '1개월', '3개월', '6개월', '1년'];
const VALID_MARKETS: Market[] = ['KR', 'US'];
const VALID_INDICATORS: IndicatorType[] = ['none', 'rsi', 'macd', 'stochastic', 'bollinger', 'adx', 'cci', 'mfi', 'obv', 'atr'];

/**
 * GET /api/stock/chart?symbol=005930&range=1주&market=KR&indicator=rsi
 * Fetch chart data for Korean or US stocks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const range = searchParams.get('range') as ChartTimeRange | null;
    const marketParam = searchParams.get('market') as Market | null;
    const indicatorParam = searchParams.get('indicator') as IndicatorType | null;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const timeRange: ChartTimeRange =
      range && VALID_RANGES.includes(range) ? range : '1주';
    const market: Market =
      marketParam && VALID_MARKETS.includes(marketParam) ? marketParam : 'KR';
    const indicator: IndicatorType =
      indicatorParam && VALID_INDICATORS.includes(indicatorParam) ? indicatorParam : 'none';

    const chartData = await getStockChartData(symbol, timeRange, market, indicator);

    return NextResponse.json(
      { data: chartData.data, ohlc: chartData.ohlc, indicators: chartData.indicators },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Chart data fetch failed:', error);

    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
