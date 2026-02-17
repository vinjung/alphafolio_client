import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/server/session';

const STOCK_AGENTS_URL =
  process.env.STOCK_AGENTS_SERVICE_URL || 'http://localhost:8001';
const API_SECRET_KEY = process.env.API_SECRET_KEY || '';

/**
 * GET /api/stock-agents/status/[symbol]
 * 전략 생성 상태 조회 (로그인 필요)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    // 세션 확인
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { symbol } = await params;

    const response = await fetch(
      `${STOCK_AGENTS_URL}/api/analysis/status/${symbol}`,
      {
        headers: { 'X-API-KEY': API_SECRET_KEY },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Stock agents status proxy failed:', error);
    return NextResponse.json(
      { status: 'idle', message: '상태 확인에 실패했습니다.' },
      { status: 502 }
    );
  }
}
