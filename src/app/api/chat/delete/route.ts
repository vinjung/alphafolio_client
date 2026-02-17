import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/server/session';
import { deleteChatSession } from '@/lib/server/chat-history';

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getCurrentSession();

    if (!user) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'sessionId가 필요합니다.' },
        { status: 400 }
      );
    }

    await deleteChatSession(sessionId, user.id);

    return NextResponse.json({
      success: true,
      message: '채팅이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('채팅 삭제 실패:', error);
    return NextResponse.json(
      { success: false, message: '채팅 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
