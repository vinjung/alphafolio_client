'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ModelApiConfig } from '@/app/(service)/chat/_config/models';
import type { VisualizationData } from '@/types/chart';

interface PollEvent {
  id: string;
  type: 'chunk' | 'complete' | 'error' | 'status';
  content?: string;
  full_response?: string;
  error?: string;
  visualization?: VisualizationData | null;
  metadata?: {
    visualization?: VisualizationData | null;
    [key: string]: unknown;
  };
  status?: string;
}

interface PollResponse {
  events: PollEvent[];
  last_id: string;
  status: 'processing' | 'completed' | 'failed';
}

interface CurrentJob {
  job_id: string;
  session_id: string;
}

interface UseChatStreamResult {
  response: string;
  isStreaming: boolean;
  error: string | null;
  visualization: VisualizationData | null;
  currentJob: CurrentJob | null;
  sendMessage: (message: string, modelConfig?: ModelApiConfig, sessionId?: string | null) => Promise<void>;
  disconnect: () => void;
  resumePolling: (jobId: string, sessionId?: string) => void;
}

const POLL_INTERVAL = 2000; // 2초 폴링 간격

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useChatStream(): UseChatStreamResult {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualization, setVisualization] = useState<VisualizationData | null>(null);
  const [currentJob, setCurrentJob] = useState<CurrentJob | null>(null);

  const router = useRouter();
  const pollingRef = useRef(false);
  const cancelledRef = useRef(false);
  const pollerIdRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount: kill any running poller and abort in-flight fetch
  useEffect(() => {
    return () => {
      pollingRef.current = false;
      cancelledRef.current = true;
      abortControllerRef.current?.abort();
    };
  }, []);

  const disconnect = useCallback(() => {
    // 폴링 중단 (백그라운드 생성은 계속됨)
    pollingRef.current = false;
    cancelledRef.current = true;
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setError(null);
  }, []);

  const pollForEvents = useCallback(
    async (jobId: string) => {
      // Cancel-and-replace: invalidate any previous poller
      const myPollerId = ++pollerIdRef.current;

      // Abort any previous in-flight fetch and create new controller
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let lastId = '0';
      pollingRef.current = true;
      cancelledRef.current = false;
      let skipDelay = false;
      let completedEmptyRetries = 0;
      const MAX_COMPLETED_EMPTY_RETRIES = 3;

      console.log('[Poll] Start polling for job:', jobId, 'pollerId:', myPollerId);

      while (pollingRef.current && !cancelledRef.current) {
        // Stale poller check: a newer pollForEvents call superseded this one
        if (pollerIdRef.current !== myPollerId) return;

        // 이벤트가 있을 때는 대기 없이 즉시 재폴링 (빠른 이벤트 드레인)
        if (!skipDelay) {
          await sleep(POLL_INTERVAL);
        }
        skipDelay = false;

        if (!pollingRef.current || cancelledRef.current) break;
        if (pollerIdRef.current !== myPollerId) return;

        try {
          const pollRes = await fetch(
            `/api/chat/job/${jobId}/stream?last_id=${lastId}`,
            { signal: controller.signal }
          );

          if (!pollRes.ok) {
            if (pollRes.status === 401) {
              router.push('/');
              return;
            }
            throw new Error(`Polling error: ${pollRes.status}`);
          }

          const data: PollResponse = await pollRes.json();
          lastId = data.last_id;

          console.log('[Poll] Response:', {
            status: data.status,
            eventCount: data.events.length,
            lastId: data.last_id,
            completedEmptyRetries,
          });

          let receivedComplete = false;

          for (const event of data.events) {
            if (event.type === 'chunk' && event.content) {
              setResponse((prev) => prev + event.content);
            } else if (event.type === 'complete') {
              // full_response가 있으면 최종 응답으로 대체
              if (event.full_response) {
                setResponse(event.full_response);
              }

              // visualization 처리
              const vizData =
                event.visualization || event.metadata?.visualization || null;
              if (vizData) {
                setVisualization(vizData);
              }

              receivedComplete = true;
              pollingRef.current = false;
              break;
            } else if (event.type === 'error') {
              const errorMessage =
                event.error || '서버 처리 중 오류가 발생했습니다.';
              throw new Error(errorMessage);
            }
          }

          // complete 이벤트를 받았으면 즉시 종료
          if (receivedComplete) break;

          // 작업이 완료/실패 상태일 때: 남은 이벤트가 없으면 재시도 후 폴링 중단
          // 남은 이벤트가 있으면 계속 폴링하여 complete 이벤트까지 소진
          if (data.status === 'completed' || data.status === 'failed') {
            if (data.events.length === 0) {
              completedEmptyRetries++;
              if (completedEmptyRetries >= MAX_COMPLETED_EMPTY_RETRIES) {
                // 재시도 후에도 이벤트 없음 - 안전하게 중단
                pollingRef.current = false;

                if (data.status === 'failed') {
                  throw new Error('작업이 실패했습니다. 다시 시도해주세요.');
                }

                // Fallback: Redis stream missed events, fetch from DB
                const sid = sessionIdRef.current;
                console.log('[Poll] Fallback triggered:', { status: data.status, sessionId: sid, retries: completedEmptyRetries });
                if (data.status === 'completed' && sid) {
                  try {
                    const historyRes = await fetch(
                      `/api/chat/messages/${sid}`
                    );
                    if (historyRes.ok) {
                      const historyData = await historyRes.json();
                      if (historyData.success && historyData.data?.messages) {
                        const msgs = historyData.data.messages;
                        const lastAssistant = [...msgs]
                          .reverse()
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          .find((m: any) => m.role === 'assistant');
                        if (lastAssistant?.content) {
                          console.log('[Poll] Fallback success:', { contentLen: lastAssistant.content.length, hasViz: !!lastAssistant.visualization });
                          setResponse(lastAssistant.content);
                          if (lastAssistant.visualization) {
                            setVisualization(lastAssistant.visualization);
                          }
                        } else {
                          console.log('[Poll] Fallback: no assistant message found in DB');
                        }
                      }
                    }
                  } catch (fallbackErr) {
                    console.log('[Poll] Fallback fetch failed:', fallbackErr);
                  }
                }
              } else {
                // Race condition 방어: 이벤트가 아직 Redis에 쓰이는 중일 수 있음
                skipDelay = false; // 2초 대기 후 재폴링
              }
            } else {
              completedEmptyRetries = 0;
              // 아직 읽을 이벤트가 남아있을 수 있음 - 대기 없이 즉시 재폴링
              skipDelay = true;
            }
          } else if (data.events.length > 0) {
            // processing 중이지만 이벤트가 있으면 빠르게 재폴링
            skipDelay = true;
          }
        } catch (err) {
          if (cancelledRef.current || pollerIdRef.current !== myPollerId) return;
          pollingRef.current = false;

          if (err instanceof Error) {
            setError(err.message);
            throw err;
          } else {
            const unknownError = new Error('알 수 없는 오류가 발생했습니다.');
            setError(unknownError.message);
            throw unknownError;
          }
        }
      }

      console.log('[Poll] Loop exited:', {
        polling: pollingRef.current,
        cancelled: cancelledRef.current,
        myPollerId,
        currentPollerId: pollerIdRef.current,
      });
    },
    [router]
  );

  const sendMessage = useCallback(
    async (
      message: string,
      modelConfig?: ModelApiConfig,
      sessionId?: string | null
    ) => {
      // 이전 폴링 중단
      if (isStreaming) {
        disconnect();
        await sleep(100);
      }

      setError(null);
      setResponse('');
      setVisualization(null);
      setIsStreaming(true);

      try {
        const requestBody: {
          message: string;
          modelConfig?: ModelApiConfig;
          sessionId?: string | null;
        } = {
          message,
          modelConfig: modelConfig || undefined,
          sessionId: sessionId || null,
        };

        // 1. 비동기 작업 생성 (POST)
        const res = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        // 401 에러 처리
        if (res.status === 401) {
          router.push('/');
          return;
        }

        if (!res.ok) {
          const errorText = await res.text();

          if (res.status === 429) {
            const errorData = JSON.parse(errorText);
            const limitInfo = errorData.limit || {};
            throw new Error(
              `일일 채팅 한도(${limitInfo.limit || 5}회)를 초과했습니다.`
            );
          }

          if (res.status === 503) {
            const busyError = new Error(
              '서버가 바쁩니다. 잠시 후 자동으로 재시도합니다.'
            ) as Error & { isServerBusy: boolean };
            busyError.isServerBusy = true;
            throw busyError;
          }

          const networkError = new Error(
            `네트워크 오류 (${res.status})`
          ) as Error & { isNetworkError: boolean };
          networkError.isNetworkError = true;
          throw networkError;
        }

        const { job_id, session_id } = await res.json();
        setCurrentJob({ job_id, session_id });
        sessionIdRef.current = session_id;

        // 2. 폴링 시작
        await pollForEvents(job_id);
      } catch (err) {
        if (cancelledRef.current) return;

        if (err instanceof Error) {
          setError(err.message);
          throw err;
        } else {
          const unknownError = new Error('알 수 없는 오류가 발생했습니다.');
          setError(unknownError.message);
          throw unknownError;
        }
      } finally {
        setIsStreaming(false);
        pollingRef.current = false;
      }
    },
    [isStreaming, disconnect, router, pollForEvents]
  );

  const resumePolling = useCallback(
    (jobId: string, sessionId?: string) => {
      // Guard: if already polling, skip to prevent duplicate pollers
      if (pollingRef.current) {
        return;
      }

      if (sessionId) {
        sessionIdRef.current = sessionId;
      }

      setIsStreaming(true);
      setResponse('');
      setVisualization(null);
      setError(null);

      pollForEvents(jobId)
        .catch((err) => {
          if (err instanceof Error) {
            setError(err.message);
          }
        })
        .finally(() => {
          setIsStreaming(false);
        });
    },
    [pollForEvents]
  );

  return {
    response,
    isStreaming,
    error,
    visualization,
    currentJob,
    sendMessage,
    disconnect,
    resumePolling,
  };
}
