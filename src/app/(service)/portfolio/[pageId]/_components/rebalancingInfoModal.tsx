'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Modal } from '@/components/shared/modal';
import { Text } from '@/components/shared/text';

export function RebalancingInfoButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 rounded-full hover:bg-neutral-100 transition-colors"
        aria-label="리밸런싱 운영 원칙 보기"
        type="button"
      >
        <Icon.info size={14} className="text-neutral-500" />
      </button>

      <Modal
        isVisible={isOpen}
        onCloseAction={() => setIsOpen(false)}
        title="리밸런싱 운영 원칙"
        variant="bottom"
        size="full"
      >
        <div className="px-4 py-4 space-y-6">
          {/* 운영 원칙 */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">•</span>
              <div>
                <Text variant="s2" className="text-neutral-900">매일 모니터링, 신중하게 실행</Text>
                <Text variant="b3" className="text-neutral-600 mt-0.5">
                  급변하는 시장에 대응하기 위해 리밸런싱 트리거는 매 거래일 자동으로 점검됩니다.
                  단, 60일 이상 장기 투자 관점에서 설계된 보수적 기준을 충족해야만 실행됩니다.
                </Text>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">•</span>
              <div>
                <Text variant="s2" className="text-neutral-900">예상 실행 빈도</Text>
                <Text variant="b3" className="text-neutral-600 mt-0.5">
                  보수적인 트리거 기준으로 인해 실제 리밸런싱은 월 1회 내외로 예상됩니다.
                  (시장 상황에 따라 달라질 수 있음)
                </Text>
              </div>
            </div>
          </div>

          {/* 거래 비용 구조 */}
          <div className="space-y-3">
            <Text variant="s1" className="text-neutral-900">거래 비용 구조</Text>
            <Text variant="b3" className="text-neutral-600">
              리밸런싱 시 발생하는 총 비용(수수료 + 세금 + 슬리피지)은 다음과 같이 반영됩니다.
            </Text>

            {/* 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="px-2 py-2 text-left font-medium text-neutral-700 border-b border-neutral-200">시장</th>
                    <th className="px-2 py-2 text-left font-medium text-neutral-700 border-b border-neutral-200">거래</th>
                    <th className="px-2 py-2 text-left font-medium text-neutral-700 border-b border-neutral-200">총 비용 구성</th>
                    <th className="px-2 py-2 text-right font-medium text-neutral-700 border-b border-neutral-200">예상 총비용</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-600">
                  <tr>
                    <td className="px-2 py-2 border-b border-neutral-100">KR</td>
                    <td className="px-2 py-2 border-b border-neutral-100">매수</td>
                    <td className="px-2 py-2 border-b border-neutral-100 text-xs">수수료 0.015% + 슬리피지 0.1%</td>
                    <td className="px-2 py-2 border-b border-neutral-100 text-right">~0.115%</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 border-b border-neutral-100">KR</td>
                    <td className="px-2 py-2 border-b border-neutral-100">매도</td>
                    <td className="px-2 py-2 border-b border-neutral-100 text-xs">수수료 0.015% + 거래세 0.18% + 농특세 0.15% + 슬리피지 0.1%</td>
                    <td className="px-2 py-2 border-b border-neutral-100 text-right">~0.445%</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 border-b border-neutral-100">US</td>
                    <td className="px-2 py-2 border-b border-neutral-100">매수</td>
                    <td className="px-2 py-2 border-b border-neutral-100 text-xs">수수료 0.25% + 환전 0.25% + 슬리피지 0.1%</td>
                    <td className="px-2 py-2 border-b border-neutral-100 text-right">~0.6%</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2">US</td>
                    <td className="px-2 py-2">매도</td>
                    <td className="px-2 py-2 text-xs">수수료 0.25% + 환전 0.25% + SEC Fee + 슬리피지 0.1%</td>
                    <td className="px-2 py-2 text-right">~0.6%+</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Text variant="b3" className="text-neutral-500 mt-2">
              ※ 장기 수익 최적화와 비용 효율성을 최우선으로 설계되었습니다.
            </Text>
          </div>

          {/* 미국 주식 세금 안내 */}
          <div className="space-y-3">
            <Text variant="s1" className="text-neutral-900">💰 미국 주식 세금 안내</Text>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-neutral-500 mt-0.5">•</span>
                <Text variant="b3" className="text-neutral-600">
                  올해 거래 → 내년 5월 1~31일 홈택스 신고
                </Text>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neutral-500 mt-0.5">•</span>
                <Text variant="b3" className="text-neutral-600">
                  연간 순차익 - 250만원 공제 × 22%
                </Text>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-neutral-500 mt-0.5">•</span>
                <Text variant="b3" className="text-neutral-600">
                  미실현 수익(보유중 상승)은 과세 안됨
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
