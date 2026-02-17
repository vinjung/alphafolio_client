'use client';

import { useState, useEffect, useCallback } from 'react';
import { Text } from '@/components/shared/text';
import { Button } from '@/components/shared/button';
import { useRouter } from 'next/navigation';

type GenerationStatus = 'idle' | 'started' | 'already_running' | 'error';

interface StrategyGeneratorProps {
  symbol: string;
  market: 'KR' | 'US';
}

const POLL_INTERVAL = 5000; // 5 seconds

export function StrategyGenerator({ symbol, market }: StrategyGeneratorProps) {
  const router = useRouter();
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [message, setMessage] = useState<string>('');
  const [isPolling, setIsPolling] = useState(false);

  // Check if already running when component mounts
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/stock-agents/status/${symbol}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'running') {
            setStatus('already_running');
            setMessage(`현재 ${symbol} 전략이 생성 중입니다. 잠시만 기다려 주세요.`);
            setIsPolling(true);
          }
        }
      } catch {
        // API not available, show button
        console.log('Stock agents API not available');
      }
    };

    checkStatus();
  }, [symbol]);

  // Poll for completion
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/stock-agents/status/${symbol}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'idle') {
            // Generation completed, refresh page
            setIsPolling(false);
            router.refresh();
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [isPolling, symbol, router]);

  const handleGenerate = useCallback(async () => {
    setStatus('started');
    setMessage('멀티 AI 에이전트가 투자 전략을 생성 중입니다. 2~3분 소요 예정입니다.');
    setIsPolling(true);

    try {
      const response = await fetch('/api/stock-agents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          market,
        }),
      });

      if (response.status === 401) {
        setStatus('error');
        setMessage('로그인이 필요합니다.');
        setIsPolling(false);
        return;
      }

      if (response.status === 403) {
        setStatus('error');
        setMessage('유료회원 전용 기능입니다.');
        setIsPolling(false);
        return;
      }

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setStatus(data.status);
      setMessage(data.message);

      if (data.status === 'completed') {
        // Already completed, refresh immediately
        setIsPolling(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Generation error:', error);
      setStatus('error');
      setMessage('전략 생성 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      setIsPolling(false);
    }
  }, [symbol, market, router]);

  // State A: Show button
  if (status === 'idle') {
    return (
      <div className="py-8 text-center">
        <Text variant="b2" className="text-neutral-500 whitespace-pre-line">
          {'멀티 AI 에이전트 시스템이 시장 정보를 분석하여\n강세·횡보·약세 3가지 시장 국면별\n실행 가능한 트레이딩 전략을 자동 생성합니다.'}
        </Text>
        <Button
          variant="gradient"
          size="md"
          className="mt-4"
          onClick={handleGenerate}
        >
          AI 투자 전략 생성하기
        </Button>
      </div>
    );
  }

  // State B: Show generating message
  if (status === 'started' || status === 'already_running') {
    return (
      <div className="py-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900" />
        </div>
        <Text variant="b1" className="text-neutral-700 whitespace-pre-line">
          {message || '멀티 AI 에이전트가 투자 전략을 생성 중입니다.\n2~3분 소요 예정입니다.'}
        </Text>
        <Text variant="b3" className="text-neutral-500 mt-2">
          페이지를 떠나도 생성이 진행됩니다.
        </Text>
      </div>
    );
  }

  // State: Error
  if (status === 'error') {
    return (
      <div className="py-8 text-center">
        <Text variant="b2" className="text-red-500 whitespace-pre-line mb-4">
          {message}
        </Text>
        <Button
          variant="gradient"
          size="md"
          onClick={handleGenerate}
        >
          다시 시도하기
        </Button>
      </div>
    );
  }

  return null;
}
