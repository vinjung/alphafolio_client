import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/server/session';
import { getChatHistory, getChatStats } from '@/lib/server/chat-history';
import { getAPIConfig } from '@/lib/server/api-config';
import { logger } from '@/lib/utils/logger';
import {
  validateData,
  parseRequestBody,
  handleValidation,
} from '@/lib/validation';
import {
  deleteChatSessionSchema,
  updateChatSessionSchema,
} from '@/lib/validation/chat-schemas';
import { globalGETRateLimit, globalPOSTRateLimit } from '@/lib/server/request';

const log = logger.child({ module: 'chat-history-api' });

/**
 * GET /api/chat/history
 * Retrieves user's chat history list with pagination support
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with chat history data
 *
 * @query {number} [limit=50] - Number of items to retrieve (max: 100)
 * @query {number} [offset=0] - Number of items to skip for pagination
 * @query {boolean} [includeStats=false] - Whether to include statistics
 *
 * @example
 * GET /api/chat/history?limit=20&offset=0&includeStats=true
 * 
 * @throws {401} Unauthorized - User not authenticated
 * @throws {400} Bad Request - Invalid query parameters
 * @throws {429} Too Many Requests - Rate limit exceeded
 * @throws {500} Internal Server Error - Server error
 */
export async function GET(request: NextRequest) {
  try {
    // 🚦 Rate Limiting 체크
    if (!(await globalGETRateLimit())) {
      log.warn('채팅 히스토리 조회 Rate Limit 초과');
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
      log.warn('인증되지 않은 사용자의 채팅 히스토리 접근 시도');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. Query Parameter 파싱 및 검증
    const { searchParams } = new URL(request.url);

    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const includeStatsParam = searchParams.get('includeStats');

    // 파라미터 검증 및 기본값 설정
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;
    const offset = offsetParam ? Math.max(parseInt(offsetParam, 10), 0) : 0;
    const includeStats = includeStatsParam === 'true';

    // 파라미터 유효성 검증
    if (isNaN(limit) || isNaN(offset)) {
      log.warn('잘못된 query parameter', {
        limit: limitParam,
        offset: offsetParam,
      });
      return NextResponse.json(
        { error: '잘못된 요청 파라미터입니다.' },
        { status: 400 }
      );
    }

    log.info('채팅 히스토리 조회 시작', {
      userId: user.id,
      limit,
      offset,
      includeStats,
    });

    // 3. 채팅 히스토리 조회 + active jobs 병합
    const [chatHistory, stats, activeJobsRes] = await Promise.all([
      getChatHistory(user.id, limit, offset),
      includeStats ? getChatStats(user.id) : Promise.resolve(null),
      // active jobs 조회 (실패해도 무시)
      fetch(`${getAPIConfig().fastapi.baseUrl}/chat/job/active?user_id=${user.id}`)
        .then((r) => r.json())
        .catch(() => ({ jobs: [] })),
    ]);

    // active job의 session_id를 수집
    const activeJobMap = new Map<string, string>();
    if (activeJobsRes?.jobs) {
      for (const job of activeJobsRes.jobs) {
        if (job.session_id) {
          activeJobMap.set(job.session_id, job.job_id);
        }
      }
    }

    // 히스토리에 processing 상태 병합
    const mergedHistory = chatHistory.map((item: { id: string; title: string; lastMessage: string; createdAt: string; updatedAt: string }) => {
      const jobId = activeJobMap.get(item.id);
      if (jobId) {
        return {
          ...item,
          status: 'processing' as const,
          jobId,
          lastMessage: '답변 생성 중...',
        };
      }
      return item;
    });

    // 4. 응답 데이터 구성
    const responseData = {
      success: true,
      data: {
        history: mergedHistory,
        pagination: {
          limit,
          offset,
          count: chatHistory.length,
          hasMore: chatHistory.length === limit, // 요청한 만큼 왔으면 더 있을 가능성
        },
        ...(stats && { stats }),
      },
    };

    log.info('채팅 히스토리 조회 완료', {
      userId: user.id,
      resultCount: chatHistory.length,
      hasStats: !!stats,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    log.error('채팅 히스토리 조회 실패', error);

    // 에러 타입에 따른 적절한 응답
    if (error instanceof Error) {
      if (error.message.includes('권한')) {
        return NextResponse.json(
          { error: '접근 권한이 없습니다.' },
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

/**
 * DELETE /api/chat/history
 * Deletes a specific chat session
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with deletion status
 *
 * @body {string} sessionId - Chat session ID (UUID) to delete
 *
 * @example
 * DELETE /api/chat/history
 * Body: { "sessionId": "550e8400-e29b-41d4-a716-446655440000" }
 * 
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not Found - Chat session not found or no permission
 * @throws {429} Too Many Requests - Rate limit exceeded
 * @throws {500} Internal Server Error - Server error
 */
export async function DELETE(request: NextRequest) {
  try {
    // 🚦 Rate Limiting 체크
    if (!(await globalPOSTRateLimit())) {
      log.warn('채팅 세션 삭제 Rate Limit 초과');
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
      log.warn('인증되지 않은 사용자의 채팅 삭제 시도');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const bodyResult = await parseRequestBody(request);

    return handleValidation(bodyResult, async (body) => {
      // 3. 요청 데이터 검증 (UUID 형식 포함)
      const validationResult = validateData(deleteChatSessionSchema, body);

      return handleValidation(validationResult, async (validatedData) => {
        const { sessionId } = validatedData;

        log.info('채팅 세션 삭제 시작', {
          userId: user.id,
          sessionId,
        });

        // 4. 채팅 세션 삭제 (권한 확인 포함)
        const { deleteChatSession } = await import('@/lib/server/chat-history');
        await deleteChatSession(sessionId, user.id);

        log.info('채팅 세션 삭제 완료', {
          userId: user.id,
          sessionId,
        });

        return NextResponse.json({
          success: true,
          message: '채팅이 삭제되었습니다.',
        });
      });
    });
  } catch (error) {
    log.error('채팅 세션 삭제 실패', error);

    if (error instanceof Error) {
      if (
        error.message.includes('찾을 수 없거나') ||
        error.message.includes('권한')
      ) {
        return NextResponse.json(
          { error: '채팅을 찾을 수 없거나 삭제 권한이 없습니다.' },
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

/**
 * PATCH /api/chat/history
 * Updates chat session title
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with update status
 *
 * @body {string} sessionId - Chat session ID (UUID) to update
 * @body {string} title - New title for the chat session
 *
 * @example
 * PATCH /api/chat/history
 * Body: { "sessionId": "550e8400-e29b-41d4-a716-446655440000", "title": "New Chat Title" }
 * 
 * @throws {401} Unauthorized - User not authenticated
 * @throws {404} Not Found - Chat session not found or no permission
 * @throws {429} Too Many Requests - Rate limit exceeded
 * @throws {500} Internal Server Error - Server error
 */
export async function PATCH(request: NextRequest) {
  try {
    // 🚦 Rate Limiting 체크
    if (!(await globalPOSTRateLimit())) {
      log.warn('채팅 세션 제목 수정 Rate Limit 초과');
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
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const bodyResult = await parseRequestBody(request);

    return handleValidation(bodyResult, async (body) => {
      // 3. 요청 데이터 검증 (UUID 형식 포함)
      const validationResult = validateData(updateChatSessionSchema, body);

      return handleValidation(validationResult, async (validatedData) => {
        const { sessionId, title } = validatedData;

        log.info('채팅 세션 제목 수정 시작', {
          userId: user.id,
          sessionId,
          newTitle: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
        });

        // 4. 제목 업데이트
        const { updateChatSessionTitle } = await import(
          '@/lib/server/chat-history'
        );
        await updateChatSessionTitle(sessionId, title.trim(), user.id);

        log.info('채팅 세션 제목 수정 완료', {
          userId: user.id,
          sessionId,
        });

        return NextResponse.json({
          success: true,
          message: '채팅 제목이 수정되었습니다.',
        });
      });
    });
  } catch (error) {
    log.error('채팅 세션 제목 수정 실패', error);

    if (error instanceof Error) {
      if (
        error.message.includes('찾을 수 없거나') ||
        error.message.includes('권한')
      ) {
        return NextResponse.json(
          { error: '채팅을 찾을 수 없거나 수정 권한이 없습니다.' },
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
