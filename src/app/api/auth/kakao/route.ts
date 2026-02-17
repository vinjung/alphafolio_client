// src/app/api/auth/kakao/route.ts
import { generateState } from 'arctic';
import { kakao } from '@/lib/server/oauth';
import { NextRequest, NextResponse } from 'next/server';
import { globalGETRateLimit } from '@/lib/server/request';
import {
  logger,
  createCorrelationId,
  extractRequestMeta,
  createTimer,
} from '@/lib/utils/logger';

// 환경변수 검증
const validateEnvironment = () => {
  const required = [
    'KAKAO_CLIENT_ID',
    'KAKAO_LOGIN_REDIRECT_URI',
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

export async function GET(request: NextRequest): Promise<Response> {
  // 🔗 상관관계 ID 생성 및 타이머 시작
  const correlationId = createCorrelationId();
  const timer = createTimer();

  // 📊 Request 메타데이터 추출
  const requestMeta = extractRequestMeta(request);

  // 🎯 로거 인스턴스 생성
  const log = logger.child({
    correlationId,
    flow: 'kakao_oauth_init',
    ...requestMeta,
  });

  log.info('카카오 OAuth 초기화 요청 시작');

  try {
    // 🛡️ 환경변수 검증
    validateEnvironment();
    log.debug('환경변수 검증 완료');

    // 🚦 Rate limiting 체크
    log.debug('Rate limit 검사 시작');
    if (!globalGETRateLimit()) {
      log.warn('Rate limit 초과', {
        ip: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      return new Response('Too many requests', {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
        },
      });
    }
    log.debug('Rate limit 검사 통과');

    // 🎲 OAuth 보안 토큰 생성
    log.info('OAuth 보안 토큰 생성 시작');
    const state = generateState();
    const nonce = generateState();

    log.debug('OAuth 토큰 생성 완료', {
      stateLength: state.length,
      nonceLength: nonce.length,
      statePrefix: state.substring(0, 8) + '...',
      noncePrefix: nonce.substring(0, 8) + '...',
    });

    // 🔐 OAuth 스코프 설정
    const scopes = [
      'openid',
      'profile_nickname',
      'profile_image',
      'account_email',
    ];

    log.debug('OAuth 스코프 설정 완료', {
      scopes,
      scopeCount: scopes.length,
    });

    // 🔗 카카오 Authorization URL 생성
    log.info('카카오 Authorization URL 생성 시작');
    const authUrl = kakao.createAuthorizationURL(state, scopes);
    authUrl.searchParams.set('nonce', nonce);

    log.info('카카오 Authorization URL 생성 완료', {
      redirectHost: authUrl.hostname,
      hasState: authUrl.searchParams.has('state'),
      hasNonce: authUrl.searchParams.has('nonce'),
      hasClientId: authUrl.searchParams.has('client_id'),
      responseType: authUrl.searchParams.get('response_type'),
    });

    // 🍪 보안 쿠키 설정
    log.info('보안 쿠키 설정 시작');
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      maxAge: 60 * 10, // 10 minutes
      sameSite: 'lax' as const,
    };

    const response = NextResponse.redirect(authUrl.toString(), { status: 302 });

    response.cookies.set('kakao_oauth_state', state, cookieOptions);
    response.cookies.set('kakao_oauth_nonce', nonce, cookieOptions);

    // 보안 헤더 추가
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'no-referrer');

    log.info('보안 쿠키 및 헤더 설정 완료', {
      cookieSecure: isProduction,
      cookieMaxAge: cookieOptions.maxAge,
      securityHeadersCount: 3,
    });

    // 📝 성공 로깅
    log.info('카카오 OAuth 초기화 완료', {
      redirectTo: authUrl.hostname,
      totalDuration: timer.duration(),
      environment: process.env.NODE_ENV,
    });

    return response;
  } catch (error) {
    // 🚨 에러 처리 및 로깅
    log.error('카카오 OAuth 초기화 실패', error, {
      totalDuration: timer.duration(),
    });

    if (
      error instanceof Error &&
      error.message.includes('Missing required environment')
    ) {
      log.error('환경설정 오류', error);
      return Response.json(
        {
          error: 'Server configuration error',
          correlationId, // 디버깅용
        },
        { status: 500 }
      );
    }

    // 🔥 예상치 못한 오류
    log.error('예상치 못한 OAuth 초기화 오류', error);

    return Response.json(
      {
        error: 'OAuth initialization failed',
        message: 'Unable to start authentication process',
        correlationId,
      },
      { status: 500 }
    );
  }
}

// 🎯 헬스체크 (선택사항)
export async function HEAD(): Promise<Response> {
  const log = logger.child({ flow: 'kakao_oauth_health' });

  try {
    validateEnvironment();
    log.debug('카카오 OAuth 헬스체크 통과');
    return new Response(null, { status: 200 });
  } catch (error) {
    log.error('카카오 OAuth 헬스체크 실패', error);
    return new Response(null, { status: 503 });
  }
}
