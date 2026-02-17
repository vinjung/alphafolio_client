'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Text } from '@/components/shared/text';

const GRADE_MAP: Record<string, number> = {
  '강력 매도': 1,
  '매도': 2,
  '매도 고려': 3,
  '중립': 4,
  '매수 고려': 5,
  '매수': 6,
  '강력 매수': 7,
};

const GRADE_LABELS: Record<number, string> = {
  1: '강력 매도',
  2: '매도',
  3: '매도 고려',
  4: '중립',
  5: '매수 고려',
  6: '매수',
  7: '강력 매수',
};

type ChartDataPoint = {
  date: string;
  grade: number;
  gradeName: string;
};

interface GradeTrendChartProps {
  symbol: string;
}

export function GradeTrendChart({ symbol }: GradeTrendChartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ChartDataPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  // 모달 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleOpen = async () => {
    setIsOpen(true);

    if (data) return;

    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/stock/grade-history?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const history: { date: string; finalGrade: string | null }[] = json.data ?? [];

      const chartData: ChartDataPoint[] = history
        .filter((item) => item.finalGrade && GRADE_MAP[item.finalGrade] !== undefined)
        .map((item) => ({
          date: item.date,
          grade: GRADE_MAP[item.finalGrade!],
          gradeName: item.finalGrade!,
        }))
        .reverse();

      setData(chartData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const xTickLabels = (() => {
    if (!data) return [];
    if (data.length <= 4) return data.map((t) => t.date);
    const indices = [0, 3, 6, data.length - 1].filter((i) => i < data.length);
    const uniqueIndices = [...new Set(indices)];
    return data.map((t, i) => (uniqueIndices.includes(i) ? t.date : ''));
  })();

  return (
    <>
      <button
        onClick={handleOpen}
        className="px-2 py-1 text-xs rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 whitespace-nowrap"
      >
        등급 추세
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={close}
        >
          <div
            className="relative bg-white rounded-xl shadow-lg w-full max-w-[396px] mx-4 p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <Text variant="s1">등급 추세</Text>
              <button
                onClick={close}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                ✕
              </button>
            </div>

            {/* 로딩 */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Text variant="b2" className="text-neutral-500">로딩 중...</Text>
              </div>
            )}

            {/* 차트 */}
            {!loading && data && data.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(_, index) => xTickLabels[index] ?? ''}
                    interval={0}
                  />
                  <YAxis
                    domain={[1, 7]}
                    ticks={[1, 2, 3, 4, 5, 6, 7]}
                    tickFormatter={(value: number) => GRADE_LABELS[value] ?? ''}
                    tick={{ fontSize: 10 }}
                    width={60}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const point = payload[0].payload as ChartDataPoint;
                      return (
                        <div className="bg-white border border-neutral-200 rounded px-2 py-1 shadow-sm">
                          <Text variant="b3">{point.date}</Text>
                          <Text variant="b2" className="font-semibold">{point.gradeName}</Text>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="grade"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {/* 데이터 없음 */}
            {!loading && data && data.length === 0 && (
              <div className="py-12 text-center">
                <Text variant="b3" className="text-neutral-500">등급 이력이 없습니다.</Text>
              </div>
            )}

            {/* 에러 */}
            {!loading && error && (
              <div className="py-12 text-center">
                <Text variant="b3" className="text-red-500">등급 이력을 불러올 수 없습니다.</Text>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
