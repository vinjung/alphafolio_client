import { NextRequest, NextResponse } from 'next/server';
import { getAPIConfig } from '@/lib/server/api-config';
import { getCurrentSession } from '@/lib/server/session';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'chat-job-active-api' });

export async function GET(_request: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const config = getAPIConfig();
    const response = await fetch(
      `${config.fastapi.baseUrl}/chat/job/active?user_id=${user.id}`,
      {
        signal: AbortSignal.timeout(config.fastapi.timeout),
      }
    );

    if (!response.ok) {
      log.error('FastAPI active jobs 에러', {
        status: response.status,
      });
      return NextResponse.json(
        { error: `Active jobs error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[ActiveJob] Response:', JSON.stringify({
      jobCount: data.jobs?.length || 0,
      jobIds: data.jobs?.map((j: { job_id: string }) => j.job_id) || [],
    }));
    return NextResponse.json(data);
  } catch (error) {
    log.error('Active jobs 에러', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
