import { NextRequest, NextResponse } from 'next/server';
import { getAPIConfig } from '@/lib/server/api-config';
import { getCurrentSession } from '@/lib/server/session';
import { checkDailyLimit } from '@/lib/server/chat-limit';
import { logger } from '@/lib/utils/logger';
import { validateData, chatStreamRequestSchema } from '@/lib/validation';

const log = logger.child({ module: 'chat-stream-api' });

export async function POST(request: NextRequest) {
  try {
    // 1. 사용자 인증 확인
    const { user } = await getCurrentSession();

    if (!user) {
      log.warn('인증되지 않은 사용자의 채팅 스트림 요청');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 일일 채팅 한도 확인 (간소화된 로직)
    const limitCheck = await checkDailyLimit(user.id);

    if (!limitCheck.canSend) {
      log.warn('일일 채팅 한도 초과', {
        userId: user.id,
        used: limitCheck.used,
        limit: limitCheck.limit,
      });

      // 한도가 0인 경우 시스템 오류로 처리
      if (limitCheck.limit === 0) {
        log.error('사용자 한도 설정이 없습니다', {
          userId: user.id,
          message: '회원가입 시 한도가 생성되지 않았음',
        });

        return NextResponse.json(
          {
            error: '사용자 설정을 불러올 수 없습니다.',
            message: '잠시 후 다시 시도해주세요.',
            code: 'USER_LIMIT_NOT_FOUND',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: '일일 채팅 한도를 초과했습니다.',
          limit: {
            used: limitCheck.used,
            limit: limitCheck.limit,
            remaining: limitCheck.remaining,
          },
        },
        { status: 429 }
      );
    }

    // 3. 브라우저로부터 { message, modelConfig } 형태의 요청을 받습니다.
    const body = await request.json();

    // 4. Zod로 입력값 검증
    const validationResult = validateData(chatStreamRequestSchema, body);
    if (!validationResult.success) {
      log.warn('채팅 요청 검증 실패', {
        userId: user.id,
        error: validationResult.error?.message,
        details: validationResult.error?.details,
      });

      return NextResponse.json(
        {
          error:
            validationResult.error?.message || '입력값이 올바르지 않습니다.',
          details: validationResult.error?.details,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data!;

    log.info('비동기 채팅 요청 시작', {
      userId: user.id,
      messageLength: validatedData.message.length,
      remaining: limitCheck.remaining,
    });

    // 5. 서버 환경에 맞는 FastAPI 주소를 가져옵니다.
    const config = getAPIConfig();
    const endpoint = `${config.fastapi.baseUrl}/chat/async`;

    // 6. FastAPI가 기대하는 요청 형식으로 올바르게 재구성합니다.
    const fastApiRequestBody = {
      message: validatedData.message,
      modelConfig: {
        provider: validatedData.modelConfig?.provider || 'anthropic',
        model: validatedData.modelConfig?.model || 'claude-sonnet-4-6',
        chat_service_type: validatedData.modelConfig?.chat_service_type || 'ALPHA_AI',
      },
      sessionId: validatedData.sessionId || null,
      user_id: user.id,
    };

    // 7. FastAPI /chat/async 호출 (즉시 응답)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fastApiRequestBody),
      signal: AbortSignal.timeout(config.fastapi.timeout),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      log.error('FastAPI 에러', {
        status: response.status,
        body: errorBody,
        userId: user.id,
      });

      // 503 Server Busy - pass through to client for auto-retry
      if (response.status === 503) {
        return NextResponse.json(
          {
            error: 'Server is busy. Please try again later.',
            code: 'SERVER_BUSY',
          },
          { status: 503 }
        );
      }

      throw new Error(`FastAPI error: ${response.status}`);
    }

    const data = await response.json();

    log.info('비동기 작업 생성 완료', {
      userId: user.id,
      jobId: data.job_id,
      sessionId: data.session_id,
      remaining: limitCheck.remaining - 1,
    });

    return NextResponse.json({
      job_id: data.job_id,
      session_id: data.session_id,
    });
  } catch (error) {
    log.error('채팅 비동기 요청 에러', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      isTimeout: error instanceof Error && error.name === 'TimeoutError',
    });

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        {
          error: '요청 시간이 초과되었습니다.',
          message: '서버가 바쁩니다. 잠시 후 다시 시도해주세요.',
          code: 'REQUEST_TIMEOUT',
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        error: 'Proxy server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
