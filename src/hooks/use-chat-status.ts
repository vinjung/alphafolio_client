// client/src/hooks/use-chat-status.ts
'use client';

import { useMemo } from 'react';
import type { GuideMessageType } from '@/app/(service)/chat/_components/chat-guide-message';
import type { SessionLimitInfo } from '@/stores/chat-session-store';

interface ChatStatusState {
  // 일일 한도 관련
  limitInfo: {
    remaining: number;
    limit: number;
    canSend: boolean;
  } | null;
  isLimitLoading: boolean;
  isGuest: boolean;

  // 세션 한도 관련
  sessionLimit: SessionLimitInfo | null;

  // 에러 및 스트리밍 상태
  lastFailedMessage: string | null;
  isRetrying: boolean;
  isServerBusy: boolean;
  isStreaming: boolean;
  messagesError: string | null;
  streamError: string | null;
  saveError: string | null;

  // UI 상태
  isLoadingMessages: boolean;
  isProcessing: boolean;
}

interface GuideMessageConfig {
  type: GuideMessageType;
  props: {
    onRetry?: () => void;
    onNavigateToStocks?: () => void;
    onStartNewChat?: () => void;
  };
  customMessage?: string;
}

interface ChatStatusConfig {
  // 단일 가이드 메시지 (우선순위 기반)
  currentGuideMessage: GuideMessageConfig | null;

  // 입력 비활성화 조건
  isInputDisabled: boolean;

  // Placeholder 텍스트
  placeholder: string;
}

type UseChatStatusProps = ChatStatusState;

type UseChatStatusResult = ChatStatusConfig;

export function useChatStatus(props: UseChatStatusProps): UseChatStatusResult {
  const {
    limitInfo,
    isLimitLoading,
    isGuest,
    sessionLimit,
    lastFailedMessage,
    isServerBusy,
    isStreaming,
    messagesError,
    streamError,
    saveError,
    isLoadingMessages,
    isProcessing,
  } = props;

  // 우선순위 기반 단일 가이드 메시지 결정
  const currentGuideMessage = useMemo((): GuideMessageConfig | null => {
    // 1. 일일 한도 소진 (최고 우선순위 - 사용자가 메시지를 보낼 수 없음)
    if (
      !isGuest &&
      !!limitInfo &&
      !isLimitLoading &&
      limitInfo.remaining === 0
    ) {
      return {
        type: 'limit-reached',
        props: {
          onNavigateToStocks: undefined, // 이는 chat-interface에서 주입될 것임
        },
      };
    }

    // 1.5 세션 한도 도달 (높은 우선순위 - 이 대화에서 더 이상 진행 불가)
    if (sessionLimit && !sessionLimit.can_continue) {
      return {
        type: 'session-limit-reached',
        props: {
          onStartNewChat: undefined, // 이는 chat-interface에서 주입될 것임
        },
      };
    }

    // 1.7 Server busy (auto-retry in progress)
    if (isServerBusy) {
      return {
        type: 'server-busy' as GuideMessageType,
        props: {},
      };
    }

    // 2. 에러 메시지 (높은 우선순위)
    if (messagesError || streamError || saveError) {
      return {
        type: 'request-failed',
        props: {
          onRetry: undefined, // 이는 chat-interface에서 주입될 것임
        },
      };
    }

    // 3. 요청 실패 재시도 (높은 우선순위)
    if (Boolean(lastFailedMessage) && !isStreaming) {
      return {
        type: 'request-failed',
        props: {
          onRetry: undefined, // 이는 chat-interface에서 주입될 것임
        },
      };
    }

    // 4. 일일 한도 경고 (낮은 우선순위 - 단순 경고)
    if (
      !isGuest &&
      !!limitInfo &&
      !isLimitLoading &&
      limitInfo.remaining === 1
    ) {
      return {
        type: 'limit-warning',
        props: {},
      };
    }

    // 5. 세션 한도 경고는 chat-interface.tsx에서 인라인 텍스트로 처리

    // 가이드 메시지 없음
    return null;
  }, [
    isGuest,
    limitInfo,
    isLimitLoading,
    sessionLimit,
    isServerBusy,
    messagesError,
    streamError,
    saveError,
    lastFailedMessage,
    isStreaming,
  ]);

  // 입력 비활성화 조건
  const isInputDisabled = useMemo(() => {
    return (
      isStreaming ||
      isProcessing ||
      isLoadingMessages ||
      (!isGuest && !!limitInfo && limitInfo.remaining === 0) ||
      (!!sessionLimit && !sessionLimit.can_continue)
    );
  }, [isStreaming, isProcessing, isLoadingMessages, isGuest, limitInfo, sessionLimit]);

  // Placeholder 텍스트
  const placeholder = useMemo(() => {
    if (isStreaming) return 'AI가 응답 중입니다...';
    if (isProcessing) return '메시지를 처리하고 있습니다...';
    if (isLoadingMessages) return '메시지를 불러오고 있습니다...';
    if (!isGuest && !!limitInfo && limitInfo.remaining === 0) {
      return '일일 한도에 도달했습니다';
    }
    if (sessionLimit && !sessionLimit.can_continue) {
      return '이 대화의 한도에 도달했습니다';
    }
    return '우리 모두 떡상 가즈아!';
  }, [isStreaming, isProcessing, isLoadingMessages, isGuest, limitInfo, sessionLimit]);

  return {
    // 단일 가이드 메시지
    currentGuideMessage,

    // 입력 상태
    isInputDisabled,
    placeholder,
  };
}
