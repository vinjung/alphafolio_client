'use client';

import { Text } from '@/components/shared/text';

// 조정 타입
export type AdjustmentType = '익절' | '청산' | '신규' | '추가' | '유지';

// 비중 조정 데이터 타입
export interface WeightAdjustment {
  stockName: string;
  currentWeight: number; // 퍼센트 (0-100)
  targetWeight: number; // 퍼센트 (0-100)
  adjustmentType: AdjustmentType;
}

interface WeightAdjustmentTableProps {
  adjustments: WeightAdjustment[];
}

export function TargetTable({ adjustments }: WeightAdjustmentTableProps) {
  // 조정 내용 계산 (퍼센트 포인트)
  const calculateAdjustment = (
    current: number,
    target: number
  ): { value: number; formatted: string } => {
    const diff = target - current;
    const sign = diff > 0 ? '+' : '';
    return {
      value: diff,
      formatted: `${sign}${diff.toFixed(1)}%p`,
    };
  };

  // 조정 타입별 색상 스타일
  const getAdjustmentColor = (diff: number): string => {
    if (diff > 0) return 'text-red-600'; // 증가
    if (diff < 0) return 'text-blue-600'; // 감소
    return 'text-neutral-700'; // 유지
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left border-b border-neutral-200">
                <Text variant="b3" className="text-neutral-700">
                  종목명
                </Text>
              </th>
              <th className="px-4 py-3 text-center border-b border-neutral-200">
                <Text variant="b3" className="text-neutral-700">
                  현재 비중
                </Text>
              </th>
              <th className="px-4 py-3 text-center border-b border-neutral-200">
                <Text variant="b3" className="text-neutral-700">
                  목표 비중
                </Text>
              </th>
              <th className="px-4 py-3 text-center border-b border-neutral-200">
                <Text variant="b3" className="text-neutral-700">
                  조정 내용
                </Text>
              </th>
            </tr>
          </thead>

          <tbody>
            {adjustments.map((item, index) => {
              const adjustment = calculateAdjustment(
                item.currentWeight,
                item.targetWeight
              );

              return (
                <tr key={`${item.stockName}-${index}`}>
                  {/* 종목명 */}
                  <td className="px-4 py-4 border-b border-neutral-100">
                    <Text variant="s2" className="text-neutral-1100">
                      {item.stockName}
                    </Text>
                  </td>

                  {/* 현재 비중 */}
                  <td className="px-4 py-4 text-center border-b border-neutral-100">
                    <Text variant="b2" className="text-neutral-1100">
                      {item.currentWeight}%
                    </Text>
                  </td>

                  {/* 목표 비중 */}
                  <td className="px-4 py-4 text-center border-b border-neutral-100">
                    <Text variant="b2" className="text-neutral-1100">
                      {item.targetWeight}%
                    </Text>
                  </td>

                  {/* 조정 내용 */}
                  <td className="px-4 py-4 text-center border-b border-neutral-100">
                    <Text
                      variant="b4"
                      className={`font-medium ${getAdjustmentColor(adjustment.value)}`}
                    >
                      {adjustment.formatted}({item.adjustmentType})
                    </Text>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
