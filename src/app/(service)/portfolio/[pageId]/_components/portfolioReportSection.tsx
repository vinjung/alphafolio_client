'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { Text } from '@/components/shared/text';
import { InfoPopover } from '@/components/shared/info-popover';
import type { DailyReportData } from '@/lib/server/portfolio';

interface PortfolioReportSectionProps {
  portfolioId: string;
  reportDate: string | null;
  dailyReport: DailyReportData | null;
  country: string;
}

/**
 * Get localStorage key for portfolio report last seen date
 */
function getStorageKey(portfolioId: string): string {
  return `portfolio:lastSeen:${portfolioId}`;
}

/**
 * Check if the report is new (not seen before)
 */
function isNewReport(portfolioId: string, reportDate: string | null): boolean {
  if (!reportDate) return false;

  if (typeof window === 'undefined') return false;

  const lastSeen = localStorage.getItem(getStorageKey(portfolioId));
  return lastSeen !== reportDate;
}

/**
 * Mark the report as seen
 */
function markReportAsSeen(portfolioId: string, reportDate: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(getStorageKey(portfolioId), reportDate);
}

export function PortfolioReportSection({
  portfolioId,
  reportDate,
  dailyReport,
  country,
}: PortfolioReportSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [showNewIcon, setShowNewIcon] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  // Check if report is new on mount
  useEffect(() => {
    setShowNewIcon(isNewReport(portfolioId, reportDate));
  }, [portfolioId, reportDate]);

  // IntersectionObserver to detect when section is visible
  useEffect(() => {
    if (!reportDate || hasBeenSeen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenSeen) {
            // User has seen the report section
            markReportAsSeen(portfolioId, reportDate);
            setShowNewIcon(false);
            setHasBeenSeen(true);
          }
        });
      },
      {
        threshold: 0.5, // 50% of section visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [portfolioId, reportDate, hasBeenSeen]);

  return (
    <section ref={sectionRef} className="bg-white shadow-sm rounded-lg">
      <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 rounded-t-lg">
        <div className="flex flex-row justify-between items-center">
          <div className="flex items-center gap-1">
              <Text variant="s1">📊 포트폴리오 리포트</Text>
              <InfoPopover content="매 거래일마다 포트폴리오 운영 현황을 리뷰합니다." iconSize={14} />
            </div>
          <div className="flex flex-row justify-between gap-1 items-center">
            {showNewIcon && <Icon.new size={14} />}
            <Text variant="b3">
              <span className="text-neutral-600">업데이트 |</span>
              {reportDate || '-'}
            </Text>
          </div>
        </div>
      </div>
      <div className="px-4 py-4">
        <div className="flex flex-col gap-3">
        {dailyReport ? (
          <>
            {/* 포트폴리오 요약 */}
            {dailyReport.portfolio_summary && (
              <div className="flex flex-col gap-1 p-3 bg-neutral-50 rounded-lg">
                <div className="flex justify-between">
                  <Text variant="b2" className="text-neutral-600">누적 수익률</Text>
                  <Text variant="s2" className={dailyReport.portfolio_summary.cumulative_return >= 0 ? 'text-red-500' : 'text-blue-500'}>
                    {dailyReport.portfolio_summary.cumulative_return >= 0 ? '+' : ''}{dailyReport.portfolio_summary.cumulative_return.toFixed(2)}%
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text variant="b2" className="text-neutral-600">오늘 수익률</Text>
                  <Text variant="s2" className={dailyReport.portfolio_summary.total_return_today >= 0 ? 'text-red-500' : 'text-blue-500'}>
                    {dailyReport.portfolio_summary.total_return_today >= 0 ? '+' : ''}{dailyReport.portfolio_summary.total_return_today.toFixed(2)}%
                  </Text>
                </div>
                <div className="flex justify-between">
                  <Text variant="b2" className="text-neutral-600">벤치마크 대비</Text>
                  <Text variant="s2" className={dailyReport.portfolio_summary.excess_return_cumulative >= 0 ? 'text-red-500' : 'text-blue-500'}>
                    {dailyReport.portfolio_summary.excess_return_cumulative >= 0 ? '+' : ''}{dailyReport.portfolio_summary.excess_return_cumulative.toFixed(2)}%
                  </Text>
                </div>
              </div>
            )}

            {/* 시장 현황 (market_sentiment) */}
            {dailyReport.market_sentiment && (
              <div className="flex flex-col gap-2 mt-4">
                <Text variant="s1"><span className="mr-1">📊</span>시장 현황</Text>
                <div className="flex flex-col gap-1 p-3 bg-neutral-50 rounded-lg">
                  <div className="flex justify-between">
                    <Text variant="b2" className="text-neutral-600">벤치마크</Text>
                    <Text variant="s2">
                      {dailyReport.market_sentiment.benchmark_name}
                      {dailyReport.market_sentiment.benchmark_change !== null && (
                        <span className={dailyReport.market_sentiment.benchmark_change >= 0 ? 'text-red-500 ml-1' : 'text-blue-500 ml-1'}>
                          ({dailyReport.market_sentiment.benchmark_change >= 0 ? '+' : ''}{dailyReport.market_sentiment.benchmark_change.toFixed(2)}%)
                        </span>
                      )}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="b2" className="text-neutral-600">전반적 시장</Text>
                    <Text variant="s2">
                      {dailyReport.market_sentiment.overall === 'bullish' ? '낙관' :
                       dailyReport.market_sentiment.overall === 'neutral' ? '중립' :
                       dailyReport.market_sentiment.overall === 'cautious' ? '경계' :
                       dailyReport.market_sentiment.overall === 'bearish' ? '비관' :
                       dailyReport.market_sentiment.overall}
                    </Text>
                  </div>
                  {dailyReport.market_sentiment.fear_index && (
                    <div className="flex justify-between">
                      <Text variant="b2" className="text-neutral-600">공포 지수</Text>
                      <Text variant="s2">{dailyReport.market_sentiment.fear_index.detail}</Text>
                    </div>
                  )}
                  {dailyReport.market_sentiment.investor_flow && (
                    <div className="flex justify-between">
                      <Text variant="b2" className="text-neutral-600">투자자 동향</Text>
                      <Text variant="s2" className="text-right">
                        {dailyReport.market_sentiment.investor_flow.detail.split(', ').map((item, idx) => (
                          <span key={idx} className="block">{item}</span>
                        ))}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 수급 동향 (holdings_flow) - KR only */}
            {country !== 'US' && dailyReport.holdings_flow && (
              <div className="flex flex-col gap-2 mt-4">
                <Text variant="s1"><span className="mr-1">💰</span>수급 동향</Text>
                <div className="flex flex-col gap-1 p-3 bg-neutral-50 rounded-lg">
                  <div className="flex justify-between">
                    <Text variant="b2" className="text-neutral-600">외국인 순매수</Text>
                    <Text variant="s2" className="text-red-500">{dailyReport.holdings_flow.foreign_net_buy_count}종목</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="b2" className="text-neutral-600">외국인 순매도</Text>
                    <Text variant="s2" className="text-blue-500">{dailyReport.holdings_flow.foreign_net_sell_count}종목</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="b2" className="text-neutral-600">기관 순매수</Text>
                    <Text variant="s2" className="text-red-500">{dailyReport.holdings_flow.institution_net_buy_count}종목</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="b2" className="text-neutral-600">기관 순매도</Text>
                    <Text variant="s2" className="text-blue-500">{dailyReport.holdings_flow.institution_net_sell_count}종목</Text>
                  </div>
                </div>
              </div>
            )}

            {/* 기술적 분석 요약 (technical_summary) */}
            {dailyReport.technical_summary && (
              <div className="flex flex-col gap-2 mt-4">
                <Text variant="s1"><span className="mr-1">📈</span>기술적 분석 요약</Text>
                <div className="flex flex-col gap-1 p-3 bg-neutral-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between">
                      <Text variant="b2" className="text-neutral-600">과매수</Text>
                      <Text variant="s2">{dailyReport.technical_summary.overbought_count}종목</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text variant="b2" className="text-neutral-600">과매도</Text>
                      <Text variant="s2">{dailyReport.technical_summary.oversold_count}종목</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text variant="b2" className="text-neutral-600">상단 밴드 이탈</Text>
                      <Text variant="s2">{dailyReport.technical_summary.above_upper_band}종목</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text variant="b2" className="text-neutral-600">하단 밴드 이탈</Text>
                      <Text variant="s2">{dailyReport.technical_summary.below_lower_band}종목</Text>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 보유종목 등급 변화 (holdings_grade_change) */}
            {dailyReport.holdings_grade_change && (
              <div className="flex flex-col gap-2 mt-4">
                <Text variant="s1"><span className="mr-1">⭐</span>보유종목 등급 변화</Text>
                <div className="flex flex-col gap-1 p-3 bg-neutral-50 rounded-lg">
                  <div className="flex justify-between">
                    <Text variant="b2" className="text-neutral-600">등급 상승</Text>
                    <Text variant="s2" className="text-red-500">{dailyReport.holdings_grade_change.upgraded_count}종목</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="b2" className="text-neutral-600">등급 유지</Text>
                    <Text variant="s2">{dailyReport.holdings_grade_change.unchanged_count}종목</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="b2" className="text-neutral-600">등급 하락</Text>
                    <Text variant="s2" className="text-blue-500">{dailyReport.holdings_grade_change.downgraded_count}종목</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text variant="b2" className="text-neutral-600">평균 점수 변화</Text>
                    <Text variant="s2" className={dailyReport.holdings_grade_change.avg_score_change >= 0 ? 'text-red-500' : 'text-blue-500'}>
                      {dailyReport.holdings_grade_change.avg_score_change >= 0 ? '+' : ''}{dailyReport.holdings_grade_change.avg_score_change.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </div>
            )}

            {/* 건강한 신호 */}
            {dailyReport.healthy_signals && dailyReport.healthy_signals.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                <Text variant="s1"><span className="mr-1">🟢</span>건강한 신호 ({dailyReport.healthy_signals.length}개)</Text>
                <ul role="list" className="list-disc ml-6 text-b2">
                  {dailyReport.healthy_signals.map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.signal}</span>
                      <span className="text-neutral-500 ml-1">- {item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 관찰 신호 */}
            {dailyReport.watch_signals && dailyReport.watch_signals.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                <Text variant="s1"><span className="mr-1">🟡</span>관찰 신호 ({dailyReport.watch_signals.length}개)</Text>
                <ul role="list" className="list-disc ml-6 text-b2">
                  {dailyReport.watch_signals.map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.signal}</span>
                      <span className="text-neutral-500 ml-1">- {item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 주의 신호 */}
            {dailyReport.risk_signals && dailyReport.risk_signals.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                <Text variant="s1"><span className="mr-1">🔴</span>주의 신호 ({dailyReport.risk_signals.length}개)</Text>
                <ul role="list" className="list-disc ml-6 text-b2">
                  {dailyReport.risk_signals.map((item) => (
                    <li key={item.id}>
                      <span className="font-medium">{item.signal}</span>
                      <span className="text-neutral-500 ml-1">- {item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 리밸런싱 상태 */}
            {dailyReport.rebalancing_status && (
              <div className="flex flex-col gap-2 mt-4">
                <Text variant="s1"><span className="mr-1">📋</span>리밸런싱 상태</Text>
                <Text variant="b2" className="text-neutral-700">
                  {dailyReport.rebalancing_status.summary}
                </Text>
              </div>
            )}
          </>
        ) : (
          <Text variant="b2" className="text-neutral-500">
            리포트가 아직 생성되지 않았습니다.
          </Text>
        )}
        </div>
      </div>
    </section>
  );
}
