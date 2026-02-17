import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/server/session';
import {
  createChatSession,
  addChatMessage,
  updateChatSessionTitle,
} from '@/lib/server/chat-history';
import { logger } from '@/lib/utils/logger';
import { globalPOSTRateLimit } from '@/lib/server/request';

const log = logger.child({ module: 'chat-save-api' });

/**
 * POST /api/chat/save
 * Saves chat session and messages
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with save status and session info
 *
 * @body {string} [sessionId] - Existing session ID, creates new if not provided
 * @body {string} userMessage - User message content
 * @body {string} assistantMessage - AI assistant response
 * @body {string} [title] - Chat title, derived from first message
 * @body {string} [modelId=stock-ai] - AI model ID used for the chat
 *
 * @example
 * POST /api/chat/save
 * Body: {
 *   "sessionId": "550e8400-e29b-41d4-a716-446655440000",
 *   "userMessage": "What's the current stock price?",
 *   "assistantMessage": "The current stock price is...",
 *   "title": "Stock Price Inquiry",
 *   "modelId": "stock-ai"
 * }
 * 
 * @throws {401} Unauthorized - User not authenticated
 * @throws {429} Too Many Requests - Rate limit exceeded
 * @throws {500} Internal Server Error - Server error
 */
export async function POST(request: NextRequest) {
  try {
    // 🚦 Rate Limiting 체크
    if (!(await globalPOSTRateLimit())) {
      log.warn('채팅 저장 Rate Limit 초과');
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
      log.warn('인증되지 않은 사용자의 채팅 저장 시도');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      );
    }

    const {
      sessionId,
      userMessage,
      assistantMessage,
      title,
      modelId = 'stock-ai', // ✅ 기본값 설정
    } = body;

    // 3. 요청 데이터 검증
    if (!userMessage || !assistantMessage) {
      return NextResponse.json(
        { error: '사용자 메시지와 AI 응답이 모두 필요합니다.' },
        { status: 400 }
      );
    }

    // ✅ 모델 ID 유효성 검증
    const validModelIds = ['stock-ai', 'brain-ai', 'alpha-ai'];
    if (!validModelIds.includes(modelId)) {
      log.warn('잘못된 모델 ID', { modelId, validIds: validModelIds });
      return NextResponse.json(
        { error: '유효하지 않은 모델 ID입니다.' },
        { status: 400 }
      );
    }

    let currentSessionId = sessionId;

    // 4. 새 세션 생성 (sessionId가 없는 경우)
    if (!currentSessionId) {
      const sessionTitle = title || userMessage.slice(0, 50); // 첫 메시지를 제목으로 사용

      log.info('새 채팅 세션 생성 시작', {
        userId: user.id,
        title: sessionTitle.slice(0, 30),
        modelId, // ✅ 로그에 모델 ID 포함
      });

      // ✅ createChatSession에 modelId 전달
      const newSession = await createChatSession(
        user.id,
        sessionTitle,
        modelId
      );
      currentSessionId = newSession.id;

      log.info('새 채팅 세션 생성 완료', {
        userId: user.id,
        sessionId: currentSessionId,
        modelId: newSession.modelId, // ✅ 생성된 세션의 모델 ID 로깅
      });
    }

    // 5. 사용자 메시지 저장
    await addChatMessage(currentSessionId, 'user', userMessage, user.id);

    // 6. AI 응답 저장
    await addChatMessage(
      currentSessionId,
      'assistant',
      assistantMessage,
      user.id
    );

    // 7. 세션 제목 업데이트 (title이 제공된 경우)
    if (title && title !== userMessage.slice(0, 50)) {
      await updateChatSessionTitle(currentSessionId, title, user.id);
    }

    log.info('채팅 저장 완료', {
      userId: user.id,
      sessionId: currentSessionId,
      modelId, // ✅ 최종 로그에도 모델 ID 포함
      userMessageLength: userMessage.length,
      assistantMessageLength: assistantMessage.length,
    });

    return NextResponse.json({
      success: true,
      sessionId: currentSessionId,
      modelId, // ✅ 응답에 모델 ID 포함 (클라이언트 확인용)
      message: '채팅이 저장되었습니다.',
    });
  } catch (error) {
    log.error('채팅 저장 실패', error);

    if (error instanceof Error) {
      if (error.message.includes('권한')) {
        return NextResponse.json(
          { error: '채팅 저장 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
