'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChatSessionStore, useAppStore } from '@/stores';
import type { ChatHistoryItem } from '@/lib/server/chat-history';

interface UseChatSessionProps {
  chatId: string;
  isWelcomeMode?: boolean;
  preloadedChatHistory?: ChatHistoryItem[];
}

interface UseChatSessionResult {
  // 상태
  chatHistory: ChatHistoryItem[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatHistoryItem[]>>;

  // 로딩 상태는 store에서 관리
  isLoadingMessages: boolean;

  // 세션 관리 함수들
  addToChatHistory: (item: ChatHistoryItem) => void;
}

// ✅ UUID 검증 함수 추가
const isValidUUID = (str: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// ✅ 🚨 핵심 수정: 새 채팅 감지 로직 개선 + 무한 루프 방지
const isNewChatSession = (
  chatId: string,
  isWelcomeMode: boolean,
  hasPresetParams: boolean
): boolean => {
  // 🚨 수정: 유효한 UUID 세션 ID가 있으면 프리셋보다 기존 세션 우선
  if (isValidUUID(chatId)) {
    return false; // 기존 세션 로드
  }

  // 프리셋 파라미터가 있고 새 채팅 경로인 경우에만 새 채팅 강제
  if (hasPresetParams && (chatId === 'new' || chatId === 'welcome')) {
    return true;
  }

  // 기존 로직
  return (
    isWelcomeMode ||
    chatId === 'welcome' ||
    chatId === 'new' ||
    chatId.startsWith('chat_') ||
    chatId.includes('new=true')
  );
};

export function useChatSession({
  chatId,
  isWelcomeMode = false,
  preloadedChatHistory = [],
}: UseChatSessionProps): UseChatSessionResult {
  // ✅ 🚨 URL 파라미터 추가 (프리셋 감지용)
  const searchParams = useSearchParams();
  const presetStock = searchParams.get('preset');
  const presetTicker = searchParams.get('ticker');
  const hasPresetParams = !!presetStock && !!presetTicker;

  // ✅ Zustand 스토어에서 세션 관련 상태와 액션들 가져오기
  const {
    isLoadingMessages,
    setCurrentSession,
    setMessages,
    setLoading,
    resetSession,
    setSessionLimit,
  } = useChatSessionStore();

  // ✅ 모델 관리용 Zustand 스토어 추가
  const { setSelectedModel } = useAppStore();

  // 로컬 상태 - 채팅 히스토리만 관리
  const [chatHistory, setChatHistory] =
    useState<ChatHistoryItem[]>(preloadedChatHistory);

  // ✅ 🚨 강화된 새 채팅 감지 로직 (프리셋 파라미터 고려)
  const isNewChat = isNewChatSession(chatId, isWelcomeMode, hasPresetParams);

  // ✅ 세션 정보 조회 함수 (modelId 포함)
  const loadSessionInfo = useCallback(
    async (sessionId: string): Promise<{ modelId?: string } | null> => {
      try {
        const response = await fetch(`/api/chat/session/${sessionId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.success ? data.session : null;
      } catch (_error) {
        return null;
      }
    },
    []
  );

  // 채팅 히스토리에 새 항목 추가
  const addToChatHistory = useCallback((item: ChatHistoryItem) => {
    setChatHistory((prev) => [item, ...prev]);
  }, []);

  // ✅ 🚨 세션 초기화 Effect (프리셋 모드 고려)
  useEffect(() => {

    if (!isNewChat && isValidUUID(chatId) && !hasPresetParams) {
      // 프리셋이 없고 실제 UUID 세션 ID인 경우에만 로드
      setCurrentSession(chatId);

      // loadExistingMessages 함수 내용을 인라인으로 이동
      if (isValidUUID(chatId)) {
        setLoading(true);

        fetch(`/api/chat/messages/${chatId}`)
          .then(async (response) => {

            if (!response.ok) {
              setMessages([]);
              setLoading(false);
              return;
            }

            const result = await response.json();


            if (result.success && result.data?.messages) {
              setMessages(result.data.messages);
              // ✅ 세션 제한 정보 저장
              if (result.data.sessionLimit) {
                setSessionLimit(result.data.sessionLimit);
              }
            } else {
              setMessages([]);
            }

            // ✅ 2. 세션의 모델 정보 확인 및 동기화 (수정된 경로)
            if (result.success && result.data?.session?.modelId) {
              // API 응답에 세션 정보가 포함된 경우
              const sessionModelId = result.data.session.modelId;
              setSelectedModel(sessionModelId);
            } else {
              // ✅ 3. 별도로 세션 정보 조회 시도
              const sessionInfo = await loadSessionInfo(chatId);
              if (sessionInfo?.modelId) {
                setSelectedModel(sessionInfo.modelId);
              } else {
                // ✅ 4. 모델 정보를 가져올 수 없는 경우 로그만 남김
              }
            }
          })
          .catch((_error) => {
            setMessages([]);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else {
      // ✅ 새 채팅인 경우 또는 프리셋이 있는 경우 세션 초기화
      const _reason = hasPresetParams
        ? '프리셋 모드'
        : isNewChat
          ? '새 채팅 조건'
          : '유효하지 않은 UUID';


      setLoading(false);
      setCurrentSession(null); // ✅ 명시적으로 null 설정

      // 스토어에 기존 세션이 없을 때만 리셋
      const { messages, currentSessionId } = useChatSessionStore.getState();
      if ((isWelcomeMode || hasPresetParams) && messages.length === 0 && !currentSessionId) {
        resetSession();
      }
    }
  }, [
    chatId,
    isNewChat,
    isWelcomeMode,
    hasPresetParams,
    presetStock,
    presetTicker,
    setCurrentSession,
    setLoading,
    resetSession,
    setMessages,
    setSelectedModel,
    setSessionLimit,
    loadSessionInfo,
  ]);

  return {
    // 상태
    chatHistory,
    setChatHistory,
    isLoadingMessages,

    // 함수들
    addToChatHistory,
  };
}
