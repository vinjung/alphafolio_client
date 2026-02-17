import { type NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/server/user';
import { createSession, generateSessionToken } from '@/lib/server/session';
import { createDefaultUserLimit } from '@/lib/server/chat-limit';
import { logSignupActivity } from '@/lib/server/signup-analytics';
import { logger, createCorrelationId, createTimer } from '@/lib/utils/logger';

/**
 * POST /api/auth/register
 * Complete signup after terms agreement.
 * Reads pending_user cookie, creates user, session, and redirects.
 */
export async function POST(request: NextRequest) {
  const correlationId = createCorrelationId();
  const timer = createTimer();
  const log = logger.child({ correlationId, flow: 'register' });

  try {
    // 1. Read pending_user cookie
    const pendingUserCookie = request.cookies.get('pending_user')?.value;
    if (!pendingUserCookie) {
      log.warn('pending_user cookie not found');
      return NextResponse.json(
        { error: '회원가입 정보가 만료되었습니다. 다시 시도해주세요.' },
        { status: 400 }
      );
    }

    // 2. Decode pending user data
    let pendingUserData;
    try {
      pendingUserData = JSON.parse(
        Buffer.from(pendingUserCookie, 'base64').toString('utf-8')
      );
    } catch {
      log.error('Failed to decode pending_user cookie');
      return NextResponse.json(
        { error: '회원가입 정보가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    log.info('회원가입 시작', {
      email: pendingUserData.email,
      nickname: pendingUserData.nickname,
    });

    // 3. Create user
    const user = await createUser({
      oauthProvider: pendingUserData.oauthProvider,
      oauthId: pendingUserData.oauthId,
      ageRange: pendingUserData.ageRange,
      email: pendingUserData.email,
      gender: pendingUserData.gender,
      profileImageUrl: pendingUserData.profileImageUrl,
      thumbnailImageUrl: pendingUserData.thumbnailImageUrl,
      nickname: pendingUserData.nickname,
    });

    // 4. Create default user limit
    await createDefaultUserLimit(user.id, 'custom');

    // 5. Create session
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);

    log.info('회원가입 완료', {
      userId: user.id.substring(0, 8) + '...',
      email: user.email,
      duration: timer.duration(),
    });

    // 6. Track signup activity
    try {
      await logSignupActivity(
        user.id,
        'signup',
        {
          utmSource: 'kakao',
          utmMedium: 'login',
          utmCampaign: 'signup',
          utmContent: 'signup',
        },
        request.headers.get('user-agent') || undefined
      );
    } catch (trackingError) {
      log.warn('Signup tracking failed', { error: trackingError });
    }

    // 7. Build redirect URL
    const baseRedirectUrl = process.env.NEXT_PUBLIC_APP_URL + '/discover/list';
    const redirectUrl = new URL(baseRedirectUrl);
    redirectUrl.searchParams.set('utm_source', 'kakao');
    redirectUrl.searchParams.set('utm_medium', 'login');
    redirectUrl.searchParams.set('utm_campaign', 'signup');
    redirectUrl.searchParams.set('utm_content', 'signup');

    // 8. Return JSON response with session cookie
    const response = NextResponse.json({
      success: true,
      redirectUrl: redirectUrl.toString(),
    });

    response.cookies.set({
      name: 'session',
      value: sessionToken,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(session.expiresAt),
    });

    // Delete pending_user cookie
    response.cookies.delete('pending_user');
    response.cookies.delete('hasSeenGuestOnboarding');

    return response;
  } catch (error) {
    log.error('회원가입 실패', error, {
      totalDuration: timer.duration(),
    });

    return NextResponse.json(
      {
        error: '회원가입에 실패했습니다.',
        message: '잠시 후 다시 시도해주세요.',
        correlationId,
      },
      { status: 500 }
    );
  }
}
