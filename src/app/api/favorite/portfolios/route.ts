import { NextResponse } from 'next/server';
import { getFavoritePortfolios } from '@/lib/server/favorite';

export async function GET() {
  try {
    const portfolios = await getFavoritePortfolios();

    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error('Error getting favorite portfolios:', error);
    return NextResponse.json(
      { error: 'Internal server error', portfolios: [] },
      { status: 500 }
    );
  }
}
