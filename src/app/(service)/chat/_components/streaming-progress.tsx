'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingDots } from '@/components/shared/loading-dots';

const PROGRESS_STEPS = [
  { message: '질문을 분석하고 있습니다...', duration: 5000 },
  { message: '관련 데이터를 검색하고 있습니다...', duration: 5000 },
  { message: '데이터를 조회하고 있습니다...', duration: 5000 },
  { message: '데이터 조회를 준비하고 있습니다...', duration: 5000 },
  { message: '시장 정보를 보충하고 있습니다...', duration: 10000 },
  { message: '최신 뉴스와 공시를 확인하고 있습니다...', duration: 10000 },
  { message: '수집한 정보를 종합 분석하고 있습니다...', duration: 10000 },
  { message: '답변을 작성하고 있습니다...', duration: 15000 },
  { message: '최적의 답변을 준비하고 있습니다...', duration: 20000 },
  { message: '거의 다 준비되었습니다...', duration: null },
] as const;

// Module-level: persists across component remounts within the same streaming session
let streamingStartTime: number | null = null;

// Pre-calculate cumulative time thresholds for each step
const STEP_THRESHOLDS: number[] = [];
let _acc = 0;
for (const step of PROGRESS_STEPS) {
  STEP_THRESHOLDS.push(_acc);
  if (step.duration) _acc += step.duration;
}

/** Get the correct step index based on elapsed time */
function getStepIndex(elapsed: number): number {
  for (let i = PROGRESS_STEPS.length - 1; i >= 0; i--) {
    if (elapsed >= STEP_THRESHOLDS[i]) return i;
  }
  return 0;
}

/** Get ms until the next step transition */
function getMsUntilNextStep(elapsed: number): number | null {
  const currentIndex = getStepIndex(elapsed);
  if (currentIndex >= PROGRESS_STEPS.length - 1) return null;
  if (!PROGRESS_STEPS[currentIndex].duration) return null;
  return STEP_THRESHOLDS[currentIndex + 1] - elapsed;
}

/** Reset progress when a new streaming session starts */
export function resetStreamingProgress() {
  streamingStartTime = null;
}

export function StreamingProgress() {
  // Initialize start time on first mount of a streaming session
  if (!streamingStartTime) {
    streamingStartTime = Date.now();
  }

  const [, forceUpdate] = useState(0);
  const elapsed = Date.now() - streamingStartTime;
  const currentIndex = getStepIndex(elapsed);

  useEffect(() => {
    const now = Date.now() - (streamingStartTime ?? Date.now());
    const msUntilNext = getMsUntilNextStep(now);
    if (msUntilNext === null) return;

    const timer = setTimeout(() => {
      forceUpdate((n) => n + 1);
    }, msUntilNext);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <div className="flex items-center gap-2 py-2">
      <LoadingDots />
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          className="text-sm text-neutral-500"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [1, 0.4, 1],
            transition: {
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.2 },
          }}
        >
          {PROGRESS_STEPS[currentIndex].message}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
