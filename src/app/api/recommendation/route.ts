import { NextRequest, NextResponse } from 'next/server';
import { getDailyRecommendations } from '@/lib/server/recommendation';

export const revalidate = 60;

/**
 * GET /api/recommendation?country=KR
 * Get daily recommendations by country (KR or US)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country')?.toUpperCase();

    if (country !== 'KR' && country !== 'US') {
      return NextResponse.json(
        { error: 'Invalid country. Must be KR or US.' },
        { status: 400 }
      );
    }

    const recommendations = await getDailyRecommendations(country);

    return NextResponse.json(
      { data: recommendations },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
