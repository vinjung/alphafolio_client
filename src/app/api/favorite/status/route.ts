import { NextRequest, NextResponse } from 'next/server';
import { checkFavoriteStatus, FavoriteItemType } from '@/lib/server/favorite';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itemType = searchParams.get('itemType') as FavoriteItemType | null;
    const itemId = searchParams.get('itemId');

    // Validate input
    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'itemType and itemId are required' },
        { status: 400 }
      );
    }

    if (itemType !== 'PORTFOLIO' && itemType !== 'STOCK') {
      return NextResponse.json(
        { error: 'itemType must be PORTFOLIO or STOCK' },
        { status: 400 }
      );
    }

    const isFavorite = await checkFavoriteStatus(itemType, itemId);

    return NextResponse.json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
