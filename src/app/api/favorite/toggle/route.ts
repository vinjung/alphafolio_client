import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { toggleFavorite, FavoriteItemType } from '@/lib/server/favorite';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemType, itemId } = body as {
      itemType: FavoriteItemType;
      itemId: string;
    };

    // Validate input
    if (!itemType || !itemId) {
      return NextResponse.json(
        { success: false, message: 'itemType and itemId are required' },
        { status: 400 }
      );
    }

    if (itemType !== 'PORTFOLIO' && itemType !== 'STOCK') {
      return NextResponse.json(
        { success: false, message: 'itemType must be PORTFOLIO or STOCK' },
        { status: 400 }
      );
    }

    const result = await toggleFavorite(itemType, itemId);

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    // Revalidate cache for favorite list pages
    if (itemType === 'PORTFOLIO') {
      revalidatePath('/myportfolio');
    } else if (itemType === 'STOCK') {
      revalidatePath('/mystock');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
