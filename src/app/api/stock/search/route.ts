import { NextRequest, NextResponse } from 'next/server';
import { searchStocks, checkStockExists } from '@/lib/server/stock';

export const revalidate = 60;

/**
 * Validate search query
 * - Korean: at least 1 complete character (consonant + vowel)
 * - English: at least 1 letter
 * - Numbers: at least 1 digit
 */
function isValidSearchQuery(query: string): boolean {
  if (!query || query.trim().length === 0) {
    return false;
  }

  const trimmed = query.trim();

  // Check for complete Korean character (has both consonant and vowel)
  const koreanCompleteChar = /[가-힣]/;
  // Check for English letter
  const englishLetter = /[a-zA-Z]/;
  // Check for digit
  const digit = /[0-9]/;

  // Valid if contains at least one complete Korean char, English letter, or digit
  return (
    koreanCompleteChar.test(trimmed) ||
    englishLetter.test(trimmed) ||
    digit.test(trimmed)
  );
}

/**
 * GET /api/stock/search?q=삼성
 * Search stocks for autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !isValidSearchQuery(query)) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const results = await searchStocks(query);

    return NextResponse.json(
      { data: results },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Stock search failed:', error);
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stock/search
 * Check if stock exists (for search button validation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json(
        { exists: false, error: '정보가 없습니다 다시 입력해주세요' },
        { status: 200 }
      );
    }

    const result = await checkStockExists(symbol.trim());

    if (!result.exists) {
      return NextResponse.json(
        { exists: false, error: '정보가 없습니다 다시 입력해주세요' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { exists: true, market: result.market, symbol: symbol.trim().toUpperCase() },
      { status: 200 }
    );
  } catch (error) {
    console.error('Stock check failed:', error);
    return NextResponse.json(
      { exists: false, error: '정보가 없습니다 다시 입력해주세요' },
      { status: 500 }
    );
  }
}
