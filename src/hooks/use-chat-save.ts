'use client';

import { useState, useCallback, useRef } from 'react';
import { useChatSessionStore } from '@/stores';
import type { ChatMessage } from '@/types/chat';

interface UseChatSaveProps {
  chatId: string;
  onNewSessionCreated?: (item: {
    id: string;
    title: string;
    lastMessage: string;
    createdAt: string;
    updatedAt: string;
  }) => void;
}

interface UseChatSaveResult {
  isSaving: boolean;
  saveError: string | null;
  saveChatToDatabase: (userMsg: string, assistantMsg: string) => Promise<string | null>;
  handleStreamingComplete: (messages: ChatMessage[]) => Promise<string | null>;
  clearSaveError: () => void;
  getCurrentSessionId: () => string | null;
}

export function useChatSave({
  chatId: _chatId,
  onNewSessionCreated: _onNewSessionCreated,
}: UseChatSaveProps): UseChatSaveResult {
  const [isSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const lastProcessedRef = useRef<string | null>(null);

  const { currentSessionId, updateLastMessage } = useChatSessionStore();

  // 백엔드가 직접 DB 저장하므로 no-op
  const saveChatToDatabase = useCallback(
    async (_userMsg: string, _assistantMsg: string): Promise<string | null> => {
      return currentSessionId;
    },
    [currentSessionId]
  );

  // 스트리밍 완료 처리 - DB 저장은 백엔드에서 처리됨
  const handleStreamingComplete = useCallback(
    async (messages: ChatMessage[]): Promise<string | null> => {
      if (messages.length >= 2) {
        const userMessage = messages[messages.length - 2];
        const assistantMessage = messages[messages.length - 1];

        if (
          userMessage?.role === 'user' &&
          assistantMessage?.role === 'assistant' &&
          userMessage.content.trim() &&
          assistantMessage.content.trim()
        ) {
          // 중복 처리 방지
          const key = `${userMessage.content.trim().slice(0, 50)}`;
          if (lastProcessedRef.current === key) {
            return currentSessionId;
          }
          lastProcessedRef.current = key;

          // 스트리밍 상태 업데이트
          updateLastMessage({ isStreaming: false });

          // 백엔드가 이미 저장했으므로, 세션 ID만 반환
          return currentSessionId;
        }
      }
      return null;
    },
    [currentSessionId, updateLastMessage]
  );

  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  const getCurrentSessionId = useCallback(() => {
    return currentSessionId;
  }, [currentSessionId]);

  return {
    isSaving,
    saveError,
    saveChatToDatabase,
    handleStreamingComplete,
    clearSaveError,
    getCurrentSessionId,
  };
}
