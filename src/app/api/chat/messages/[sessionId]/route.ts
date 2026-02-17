import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/server/session';
import { getChatSessionWithMessages } from '@/lib/server/chat-history';
import { getAPIConfig } from '@/lib/server/api-config';
import { logger } from '@/lib/utils/logger';
import { validateUUIDParam, handleValidation } from '@/lib/validation';
import { globalGETRateLimit } from '@/lib/server/request';

const log = logger.child({ module: 'chat-messages-api' });

// Session limit info from FastAPI backend
interface SessionLimitInfo {
  can_continue: boolean;
  current_messages: number;
  max_messages: number;
  remaining_messages: number;
  current_tokens: number;
  max_tokens: number;
  remaining_tokens: number;
  limit_reason: string | null;
}

/**
 * Fetch session limit info from FastAPI backend
 */
async function fetchSessionLimit(sessionId: string): Promise<SessionLimitInfo | null> {
  try {
    const config = getAPIConfig();
    const response = await fetch(
      `${config.fastapi.baseUrl}/chat/history/sessions/${sessionId}/limit`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(config.fastapi.timeout),
      }
    );

    if (!response.ok) {
      log.warn('Failed to fetch session limit', { sessionId, status: response.status });
      return null;
    }

    const data = await response.json();
    if (data.success) {
      return {
        can_continue: data.can_continue,
        current_messages: data.current_messages,
        max_messages: data.max_messages,
        remaining_messages: data.remaining_messages,
        current_tokens: data.current_tokens,
        max_tokens: data.max_tokens,
        remaining_tokens: data.remaining_tokens,
        limit_reason: data.limit_reason,
      };
    }
    return null;
  } catch (error) {
    log.warn('Error fetching session limit', { sessionId, error });
    return null;
  }
}

/**
 * ✅ 향상된 GET /api/chat/messages/[sessionId]
 * 특정 채팅 세션의 모든 메시지 + 세션 정보 조회 (modelId 포함)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    // 🚦 Rate Limiting 체크
    if (!(await globalGETRateLimit())) {
      log.warn('채팅 메시지 조회 Rate Limit 초과');
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
          },
        }
      );
    }

    // 1. 사용자 인증 확인
    const { user } = await getCurrentSession();

    if (!user) {
      log.warn('인증되지 않은 사용자의 채팅 메시지 접근 시도');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. sessionId UUID 검증
    const uuidValidation = await validateUUIDParam(context.params, 'sessionId');

    return handleValidation(uuidValidation, async (sessionId) => {
      const source = request.nextUrl.searchParams.get('source');
      log.info('채팅 세션+메시지 조회 시작', {
        userId: user.id,
        sessionId,
        ...(source && { source }),
      });
      if (source === 'recovery') {
        console.log('[Recovery] Stuck session recovery triggered:', JSON.stringify({ sessionId }));
      }

      // ✅ 3. 세션 정보 + 메시지 통합 조회
      const { session, messages } = await getChatSessionWithMessages(
        sessionId,
        user.id
      );

      // ✅ 3.5 세션 제한 정보 조회 (FastAPI 백엔드)
      const sessionLimit = await fetchSessionLimit(sessionId);

      // 세션이 없거나 권한이 없는 경우
      if (!session) {
        log.warn('세션 접근 권한 없음 또는 세션 없음', {
          userId: user.id,
          sessionId,
        });
        return NextResponse.json(
          { error: '채팅을 찾을 수 없거나 접근 권한이 없습니다.' },
          { status: 404 }
        );
      }

      // ✅ 4. 클라이언트 형식으로 변환
      const formattedMessages = messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        createdAt: msg.createdAt,
        isStreaming: false,
        visualization: msg.visualization || null,
      }));

      // ✅ 5. 세션 정보 포맷팅 (modelId 포함)
      const sessionInfo = {
        id: session.id,
        title: session.title,
        modelId: session.modelId, // ✅ 핵심! modelId 포함
        userId: session.userId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messageCount,
      };

      log.info('채팅 세션+메시지 조회 완료', {
        userId: user.id,
        sessionId: session.id,
        modelId: session.modelId, // ✅ 로그에 modelId 포함
        messageCount: messages.length,
        sessionTitle: session.title.slice(0, 30),
      });

      // ✅ 6. 향상된 응답 (세션 정보 + 세션 제한 정보 포함)
      return NextResponse.json({
        success: true,
        data: {
          sessionId: session.id,
          session: sessionInfo,
          messages: formattedMessages,
          count: messages.length,
          sessionLimit: sessionLimit,
        },
        message: '채팅 세션과 메시지를 성공적으로 조회했습니다.',
      });
    });
  } catch (error) {
    log.error('채팅 메시지 조회 실패', error);

    if (error instanceof Error) {
      if (
        error.message.includes('찾을 수 없거나') ||
        error.message.includes('권한')
      ) {
        return NextResponse.json(
          { error: '채팅을 찾을 수 없거나 접근 권한이 없습니다.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
