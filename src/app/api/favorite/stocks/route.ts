import { NextResponse } from 'next/server';
import { getFavoriteStocks } from '@/lib/server/favorite';

export async function GET() {
  try {
    const stocks = await getFavoriteStocks();

    return NextResponse.json({ stocks });
  } catch (error) {
    console.error('Error getting favorite stocks:', error);
    return NextResponse.json(
      { error: 'Internal server error', stocks: [] },
      { status: 500 }
    );
  }
}
