import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatMessage } from '@/types/chat';

// Session limit info from backend
export interface SessionLimitInfo {
  can_continue: boolean;
  current_messages: number;
  max_messages: number;
  remaining_messages: number;
  current_tokens: number;
  max_tokens: number;
  remaining_tokens: number;
  limit_reason: string | null;
}

interface ChatSessionState {
  // 세션 정보
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoadingMessages: boolean;

  // 세션 제한 정보
  sessionLimit: SessionLimitInfo | null;

  // 첫 메시지 처리 상태
  hasProcessedFirstMessage: boolean;

  // 에러 관리
  lastFailedMessage: string | null;
  isRetrying: boolean;
  isStreamInterrupted: boolean;

  // Server busy state
  isServerBusy: boolean;

  // 기본 액션들
  setCurrentSession: (sessionId: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (index: number, updates: Partial<ChatMessage>) => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  setLoading: (loading: boolean) => void;
  setHasProcessedFirstMessage: (processed: boolean) => void;
  setSessionLimit: (limit: SessionLimitInfo | null) => void;

  // 에러 관리 액션들
  setFailedMessage: (message: string | null) => void;
  setRetrying: (retrying: boolean) => void;
  setStreamInterrupted: (interrupted: boolean) => void;
  setServerBusy: (busy: boolean) => void;

  // 유틸리티 액션들
  resetSession: () => void;
  clearMessages: () => void;
  clearErrors: () => void;
}

export const useChatSessionStore = create<ChatSessionState>()(
  devtools(
    (set, _get) => ({
      // 초기 상태
      currentSessionId: null,
      messages: [],
      isLoadingMessages: false,
      sessionLimit: null,
      hasProcessedFirstMessage: false,
      lastFailedMessage: null,
      isRetrying: false,
      isStreamInterrupted: false,
      isServerBusy: false,

      // 세션 관리
      setCurrentSession: (sessionId: string | null) => {
        set(
          { currentSessionId: sessionId },
          false,
          'chatSession/setCurrentSession'
        );
      },

      // 메시지 관리
      setMessages: (messages: ChatMessage[]) => {
        set({ messages }, false, 'chatSession/setMessages');
      },

      addMessage: (message: ChatMessage) => {
        set(
          (state) => ({
            messages: [...state.messages, message],
          }),
          false,
          'chatSession/addMessage'
        );
      },

      updateMessage: (index: number, updates: Partial<ChatMessage>) => {
        set(
          (state) => ({
            messages: state.messages.map((msg, i) =>
              i === index ? { ...msg, ...updates } : msg
            ),
          }),
          false,
          'chatSession/updateMessage'
        );
      },

      updateLastMessage: (updates: Partial<ChatMessage>) => {
        set(
          (state) => {
            const messages = [...state.messages];
            const lastIndex = messages.length - 1;
            if (lastIndex >= 0) {
              messages[lastIndex] = { ...messages[lastIndex], ...updates };
            }
            return { messages };
          },
          false,
          'chatSession/updateLastMessage'
        );
      },

      setLoading: (loading: boolean) => {
        set({ isLoadingMessages: loading }, false, 'chatSession/setLoading');
      },

      setHasProcessedFirstMessage: (processed: boolean) => {
        set(
          { hasProcessedFirstMessage: processed },
          false,
          'chatSession/setHasProcessedFirstMessage'
        );
      },

      setSessionLimit: (limit: SessionLimitInfo | null) => {
        set({ sessionLimit: limit }, false, 'chatSession/setSessionLimit');
      },

      // 에러 관리
      setFailedMessage: (message: string | null) => {
        set(
          { lastFailedMessage: message },
          false,
          'chatSession/setFailedMessage'
        );
      },

      setRetrying: (retrying: boolean) => {
        set({ isRetrying: retrying }, false, 'chatSession/setRetrying');
      },

      setStreamInterrupted: (interrupted: boolean) => {
        set(
          { isStreamInterrupted: interrupted },
          false,
          'chatSession/setStreamInterrupted'
        );
      },

      setServerBusy: (busy: boolean) => {
        set(
          { isServerBusy: busy },
          false,
          'chatSession/setServerBusy'
        );
      },

      // 유틸리티
      resetSession: () => {
        set(
          {
            currentSessionId: null,
            messages: [],
            isLoadingMessages: false,
            sessionLimit: null,
            hasProcessedFirstMessage: false,
            lastFailedMessage: null,
            isRetrying: false,
            isStreamInterrupted: false,
            isServerBusy: false,
          },
          false,
          'chatSession/reset'
        );
      },

      clearMessages: () => {
        set({ messages: [] }, false, 'chatSession/clearMessages');
      },

      clearErrors: () => {
        set(
          {
            lastFailedMessage: null,
            isRetrying: false,
            isStreamInterrupted: false,
            isServerBusy: false,
          },
          false,
          'chatSession/clearErrors'
        );
      },
    }),
    {
      name: 'chat-session-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
