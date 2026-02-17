'use client';

/**
 * 유료회원 전용 표시 (Premium Content Lock)
 *
 * 유료회원 전용 콘텐츠를 블러 처리하고 잠금 버튼을 표시하는 컴포넌트입니다.
 * 다양한 페이지에서 유료 콘텐츠 접근 제한을 표시할 때 사용합니다.
 *
 * @example
 * // 기본 사용
 * <PremiumContent isLocked={!isPremiumUser}>
 *   <ExpensiveAnalysisData />
 * </PremiumContent>
 *
 * @example
 * // 커스텀 버튼 텍스트와 클릭 핸들러
 * <PremiumContent
 *   isLocked={true}
 *   buttonText="프리미엄 구독하기"
 *   onUnlock={() => router.push('/pricing')}
 * >
 *   <PremiumFeature />
 * </PremiumContent>
 *
 * 검색 키워드: 유료회원 전용 표시, 프리미엄 콘텐츠, 블러 처리, 잠금 콘텐츠
 */

import { Icon } from '@/components/icons';
import { Button } from '@/components/shared/button';

interface PremiumContentProps {
  /** 잠금 상태 여부 (true면 블러 처리) */
  isLocked: boolean;
  /** 블러 처리할 콘텐츠 */
  children: React.ReactNode;
  /** 잠금 해제 버튼 텍스트 */
  buttonText?: string;
  /** 잠금 해제 버튼 클릭 핸들러 */
  onUnlock?: () => void;
}

export function PremiumContent({
  isLocked,
  children,
  buttonText = '바로 확인하기',
  onUnlock,
}: PremiumContentProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* 블러 처리된 콘텐츠 */}
      <div className="blur-sm pointer-events-none select-none">{children}</div>

      {/* 오버레이 */}
      <div className="absolute inset-0 bg-transparent flex items-center justify-center w-full">
        <div className="flex flex-col items-center gap-4 w-full">
          <Button
            variant="gradient"
            onClick={onUnlock}
            className="px-6"
            aria-label={buttonText}
            fullWidth
          >
            <Icon.lock size={16} color="white" className="mr-2 text-white" />
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
}
