'use client';

import { useState, useEffect, useCallback } from 'react';

export function AnalysisInfoModal() {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-neutral-900 underline"
      >
        분석 기준 안내
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={close}
        >
          <div
            className="relative bg-white rounded-xl shadow-lg w-full max-w-[396px] mx-4 p-5 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-base">분석 기준 안내</span>
              <button
                onClick={close}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-neutral-800 leading-relaxed space-y-3">
              <p>본 서비스는 단기 매매용 분석이 아닙니다.</p>
              <p>중장기 투자를 전제로 설계된 퀀트 기반 분석 시스템과 멀티 AI 에이전트를 사용합니다.</p>
              <p>
                최소 60일 이후를 기준으로 알파(성과)를 판단하도록 설계되어 있으며,
                포트폴리오 구성, 개별 종목의 종합 평가 등급, 그리고 투자 시나리오별 전략 등
                모든 정보는 이 기준을 따릅니다.
              </p>
              <p>
                예를 들어 &apos;매수&apos;로 평가된 종목은 단기 가격 변동을 예측하는 것이 아니라,
                60일 이후의 성과 가능성을 기준으로 분석된 결과입니다.
              </p>
              <p>
                따라서 단기적인 등락이나 60일 이전의 성과만으로 판단할 경우,
                본 시스템의 의도와 분석 결과를 온전히 반영하지 못할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
