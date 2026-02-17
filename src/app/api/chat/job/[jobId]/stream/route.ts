import { NextRequest, NextResponse } from 'next/server';
import { getAPIConfig } from '@/lib/server/api-config';
import { getCurrentSession } from '@/lib/server/session';
import { logger } from '@/lib/utils/logger';

const log = logger.child({ module: 'chat-job-stream-api' });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { jobId } = await params;
    const { searchParams } = new URL(request.url);
    const lastId = searchParams.get('last_id') || '0';

    const config = getAPIConfig();
    const response = await fetch(
      `${config.fastapi.baseUrl}/chat/job/${jobId}/stream?last_id=${lastId}&user_id=${user.id}`,
      {
        signal: AbortSignal.timeout(config.fastapi.timeout),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      log.error('FastAPI job stream 에러', {
        status: response.status,
        body: errorBody,
        jobId,
      });
      return NextResponse.json(
        { error: `Job stream error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Diagnostic: log when status is completed/failed or events exist
    if (data.status === 'completed' || data.status === 'failed' || data.events?.length > 0) {
      log.info('[Poll] job_stream response', {
        jobId,
        status: data.status,
        eventCount: data.events?.length || 0,
        lastId: data.last_id,
        eventTypes: data.events?.map((e: { type: string }) => e.type).join(',') || '',
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    log.error('Job stream 에러', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
