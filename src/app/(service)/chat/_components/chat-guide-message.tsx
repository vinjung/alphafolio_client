'use client';
import { Button } from '@/components/shared/button';
import { Text } from '@/components/shared/text';

export type GuideMessageType =
  | 'server-busy' // Server busy (auto-retry in progress)
  | 'limit-reached' // 일일 한도 완전 소진
  | 'limit-warning' // 일일 한도 1회 남음 경고
  | 'session-limit-reached' // 세션 한도 도달 (50개 메시지 또는 10만 토큰)
  | 'session-limit-warning' // 세션 한도 임박 (45개 메시지 또는 90% 토큰)
  | 'request-failed'; // 요청 실패 (재시도)

interface GuideMessageConfig {
  content: string;
  extra?: string;
  contentColor: string;
  extraColor?: string;
  actionButton?: {
    text: string;
    variant: 'gradient';
    className?: string;
  };
}

interface ChatGuideMessageProps {
  type: GuideMessageType;
  onRetry?: () => void;
  onNavigateToStocks?: () => void;
  onStartNewChat?: () => void;
  className?: string;
  customMessage?: string; // 동적 에러 메시지 지원
  guideMessageConfig?: {
    type: GuideMessageType;
    props: {
      onRetry?: () => void;
      onNavigateToStocks?: () => void;
      onStartNewChat?: () => void;
    };
    customMessage?: string;
  };
}

const MESSAGE_CONFIGS: Record<GuideMessageType, GuideMessageConfig> = {
  'server-busy': {
    content: '서버가 바쁩니다. 잠시 후 자동으로 재시도합니다...',
    contentColor: 'text-orange-900',
  },
  'limit-reached': {
    content:
      '⚠ 오늘의 떡상 기회를 모두 사용 완료하였습니다. \n 내일 자정(00:00)에 사용 가능합니다.',
    contentColor: 'text-red-900',
    actionButton: {
      text: '떡상 종목 보러 가기',
      variant: 'gradient',
    },
  },
  'limit-warning': {
    content: '🔥 오늘의 마지막 떡상 기회! 가장 중요한 질문을 해보세요.',
    contentColor: 'text-red-900',
  },
  'session-limit-reached': {
    content: '이 대화의 한도에 도달했습니다.',
    contentColor: 'text-orange-900',
    actionButton: {
      text: '새 대화 시작하기',
      variant: 'gradient',
    },
  },
  'session-limit-warning': {
    content: '이 대화가 곧 한도에 도달합니다. 중요한 질문을 마무리해 주세요.',
    contentColor: 'text-orange-900',
  },
  'request-failed': {
    content:
      '일시적 오류일 수 있습니다.\n다시 시도하기 버튼, 새로 고침을 해보시고 문제가 지속될 경우\n아래 이메일로 문의 부탁드립니다.\ncleverage426@gmail.com',
    contentColor: 'text-neutral-1100',
    actionButton: {
      text: '다시 시도하기',
      variant: 'gradient',
    },
  },
};

export function ChatGuideMessage({
  type,
  onRetry,
  onNavigateToStocks,
  onStartNewChat,
  className = '',
  customMessage,
  guideMessageConfig,
}: ChatGuideMessageProps) {
  const config = MESSAGE_CONFIGS[type];

  // 가이드 메시지 설정에서 customMessage 추출
  const configCustomMessage = guideMessageConfig?.customMessage;

  // 동적 메시지 우선순위: 가이드 설정 > 개별 prop > 기본 메시지
  const displayMessage = configCustomMessage || customMessage || config.content;

  const handleActionClick = () => {
    if (type === 'limit-reached' && onNavigateToStocks) {
      onNavigateToStocks();
    } else if (type === 'session-limit-reached' && onStartNewChat) {
      onStartNewChat();
    } else if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className={`px-4 py-3 ${className}`}>
      <div
        className={`flex flex-col items-start gap-3 p-4 rounded-lg border bg-red-50 border-red-900`}
      >
        {/* 텍스트 영역 */}
        <div className="flex-1">
          <Text
            variant="b1"
            className={`whitespace-pre-line select-text ${config.contentColor}`}
          >
            {displayMessage}
          </Text>

          {config.extra && (
            <Text
              variant="b1"
              className={`whitespace-pre-line mt-4 ${config.extraColor}`}
            >
              {config.extra}
            </Text>
          )}
        </div>
        {/* 액션 버튼 */}
        {config.actionButton && (
          <Button
            onClick={handleActionClick}
            className={`w-full max-h-12 text-s1 ${config.actionButton.className}`}
            variant={config.actionButton.variant}
          >
            {config.actionButton.text}
          </Button>
        )}
      </div>
    </div>
  );
}
