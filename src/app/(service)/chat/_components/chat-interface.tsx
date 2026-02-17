'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ChatGuideMessage } from './chat-guide-message';
import { MessageAreaSkeleton } from './chat-skeleton';
import { resetStreamingProgress } from './streaming-progress';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useChatSave } from '@/hooks/use-chat-save';
import { useChatLimit } from '@/hooks/use-chat-limit';
import { useChatModel } from '@/hooks/use-chat-model';
import { useChatSession } from '@/hooks/use-chat-session';
import { useChatStatus } from '@/hooks/use-chat-status';
import { useStreamingStore, useChatSessionStore, useAppStore } from '@/stores';
import type { ChatMessage } from '@/types/chat';
import type { ChatHistoryItem } from '@/lib/server/chat-history';

// 상수 분리
const CONSTANTS = {
  MESSAGES: {
    NEW_CHAT_LOG: '🆕 새 채팅 - 로드 건너뜀',
    EXISTING_CHAT_LOG: '📂 기존 채팅 로드 시작:',
    WELCOME_RESET_LOG: '🆕 웰컴 모드 - 세션 리셋',
    CHAT_LIMIT_WARNING: '채팅 한도 초과',
    LOADING_MESSAGES_LOG: '📨 로드된 메시지:',
    API_CALL_LOG: '📡 API 호출:',
    API_RESPONSE_LOG: '📡 API 응답:',
    NEW_CHAT_NO_MESSAGES_LOG: '📂 새 채팅 - 메시지 없음',
    MESSAGE_LOAD_FAILED: '기존 메시지 로드 실패:',
  },
  PATHS: {
    STOCKS_PATH: '/today',
    WELCOME_PATH: 'welcome',
  },
  STYLES: {
    MAIN_CONTAINER: 'flex flex-col bg-neutral-0',
    FLEX_ONE: 'flex-1',
  },
  PARAMS: {
    NEW_CHAT_PARAM: 'new=true',
    CHAT_PREFIX: 'chat_',
    MIN_CHAT_ID_PARTS: 4,
  },
} as const;

interface ChatInterfaceProps {
  chatId: string;
  firstMessage?: string;
  isWelcomeMode?: boolean;
  userNickname: string;
  preloadedChatHistory?: ChatHistoryItem[];
}

export function ChatInterface({
  chatId,
  firstMessage,
  isWelcomeMode = false,
  userNickname,
  preloadedChatHistory = [],
}: ChatInterfaceProps) {
  // Capture stuck session ID at render time (before any effects clear it)
  const [initialStuckSession] = useState(() => {
    const state = useChatSessionStore.getState();
    const msgs = state.messages;
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming && state.currentSessionId) {
      return state.currentSessionId;
    }
    return null;
  });

  // 리팩토링된 모델 훅 사용
  const { selectedModel, availableModels, presetMessage, handleModelChange } =
    useChatModel({
      userNickname,
    });

  // 리팩토링된 세션 훅 사용
  const { chatHistory, setChatHistory, isLoadingMessages, addToChatHistory } =
    useChatSession({
      chatId,
      isWelcomeMode,
      preloadedChatHistory,
    });

  // 세션 상태 스토어
  const {
    currentSessionId,
    messages,
    sessionLimit,
    hasProcessedFirstMessage,
    lastFailedMessage,
    isRetrying,
    isServerBusy,
    addMessage,
    updateLastMessage,
    setHasProcessedFirstMessage,
    setFailedMessage,
    setRetrying,
    setServerBusy,
    setSessionLimit,
    setCurrentSession,
    resetSession,
    clearErrors,
  } = useChatSessionStore();

  // 503 auto-retry counter
  const retryCountRef = useRef(0);

  // 스트리밍 스토어
  const setGlobalStreaming = useStreamingStore((state) => state.setIsStreaming);
  const resetStreamingState = useStreamingStore(
    (state) => state.resetStreamingState
  );

  // 채팅 한도 관리
  const {
    limitInfo,
    isLoading: isLimitLoading,
    isGuest,
    decrementRemaining,
  } = useChatLimit();

  // 채팅 스트림 훅 (polling 방식)
  const {
    response: streamResponse,
    isStreaming,
    error: streamError,
    visualization: streamVisualization,
    currentJob,
    sendMessage,
    disconnect,
    resumePolling,
  } = useChatStream();

  // 채팅 저장 훅
  const { saveError, handleStreamingComplete, clearSaveError, getCurrentSessionId } = useChatSave({
    chatId,
    onNewSessionCreated: addToChatHistory,
  });

  // 상태 관리 훅
  const chatStatus = useChatStatus({
    limitInfo,
    isLimitLoading,
    isGuest,
    sessionLimit,
    lastFailedMessage,
    isRetrying,
    isServerBusy,
    isStreaming,
    messagesError: null,
    streamError,
    saveError,
    isLoadingMessages,
    isProcessing: false,
  });

  const { placeholder, isInputDisabled } = chatStatus;

  // 성능 최적화: 계산된 값들 메모화
  const hasAssistantMessages = useMemo(
    () => messages.some((msg) => msg.role === 'assistant'),
    [messages]
  );

  const showWelcomeScreen = useMemo(
    () => isWelcomeMode || messages.length === 0,
    [isWelcomeMode, messages.length]
  );

  const { setSendRecommendedQuestion } = useAppStore();

  // 초기 채팅 히스토리 설정 (한 번만)
  useEffect(() => {
    if (preloadedChatHistory.length > 0 && chatHistory.length === 0) {
      setChatHistory(preloadedChatHistory);
    }
  }, [preloadedChatHistory, chatHistory.length, setChatHistory]);

  // 스트리밍 상태 동기화
  useEffect(() => {
    setGlobalStreaming(isStreaming, currentSessionId || undefined);
  }, [isStreaming, currentSessionId, setGlobalStreaming]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      resetStreamingState();
      if (presetMessage) {
        const { clearPresetMessage } = useAppStore.getState();
        clearPresetMessage();
      }
    };
  }, [resetStreamingState, presetMessage]);

  // job 응답에서 session_id 받아서 URL 및 상태 업데이트
  useEffect(() => {
    if (currentJob?.session_id && !currentSessionId) {
      const sessionId = currentJob.session_id;
      setCurrentSession(sessionId);

      // 히스토리에 새 항목 추가
      if (messages.length > 0) {
        const userMsg = messages.find((m) => m.role === 'user');
        const newHistoryItem: ChatHistoryItem = {
          id: sessionId,
          title: userMsg?.content?.slice(0, 50) || '새 대화',
          lastMessage: '답변 생성 중...',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addToChatHistory(newHistoryItem);
      }

      // URL 업데이트
      if (chatId === 'welcome' || chatId === 'new') {
        window.history.replaceState(null, '', `/chat/${sessionId}`);
      }
    }
  }, [currentJob, currentSessionId, setCurrentSession, chatId, messages, addToChatHistory]);

  // 마운트 시 active job 감지 + stuck state 복구
  useEffect(() => {
    if (isWelcomeMode) {
      fetch('/api/chat/job/active')
        .then((res) => res.json())
        .then((data) => {
          if (data.jobs?.length > 0) {
            const job = data.jobs[0];
            setCurrentSession(job.session_id);

            // 해당 세션으로 이동
            window.history.replaceState(null, '', `/chat/${job.session_id}`);

            // 세션의 기존 메시지 로드 후 polling 재개
            fetch(`/api/chat/messages/${job.session_id}`)
              .then((res) => res.json())
              .then((msgData) => {
                if (msgData.success && msgData.data?.messages) {
                  // 메시지가 있으면 로드
                  const loadedMessages = msgData.data.messages;
                  if (loadedMessages.length > 0) {
                    const { setMessages } = useChatSessionStore.getState();
                    const chatMessages: ChatMessage[] = loadedMessages.map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (msg: any) => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        createdAt: new Date(msg.createdAt),
                        visualization: msg.visualization || null,
                      })
                    );
                    setMessages(chatMessages);
                  }

                  // assistant 메시지 placeholder 추가 + polling 재개
                  const { addMessage: addMsg } = useChatSessionStore.getState();
                  addMsg({
                    id: `assistant_${Date.now()}`,
                    role: 'assistant',
                    content: '',
                    createdAt: new Date(),
                    isStreaming: true,
                  });
                  resumePolling(job.job_id, job.session_id);
                }
              })
              .catch(() => {
                // 메시지 로드 실패해도 polling은 시작
                const { addMessage: addMsg } = useChatSessionStore.getState();
                addMsg({
                  id: `assistant_${Date.now()}`,
                  role: 'assistant',
                  content: '',
                  createdAt: new Date(),
                  isStreaming: true,
                });
                resumePolling(job.job_id, job.session_id);
              });
          } else if (initialStuckSession) {
            // No active job but stuck streaming state from previous navigation
            // initialStuckSession was captured at render time (before useChatSession cleared it)
            fetch(`/api/chat/messages/${initialStuckSession}?source=recovery`)
              .then((res) => res.json())
              .then((msgData) => {
                if (msgData.success && msgData.data?.messages) {
                  const dbMessages = msgData.data.messages;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const lastAssistant = [...dbMessages].reverse().find((m: any) => m.role === 'assistant');
                  if (lastAssistant?.content) {
                    // Restore completed session with DB data
                    setCurrentSession(initialStuckSession);
                    window.history.replaceState(null, '', `/chat/${initialStuckSession}`);
                    const { setMessages } = useChatSessionStore.getState();
                    const chatMessages: ChatMessage[] = dbMessages.map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (msg: any) => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        createdAt: new Date(msg.createdAt),
                        visualization: msg.visualization || null,
                      })
                    );
                    setMessages(chatMessages);
                  } else {
                    // No assistant response in DB - reset to welcome
                    resetSession();
                  }
                } else {
                  resetSession();
                }
              })
              .catch(() => {
                resetSession();
              });
          }
        })
        .catch(() => {
          // active job 조회 실패는 무시
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 세션 제한 새로고침 함수
  const refreshSessionLimit = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${sessionId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.sessionLimit) {
          setSessionLimit(result.data.sessionLimit);
        }
      }
    } catch (error) {
      console.warn('Failed to refresh session limit:', error);
    }
  }, [setSessionLimit]);

  // 스트리밍 응답 처리 (content only)
  useEffect(() => {
    if (streamResponse && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === 'assistant' &&
        lastMessage.isStreaming &&
        lastMessage.content !== streamResponse
      ) {
        updateLastMessage({
          content: streamResponse,
        });
      }
    }
  }, [streamResponse, updateLastMessage, messages]);

  // 스트리밍 완료 처리
  useEffect(() => {
    if (!isStreaming && !streamError && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage?.role === 'assistant' &&
        lastMessage.isStreaming &&
        lastMessage.content.trim()
      ) {
        // 스트리밍 완료: isStreaming을 false로 + visualization 추가
        updateLastMessage({
          isStreaming: false,
          ...(streamVisualization ? { visualization: streamVisualization } : {}),
        });

        // 프리셋 메시지와 URL 파라미터 클리어
        if (presetMessage) {
          const { clearPresetMessage } = useAppStore.getState();
          clearPresetMessage();
          const currentPath = window.location.pathname;
          window.history.replaceState(null, '', currentPath);
          const { resetPresetFlags } = useAppStore.getState();
          resetPresetFlags();
        }

        // 503 auto-retry reset on success
        retryCountRef.current = 0;
        setServerBusy(false);

        // 한도 차감
        if (!isGuest) {
          decrementRemaining();
        }

        // 세션 제한 새로고침
        handleStreamingComplete(messages).then((sessionId) => {
          if (sessionId) {
            refreshSessionLimit(sessionId);
          }
        });
      }
    } else if (streamError) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
        updateLastMessage({ isStreaming: false });
      }
    }
  }, [
    isStreaming,
    streamError,
    streamVisualization,
    messages,
    presetMessage,
    handleStreamingComplete,
    refreshSessionLimit,
    isGuest,
    decrementRemaining,
    updateLastMessage,
    setServerBusy,
  ]);

  // 웰컴 모드 세션 리셋
  useEffect(() => {
    if (isWelcomeMode && messages.length === 0 && !currentSessionId) {
      resetSession();
      if (presetMessage) {
        const { clearPresetMessage } = useAppStore.getState();
        clearPresetMessage();
      }
    }
  }, [isWelcomeMode, resetSession, presetMessage, messages.length, currentSessionId]);

  // 첫 메시지 처리
  useEffect(() => {
    if (firstMessage && !hasProcessedFirstMessage && selectedModel) {
      setHasProcessedFirstMessage(true);
      handleSendMessage(firstMessage);
    }
  }, [
    firstMessage,
    hasProcessedFirstMessage,
    selectedModel,
    setHasProcessedFirstMessage,
  ]);

  // 유틸리티 함수: 메시지 생성
  const createUserMessage = useCallback((content: string): ChatMessage => {
    return {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    };
  }, []);

  const createAssistantMessage = useCallback((): ChatMessage => {
    return {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
      isStreaming: true,
    };
  }, []);

  // 전송 가능 여부 확인
  const canSendMessage = useCallback(
    (content: string): boolean => {
      if (!selectedModel || isStreaming || !content.trim()) {
        return false;
      }
      if (limitInfo && !isGuest && limitInfo.remaining <= 0) {
        return false;
      }
      return true;
    },
    [selectedModel, isStreaming, limitInfo, isGuest]
  );

  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(
    async (content: string, clearInput?: () => void) => {
      if (presetMessage) {
        const { clearPresetMessage } = useAppStore.getState();
        clearPresetMessage();
      }

      if (!canSendMessage(content)) {
        return;
      }

      clearErrors();

      const userMessage = createUserMessage(content);
      const assistantMessage = createAssistantMessage();

      resetStreamingProgress();
      addMessage(userMessage);
      addMessage(assistantMessage);

      clearInput?.();

      try {
        if (selectedModel) {
          const sessionId = getCurrentSessionId();
          await sendMessage(content.trim(), selectedModel.apiConfig, sessionId);
        }
      } catch (err) {
        if (err instanceof Error && (err as Error & { isServerBusy?: boolean }).isServerBusy) {
          const retryCount = retryCountRef.current || 0;
          if (retryCount < 2) {
            retryCountRef.current = retryCount + 1;
            setServerBusy(true);
            setTimeout(() => {
              handleSendMessage(content.trim());
            }, 3000);
            return;
          }
          retryCountRef.current = 0;
          setServerBusy(false);
          setFailedMessage(content.trim());
        } else {
          retryCountRef.current = 0;
          setServerBusy(false);
          setFailedMessage(content.trim());
        }
      }
    },
    [
      presetMessage,
      canSendMessage,
      clearErrors,
      createUserMessage,
      createAssistantMessage,
      addMessage,
      sendMessage,
      setFailedMessage,
      setServerBusy,
      selectedModel,
      getCurrentSessionId,
    ]
  );

  // 추천 질문 전송 핸들러
  const handleRecommendedQuestion = useCallback(
    (message: string) => {
      const storeSessionId = getCurrentSessionId();
      const urlSessionId = window.location.pathname.split('/').pop();
      const isValidUrlSessionId = urlSessionId && urlSessionId !== 'new' && urlSessionId !== 'welcome' && urlSessionId.includes('-');
      const finalSessionId = storeSessionId || (isValidUrlSessionId ? urlSessionId : null);

      if (!selectedModel || isStreaming || !message.trim()) {
        return;
      }
      if (limitInfo && !isGuest && limitInfo.remaining <= 0) {
        return;
      }

      clearErrors();

      const userMessage = createUserMessage(message);
      const assistantMessage = createAssistantMessage();

      resetStreamingProgress();
      addMessage(userMessage);
      addMessage(assistantMessage);

      if (selectedModel) {
        sendMessage(message.trim(), selectedModel.apiConfig, finalSessionId);
      }
    },
    [getCurrentSessionId, selectedModel, isStreaming, limitInfo, isGuest, clearErrors, createUserMessage, createAssistantMessage, addMessage, sendMessage]
  );

  useEffect(() => {
    setSendRecommendedQuestion(handleRecommendedQuestion);
    return () => {
      setSendRecommendedQuestion(null);
    };
  }, [handleRecommendedQuestion, setSendRecommendedQuestion]);

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    if (lastFailedMessage) {
      setRetrying(true);
      handleSendMessage(lastFailedMessage);
      setFailedMessage(null);
      setRetrying(false);
    }
  }, [lastFailedMessage, handleSendMessage, setRetrying, setFailedMessage]);

  // 새 채팅 핸들러
  const handleNewChat = useCallback(() => {
    if (isWelcomeMode) {
      resetSession();
      if (isStreaming) {
        disconnect();
      }
      if (presetMessage) {
        const { clearPresetMessage } = useAppStore.getState();
        clearPresetMessage();
      }
    }
  }, [isWelcomeMode, resetSession, isStreaming, disconnect, presetMessage]);

  const handleNavigateToStocks = () => {
    window.location.href = CONSTANTS.PATHS.STOCKS_PATH;
  };

  const handleStartNewChat = () => {
    window.location.href = '/chat';
  };

  // 입력 props
  const inputProps = useMemo(
    () => ({
      onSendMessageAction: handleSendMessage,
      isStreaming,
      disabled: isInputDisabled,
      placeholder,
      presetMessage,
    }),
    [
      handleSendMessage,
      isStreaming,
      isInputDisabled,
      placeholder,
      presetMessage,
    ]
  );

  const handlePresetUsed = useCallback(() => {
    const { clearPresetMessage } = useAppStore.getState();
    clearPresetMessage();
  }, []);

  return (
    <div
      className={CONSTANTS.STYLES.MAIN_CONTAINER}
      style={{ height: 'calc(100% - 6rem)' }}
    >
      <ChatHeader
        showNewChatButton={true}
        selectedModel={selectedModel || undefined}
        availableModels={availableModels}
        onModelChange={handleModelChange}
        showModelSelector={true}
        preloadedChatHistory={chatHistory}
        isWelcomeMode={isWelcomeMode}
        onNewChat={isWelcomeMode ? handleNewChat : undefined}
        hasMessages={hasAssistantMessages}
        isStreaming={isStreaming}
      />

      {selectedModel ? (
        isLoadingMessages ? (
          <MessageAreaSkeleton />
        ) : (
          <MessageList
            messages={messages}
            selectedModel={selectedModel}
            showWelcome={showWelcomeScreen}
            userNickname={userNickname}
            className={CONSTANTS.STYLES.FLEX_ONE}
            limitInfo={limitInfo}
            isGuest={isGuest}
          />
        )
      ) : (
        <MessageAreaSkeleton />
      )}

      {/* 단일 가이드 메시지 (우선순위 기반) */}
      {chatStatus.currentGuideMessage && (
        <ChatGuideMessage
          type={chatStatus.currentGuideMessage.type}
          guideMessageConfig={chatStatus.currentGuideMessage}
          onNavigateToStocks={
            chatStatus.currentGuideMessage.type === 'limit-reached'
              ? handleNavigateToStocks
              : undefined
          }
          onStartNewChat={
            chatStatus.currentGuideMessage.type === 'session-limit-reached'
              ? handleStartNewChat
              : undefined
          }
          onRetry={
            chatStatus.currentGuideMessage.type === 'request-failed'
              ? saveError
                ? clearSaveError
                : handleRetry
              : undefined
          }
        />
      )}

      {/* Session limit warning */}
      {sessionLimit?.can_continue &&
        sessionLimit.current_messages >= sessionLimit.max_messages - 5 && (
          <p className="text-xs text-neutral-600 text-center py-1">
            성능 최적화를 위한 채팅창 대화량 한도가 가까워집니다.
          </p>
        )}

      <MessageInput {...inputProps} onPresetUsed={handlePresetUsed} />
    </div>
  );
}
