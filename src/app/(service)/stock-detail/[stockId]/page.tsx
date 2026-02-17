import { Text } from '@/components/shared/text';
import Badge from '@/components/shared/badge';
import { FavoriteButton } from '@/components/shared/favorite-button';
import { TradingViewChart } from '../_components/tradingViewChart';
import { BackButton } from '../_components/back-button';
import { StrategyGenerator } from '../_components/strategy-generator';
import { Footer } from '@/components/shared/footer';
import { InfoPopover } from '@/components/shared/info-popover';
import { GradeTrendChart } from '../_components/grade-trend-chart';
import { getStockDetailCached } from '@/lib/server/stock';
import { checkFavoriteStatus } from '@/lib/server/favorite';
import { getCurrentSession } from '@/lib/server/session';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const PRICE_INFO = `'떡상' 서비스의 모든 정보는 6개월 이상 중장기 투자 관점을 기준으로 설계되었습니다. 한국, 미국 종목 모두 장마감 후 데이터를 제공하며 한국 종목은 20:00, 미국 종목은 15:30에 업데이트 됩니다.`;

const AI_OPINION_INFO = `종목의 다양한 지표를 분석한 결과로 빠른 투자 현황 파악을 돕습니다.`;

const GRADE_INFO = `6개월 이상 투자기간을 기준으로 자체 퀀트 분석 시스템이 가치·품질·모멘텀·성장 4대 멀티팩터를 종합 평가합니다.
최종 등급은 '강력 매수'부터 '강력 매도'까지 7단계로 제시됩니다.`;

const SCENARIO_INFO = `한국 종목은 20:00, 미국 종목은 15:30에 업데이트됩니다.`;

const ALT_STOCK_INFO = `종합 평가 등급이 '매도 고려', '매도', '강력 매도'인 경우에만 산업, 섹터 등을 고려하여 매수 등급 종목이 제공됩니다.`;

// Strategy 타입 정의
type ScenarioData = {
  probability: number;
  take_profit: number | null;
  stop_loss: number | string | null;
  expected_return: string;
  support_level: number;
  resistance_level: number;
  sample_count: number;
};

type ScenarioNarrative = {
  title: string;
  strategy: string;
  triggers: string[];
  risk_factors: string[];
  monitoring_points: string[];
  confidence_rationale: string;
  probability_explanation: string;
};

type Scenario = {
  data: ScenarioData;
  narrative: ScenarioNarrative;
};

type TechnicalSummaryData = {
  adx: number;
  ma5: number;
  rsi: number;
  ma20: number;
  ma50: number;
  ma60: number;
  ma200: number;
  volume_ratio: number;
  current_price: number;
  macd_histogram: number;
  bollinger_lower: number;
  bollinger_upper: number;
  foreign_consecutive_buy: number;
  institutional_consecutive_buy: number;
};

type TechnicalSummaryNarrative = {
  indicators: string;
  price_trend: string;
  investor_flow: string;
  volume_analysis: string;
};

type MarketEnvironmentData = {
  vix: number;
  regime: string;
  usd_krw: number | null;
  fed_rate: number;
  vix_status: string;
  dollar_index: number;
  korea_base_rate: number;
};

type MarketEnvironmentNarrative = {
  sector: string;
  domestic: string;
  global_env: string;
  regime_interpretation: string;
};

type Strategy = {
  scenarios: {
    bullish: Scenario;
    sideways: Scenario;
    bearish: Scenario;
  };
  technical_summary: {
    data: TechnicalSummaryData;
    narrative: TechnicalSummaryNarrative;
  };
  market_environment: {
    data: MarketEnvironmentData;
    narrative: MarketEnvironmentNarrative;
  };
  analysis_date: string;
  final_grade: string;
};

type AltReason = {
  diff: number;
  text: string;
  category: string;
};

interface StockDetailPageProps {
  params: Promise<{ stockId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Format price with comma separator and currency
 */
function formatPrice(price: string | null, market: 'KR' | 'US'): string {
  if (!price) return '-';
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return '-';

  if (market === 'KR') {
    return `${Math.round(numPrice).toLocaleString('ko-KR')}원`;
  } else {
    return `$${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Format change rate with sign
 */
function formatChangeRate(rate: string | null): string {
  if (!rate) return '-';
  const numRate = parseFloat(rate);
  if (isNaN(numRate)) return '-';

  const sign = numRate >= 0 ? '+' : '';
  return `${sign}${numRate.toFixed(2)}%`;
}

/**
 * Get badge variant based on change rate
 */
function getBadgeVariant(rate: string | null): 'up' | 'down' | 'default' {
  if (!rate) return 'default';
  const numRate = parseFloat(rate);
  if (isNaN(numRate)) return 'default';

  if (numRate > 0) return 'up';
  if (numRate < 0) return 'down';
  return 'default';
}

/**
 * Format score - show '-' if null
 */
function formatScore(score: string | null): string {
  if (!score) return '-';
  const numScore = parseFloat(score);
  if (isNaN(numScore)) return '-';
  return numScore.toFixed(1);
}

/**
 * Format rank - show '-' if null
 */
function formatRank(rank: string | null): string {
  return rank || '-';
}

/**
 * Format percentage value with % sign
 */
function formatPercent(value: string | null | number): string {
  if (value === null || value === undefined) return '-';
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return '-';
  return `${numValue.toFixed(1)}%`;
}

/**
 * Format numeric value with fixed decimals
 */
function formatNumber(value: string | null | number, decimals: number = 2): string {
  if (value === null || value === undefined) return '-';
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return '-';
  return numValue.toFixed(decimals);
}

/**
 * Format rank with percentile
 */
function _formatRankWithPercentile(rank: number | null, percentile: string | null): string {
  if (rank === null) return '-';
  const percentileStr = percentile ? ` (상위 ${parseFloat(percentile).toFixed(1)}%)` : '';
  return `${rank}위${percentileStr}`;
}

/**
 * Get main scenario (highest probability)
 */
function getMainScenario(strategy: Strategy | null): string {
  if (!strategy?.scenarios) return '-';
  const { bullish, sideways, bearish } = strategy.scenarios;
  const scenarios = [
    { name: '강세', prob: bullish?.data?.probability ?? 0 },
    { name: '횡보', prob: sideways?.data?.probability ?? 0 },
    { name: '약세', prob: bearish?.data?.probability ?? 0 },
  ];
  const main = scenarios.sort((a, b) => b.prob - a.prob)[0];
  return main.name;
}

/**
 * Format price for strategy display
 */
function formatStrategyPrice(value: number | string | null, market: 'KR' | 'US'): string {
  if (value === null) return '-';
  if (typeof value === 'string') {
    // Convert "1st", "2nd" to "1차", "2차"
    return value.replace(/1st/g, '1차').replace(/2nd/g, '2차');
  }
  if (market === 'US') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${value.toLocaleString('ko-KR')}원`;
}

/**
 * Format support/resistance range for strategy display
 */
function formatSupportResistance(support: number | undefined, resistance: number | undefined, market: 'KR' | 'US'): string {
  if (support === undefined || resistance === undefined) return '-';
  if (market === 'US') {
    const supportStr = `$${support.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const resistanceStr = `$${resistance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${supportStr}~${resistanceStr}`;
  }
  return `${support.toLocaleString('ko-KR')}~${resistance.toLocaleString('ko-KR')}`;
}

/**
 * Format expected return to add % to both numbers
 * e.g., '+10~+28%' → '+10%~+28%'
 */
function formatExpectedReturn(value: string): string {
  if (!value) return '-';
  return value.replace(/([+-]?\d+(?:\.\d+)?)(~)/, '$1%$2');
}

/**
 * Get scenario name in Korean
 */
function _getScenarioNameKr(key: string): string {
  const names: Record<string, string> = {
    bullish: '강세',
    sideways: '횡보',
    bearish: '약세',
  };
  return names[key] || key;
}

/**
 * Get regime name in Korean
 */
function getRegimeNameKr(regime: string): string {
  const names: Record<string, string> = {
    risk_on: '위험선호',
    risk_off: '위험회피',
    neutral: '중립',
  };
  return names[regime] || regime;
}

/**
 * Format numbers in text with comma separators (4+ digits)
 */
function formatNumbersInText(text: string | undefined | null): string {
  if (!text) return '-';
  return text.replace(/\d{4,}/g, (match) => {
    return parseInt(match).toLocaleString('ko-KR');
  });
}

/**
 * Get grade style based on grade value
 * Buy grades (red), Neutral (yellow), Sell grades (blue)
 */
function getGradeStyle(grade: string | null): string {
  if (!grade) return 'bg-neutral-100 text-neutral-600';

  const buyGrades = ['강력 매수', '매수', '매수 고려'];
  const neutralGrades = ['중립'];
  const sellGrades = ['매도 고려', '매도', '강력 매도'];

  if (buyGrades.includes(grade)) {
    return 'bg-red-50 text-red-600';
  }
  if (neutralGrades.includes(grade)) {
    return 'bg-amber-50 text-amber-600';
  }
  if (sellGrades.includes(grade)) {
    return 'bg-blue-50 text-blue-600';
  }

  return 'bg-neutral-100 text-neutral-600';
}

export default async function StockDetailPage({
  params,
  searchParams: _searchParams,
}: StockDetailPageProps) {
  const { stockId } = await params;
  const stockData = await getStockDetailCached(stockId);

  if (!stockData) {
    notFound();
  }

  const { market, basic, grade, price } = stockData;

  // Check favorite status and login state
  const { user } = await getCurrentSession();
  const isLoggedIn = !!user;
  const isFavorite = isLoggedIn ? await checkFavoriteStatus('STOCK', stockId) : false;

  // Get stock name (handle different field names for KR/US)
  const stockName = basic.stockName || '-';
  const exchange = basic.exchange || '-';
  const symbol = basic.symbol;

  // Extract strategy from grade (jsonb column)
  const strategy = grade?.strategy as Strategy | null;

  // Extract alt stock data from grade
  const altSymbol = grade?.altSymbol as string | null;
  const altStockName = grade?.altStockName as string | null;
  const altFinalGrade = grade?.altFinalGrade as string | null;
  const altReasons = grade?.altReasons as AltReason[] | null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F0F2F4] select-none">
      <header className="flex items-center justify-between w-full h-14 px-4 bg-neutral-0 border-b border-neutral-200">
        <BackButton />
        <div className="flex flex-col justify-between items-center">
          <Text variant="s1">{stockName}</Text>
          <Text variant="b3">
            {exchange} ({symbol})
          </Text>
        </div>
        <FavoriteButton
          itemType="STOCK"
          itemId={stockId}
          initialFavorite={isFavorite}
          isLoggedIn={isLoggedIn}
        />
      </header>

      <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4 relative z-0">
        {/* 섹션 1: 상단 차트 */}
        <section className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 rounded-t-lg">
            <div className="flex items-center gap-1">
              <Text variant="s1">📈 현재가</Text>
              <InfoPopover content={PRICE_INFO} iconSize={14} />
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="flex flex-row gap-2 items-center mb-2">
              <Text variant="t1">{formatPrice(price?.close ?? null, market)}</Text>
              <Badge variant={getBadgeVariant(price?.changeRate ?? null)} className="max-h-6">
                {formatChangeRate(price?.changeRate ?? null)}
              </Badge>
            </div>
            <TradingViewChart stockId={stockId} market={market} height={200} />
          </div>
        </section>

        {/* 섹션 2: AI 종합 의견 */}
        <section className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 rounded-t-lg">
            <div className="flex items-center gap-1">
              <Text variant="s1">🤖 AI 종합 의견</Text>
              <InfoPopover content={AI_OPINION_INFO} iconSize={14} />
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="flex flex-col gap-3">
              {/* 종합 투자 판단 */}
              <div className="px-4 py-2 rounded-2xl bg-neutral-200">
                <Text variant="b2">{grade?.signalOverall || '-'}</Text>
              </div>

              {/* 시계열 분석 */}
              <div className="px-4 py-2 rounded-2xl bg-neutral-100">
                <Text variant="b3" className="text-neutral-600">시계열 분석</Text>
                <Text variant="b2">{grade?.timeSeriesText || '-'}</Text>
              </div>

              {/* 리스크 프로파일 */}
              <div className="px-4 py-2 rounded-2xl bg-neutral-100">
                <Text variant="b3" className="text-neutral-600">리스크 프로파일</Text>
                <Text variant="b2">{grade?.riskProfileText || '-'}</Text>
              </div>

              {/* 핵심 지표 테이블 */}
              <div className="mt-2">
                <Text variant="b3" className="text-neutral-600 mb-2">핵심 지표</Text>
                <div className="grid grid-cols-2 gap-2 text-b2">
                  <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
                    <span className="text-neutral-600">연변동성</span>
                    <span>{formatPercent(grade?.volatilityAnnual ?? null)}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
                    <span className="text-neutral-600">최대낙폭(1Y)</span>
                    <span>{formatPercent(grade?.maxDrawdown1Y ?? null)}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
                    <span className="text-neutral-600">VaR 95%</span>
                    <span>{formatPercent(grade?.var95 ?? null)}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
                    <span className="text-neutral-600">CVaR 95%</span>
                    <span>{formatPercent(grade?.cvar95 ?? null)}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
                    <span className="text-neutral-600">베타</span>
                    <span>{formatNumber(grade?.beta ?? null)}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
                    <span className="text-neutral-600">섹터 모멘텀</span>
                    <span>{formatNumber(grade?.sectorMomentum ?? null)}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
                    <span className="text-neutral-600">RS 값</span>
                    <span>{formatNumber(grade?.rsValue ?? null)}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
                    <span className="text-neutral-600">RS 순위</span>
                    <span>{grade?.rsRank ?? '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
                    <span className="text-neutral-600">업종 순위</span>
                    <span>{grade?.industryRank ? `${grade.industryRank}위` : '-'}</span>
                  </div>
                  <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
                    <span className="text-neutral-600">섹터 순위</span>
                    <span>{grade?.sectorRank ? `${grade.sectorRank}위` : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 3: 종합 평가 등급 */}
        <section className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 rounded-t-lg">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-1">
                <Text variant="s1">⭐ 종합 평가 등급 -&nbsp;</Text>
                <span className={`px-2 py-1 rounded font-semibold ${getGradeStyle(grade?.finalGrade ?? null)}`}>
                  {grade?.finalGrade || '-'}
                </span>
                <InfoPopover content={GRADE_INFO} iconSize={14} />
              </div>
              <GradeTrendChart symbol={symbol} />
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="flex flex-col gap-2 mx-2">
              {/* Header row */}
              <div className="flex flex-row py-2">
                <Text variant="b2" className="flex-1 text-neutral-600">
                  항목
                </Text>
                <Text variant="b2" className="w-20 text-center text-neutral-600">
                  점수
                </Text>
                <Text variant="b2" className="w-28 text-center text-neutral-600">
                  순위
                </Text>
              </div>
              {/* 가치 (value) */}
              <div className="flex flex-row py-3 border-t border-neutral-200">
                <Text variant="b1" className="flex-1">
                  가치 (value)
                </Text>
                <Text variant="s1" className="w-20 text-center">
                  {formatScore(grade?.valueScore ?? null)}
                </Text>
                <Text variant="s1" className="w-28 text-center">
                  {formatRank(grade?.valueRank ?? null)}
                </Text>
              </div>
              {/* 품질 (quality) */}
              <div className="flex flex-row py-3 border-t border-neutral-200">
                <Text variant="b1" className="flex-1">
                  품질 (quality)
                </Text>
                <Text variant="s1" className="w-20 text-center">
                  {formatScore(grade?.qualityScore ?? null)}
                </Text>
                <Text variant="s1" className="w-28 text-center">
                  {formatRank(grade?.qualityRank ?? null)}
                </Text>
              </div>
              {/* 모멘텀 (momentum) */}
              <div className="flex flex-row py-3 border-t border-neutral-200">
                <Text variant="b1" className="flex-1">
                  모멘텀 (momentum)
                </Text>
                <Text variant="s1" className="w-20 text-center">
                  {formatScore(grade?.momentumScore ?? null)}
                </Text>
                <Text variant="s1" className="w-28 text-center">
                  {formatRank(grade?.momentumRank ?? null)}
                </Text>
              </div>
              {/* 성장 (growth) */}
              <div className="flex flex-row py-3 border-t border-neutral-200">
                <Text variant="b1" className="flex-1">
                  성장 (growth)
                </Text>
                <Text variant="s1" className="w-20 text-center">
                  {formatScore(grade?.growthScore ?? null)}
                </Text>
                <Text variant="s1" className="w-28 text-center">
                  {formatRank(grade?.growthRank ?? null)}
                </Text>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 4: 시나리오별 목표가 및 대응 방안 */}
        <section className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 rounded-t-lg">
            <div className="flex items-center gap-1">
              <Text variant="s1">🎯 시나리오별 목표가 및 대응 방안</Text>
              <InfoPopover content={SCENARIO_INFO} iconSize={14} />
            </div>
          </div>
          <div className="px-4 py-4">
            {strategy ? (
              <>
                <Text variant="s2" className="mb-4">
                  {strategy.analysis_date} 기준 | 메인: {getMainScenario(strategy)}
                </Text>

                {/* 시나리오 목록 */}
                {(['bullish', 'sideways', 'bearish'] as const).map((key) => {
                  const scenario = strategy.scenarios[key];
                  if (!scenario) return null;
                  const { data, narrative } = scenario;
                  return (
                    <div key={key} className="mb-4 p-3 bg-neutral-50 rounded-xl">
                      <Text variant="s1" className="mb-2">
                        {narrative.title} ({data.probability}%)
                      </Text>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-b2">
                        <div>
                          <span className="text-neutral-600">목표가: </span>
                          <span>{formatStrategyPrice(data.take_profit, market)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-600">손절가: </span>
                          <span>{formatStrategyPrice(data.stop_loss, market)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-600">기대수익률: </span>
                          <span>{formatExpectedReturn(data.expected_return)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-600">지지/저항: </span>
                          <span>{formatSupportResistance(data.support_level, data.resistance_level, market)}</span>
                        </div>
                      </div>

                      <div className="mb-2">
                        <Text variant="b3" className="text-neutral-600">전략</Text>
                        <Text variant="b2">{formatNumbersInText(narrative.strategy)}</Text>
                      </div>

                      <div className="mb-2">
                        <Text variant="b3" className="text-neutral-600">신호 강화 조건</Text>
                        <ul className="text-b2 list-disc list-inside">
                          {narrative.triggers.map((trigger, i) => (
                            <li key={i}>{formatNumbersInText(trigger)}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-2">
                        <Text variant="b3" className="text-neutral-600">리스크 요인</Text>
                        <ul className="text-b2 list-disc list-inside">
                          {narrative.risk_factors.map((risk, i) => (
                            <li key={i}>{formatNumbersInText(risk)}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <Text variant="b3" className="text-neutral-600">모니터링 포인트</Text>
                        <ul className="text-b2 list-disc list-inside">
                          {narrative.monitoring_points.map((point, i) => (
                            <li key={i}>{formatNumbersInText(point)}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}

                {/* 기술적 분석 */}
                <div className="mt-4 p-3 bg-neutral-50 rounded-xl">
                  <Text variant="s1" className="mb-2">기술적 분석</Text>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-b2">
                    <div>
                      <span className="text-neutral-600">현재가: </span>
                      <span>{market === 'US'
                        ? `$${strategy.technical_summary.data.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${strategy.technical_summary.data.current_price?.toLocaleString()}원`
                      }</span>
                    </div>
                    <div>
                      <span className="text-neutral-600">RSI: </span>
                      <span>{strategy.technical_summary.data.rsi?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-600">ADX: </span>
                      <span>{strategy.technical_summary.data.adx?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-600">거래량비율: </span>
                      <span>{(strategy.technical_summary.data.volume_ratio * 100)?.toFixed(0)}%</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-neutral-600">{market === 'US' ? 'MA20/50/200: ' : 'MA5/20/60: '}</span>
                      <span>{market === 'US'
                        ? `$${strategy.technical_summary.data.ma20?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/$${strategy.technical_summary.data.ma50?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/$${strategy.technical_summary.data.ma200?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${strategy.technical_summary.data.ma5?.toLocaleString()}/${strategy.technical_summary.data.ma20?.toLocaleString()}/${strategy.technical_summary.data.ma60?.toLocaleString()}`
                      }</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-neutral-600">볼린저: </span>
                      <span>{market === 'US'
                        ? `$${strategy.technical_summary.data.bollinger_lower?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}~$${strategy.technical_summary.data.bollinger_upper?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `${strategy.technical_summary.data.bollinger_lower?.toLocaleString()}~${strategy.technical_summary.data.bollinger_upper?.toLocaleString()}`
                      }</span>
                    </div>
                    {market === 'KR' && (
                      <>
                        <div>
                          <span className="text-neutral-600">외국인 연속매수: </span>
                          <span>{strategy.technical_summary.data.foreign_consecutive_buy}일</span>
                        </div>
                        <div>
                          <span className="text-neutral-600">기관 연속매수: </span>
                          <span>{strategy.technical_summary.data.institutional_consecutive_buy}일</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Text variant="b3" className="text-neutral-600">지표 해석</Text>
                      <Text variant="b2">{formatNumbersInText(strategy.technical_summary.narrative.indicators)}</Text>
                    </div>
                    <div>
                      <Text variant="b3" className="text-neutral-600">가격 추세</Text>
                      <Text variant="b2">{formatNumbersInText(strategy.technical_summary.narrative.price_trend)}</Text>
                    </div>
                    {market === 'KR' && (
                      <>
                        <div>
                          <Text variant="b3" className="text-neutral-600">투자자 동향</Text>
                          <Text variant="b2">{formatNumbersInText(strategy.technical_summary.narrative.investor_flow)}</Text>
                        </div>
                        <div>
                          <Text variant="b3" className="text-neutral-600">거래량 분석</Text>
                          <Text variant="b2">{formatNumbersInText(strategy.technical_summary.narrative.volume_analysis)}</Text>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 시장 환경 */}
                <div className="mt-4 p-3 bg-neutral-50 rounded-xl">
                  <Text variant="s1" className="mb-2">시장 환경</Text>
                  <div className={`grid ${market === 'US' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-3 text-b2`}>
                    <div>
                      <span className="text-neutral-600">시장 국면: </span>
                      <span>{getRegimeNameKr(strategy.market_environment.data.regime)}</span>
                    </div>
                    <div>
                      <span className="text-neutral-600">VIX: </span>
                      <span>{strategy.market_environment.data.vix}</span>
                    </div>
                    <div>
                      <span className="text-neutral-600">미국 금리: </span>
                      <span>{strategy.market_environment.data.fed_rate}%</span>
                    </div>
                    {market === 'KR' && (
                      <div>
                        <span className="text-neutral-600">한국 금리: </span>
                        <span>{strategy.market_environment.data.korea_base_rate}%</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Text variant="b3" className="text-neutral-600">글로벌 환경</Text>
                      <Text variant="b2">{formatNumbersInText(strategy.market_environment.narrative.global_env)}</Text>
                    </div>
                    {market === 'KR' && (
                      <div>
                        <Text variant="b3" className="text-neutral-600">국내 환경</Text>
                        <Text variant="b2">{formatNumbersInText(strategy.market_environment.narrative.domestic)}</Text>
                      </div>
                    )}
                    <div>
                      <Text variant="b3" className="text-neutral-600">섹터 동향</Text>
                      <Text variant="b2">{formatNumbersInText(strategy.market_environment.narrative.sector)}</Text>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <StrategyGenerator symbol={symbol} market={market} />
            )}
          </div>
        </section>

        {/* 섹션 5: 대체 종목 제안 */}
        <section className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 rounded-t-lg">
            <div className="flex items-center gap-1">
              <Text variant="s1">🔄 대체 종목 제안</Text>
              <InfoPopover content={ALT_STOCK_INFO} iconSize={14} />
            </div>
          </div>
          <div className="px-4 py-4">
            {altSymbol && altStockName ? (
              <div className="p-3 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Link href={`/stock-detail/${altSymbol}`}>
                    <Text variant="s1" className="hover:underline cursor-pointer">{altStockName} ({altSymbol})</Text>
                  </Link>
                  {altFinalGrade && (
                    <span className={`px-2 py-1 rounded font-semibold text-sm ${getGradeStyle(altFinalGrade)}`}>
                      {altFinalGrade}
                    </span>
                  )}
                </div>
                {altReasons && altReasons.length > 0 && (
                  <div>
                    <Text variant="b3" className="text-neutral-600 mb-1">추천 이유</Text>
                    <ul className="list-inside list-disc text-b2">
                      {altReasons.map((reason, i) => (
                        <li key={i}>{formatNumbersInText(reason.text)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Text variant="b2" className="text-neutral-500">대체 종목 정보가 없습니다.</Text>
                <Text variant="b3" className="text-neutral-400 mt-1">
                  종합 평가 등급이 &apos;매도 고려&apos;, &apos;매도&apos;, &apos;강력 매도&apos;인 경우에만
                  <br />
                  산업, 섹터 등을 고려하여 매수 등급 종목이 제공됩니다.
                </Text>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <section className="bg-white">
          <Footer />
        </section>
      </div>
    </div>
  );
}
