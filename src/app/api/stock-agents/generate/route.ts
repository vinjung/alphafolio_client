import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/server/session';

const STOCK_AGENTS_URL =
  process.env.STOCK_AGENTS_SERVICE_URL || 'http://localhost:8001';
const API_SECRET_KEY = process.env.API_SECRET_KEY || '';

/**
 * POST /api/stock-agents/generate
 * 로그인 사용자 전용 - AI 투자 전략 생성 요청
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 세션 확인 (로그인 여부)
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. stock_agents 서비스로 프록시
    const body = await request.json();

    const response = await fetch(
      `${STOCK_AGENTS_URL}/api/analysis/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_SECRET_KEY,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Stock agents generate proxy failed:', error);
    return NextResponse.json(
      { error: '전략 생성 요청에 실패했습니다.' },
      { status: 502 }
    );
  }
}
