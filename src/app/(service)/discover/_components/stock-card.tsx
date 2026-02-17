'use client';

import { Text } from '@/components/shared/text';

interface StockCardProps {
  stockName: string;
  symbol: string;
  country: string;
  finalGrade: string | null;
  close: string | null;
  changeRate: string | null;
  signalOverall: string | null;
  timeSeriesText: string | null;
  riskProfileText: string | null;
  volatilityAnnual: string | null;
  maxDrawdown1Y: string | null;
  var95: string | null;
  cvar95: string | null;
  beta: string | null;
  sectorMomentum: string | null;
  rsValue: string | null;
  rsRank: string | null;
  industryRank: number | null;
  sectorRank: number | null;
}

/**
 * Format price with comma separator and currency
 */
function formatPrice(price: string | null, country: string): string {
  if (!price) return '-';
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return '-';

  if (country === 'KR') {
    return `${Math.round(numPrice).toLocaleString('ko-KR')}`;
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
 * Get change rate color class
 */
function getChangeRateColor(rate: string | null): string {
  if (!rate) return 'text-neutral-600';
  const numRate = parseFloat(rate);
  if (isNaN(numRate)) return 'text-neutral-600';

  if (numRate > 0) return 'text-red-500';
  if (numRate < 0) return 'text-blue-500';
  return 'text-neutral-600';
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

/**
 * Format percentage value
 */
function formatPercent(value: string | null): string {
  if (!value) return '-';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '-';
  return `${numValue.toFixed(1)}%`;
}

/**
 * Format numeric value
 */
function formatNumber(value: string | null, decimals: number = 2): string {
  if (!value) return '-';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '-';
  return numValue.toFixed(decimals);
}

export function StockCard({
  stockName,
  country,
  finalGrade,
  close,
  changeRate,
  signalOverall,
  timeSeriesText,
  riskProfileText,
  volatilityAnnual,
  maxDrawdown1Y,
  var95,
  cvar95,
  beta,
  sectorMomentum,
  rsValue,
  rsRank,
  industryRank,
  sectorRank,
}: StockCardProps) {
  return (
    <div className="w-full">
      <div className="bg-white shadow-sm rounded-lg p-4">
        {/* Header: Stock Name + Grade Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Text variant="s1">{stockName}</Text>
          {finalGrade && (
            <span className={`px-2 py-1 rounded font-semibold text-sm ${getGradeStyle(finalGrade)}`}>
              {finalGrade}
            </span>
          )}
        </div>

        {/* Current Price */}
        <div className="mb-3">
          <span className="text-b2 text-neutral-600">현재가 </span>
          <span className="text-b2">{formatPrice(close, country)}</span>
          <span className={`text-b2 ${getChangeRateColor(changeRate)}`}>
            {' '}({formatChangeRate(changeRate)})
          </span>
        </div>

        {/* Signal Overall (Investment Decision) */}
        {signalOverall && (
          <div className="px-3 py-2 rounded-xl bg-neutral-200 mb-2">
            <Text variant="b2">{signalOverall}</Text>
          </div>
        )}

        {/* Time Series Analysis */}
        {timeSeriesText && (
          <div className="px-3 py-2 rounded-xl bg-neutral-100 mb-2">
            <Text variant="b3" className="text-neutral-600">시계열 분석</Text>
            <Text variant="b2">{timeSeriesText}</Text>
          </div>
        )}

        {/* Risk Profile */}
        {riskProfileText && (
          <div className="px-3 py-2 rounded-xl bg-neutral-100 mb-2">
            <Text variant="b3" className="text-neutral-600">리스크 프로파일</Text>
            <Text variant="b2">{riskProfileText}</Text>
          </div>
        )}

        {/* Key Indicators Table */}
        <div className="mt-3">
          <Text variant="b3" className="text-neutral-600 mb-2">핵심 지표</Text>
          <div className="grid grid-cols-2 gap-1.5 text-b3">
            <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
              <span className="text-neutral-600">연변동성</span>
              <span>{formatPercent(volatilityAnnual)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
              <span className="text-neutral-600">최대낙폭(1Y)</span>
              <span>{formatPercent(maxDrawdown1Y)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
              <span className="text-neutral-600">VaR 95%</span>
              <span>{formatPercent(var95)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
              <span className="text-neutral-600">CVaR 95%</span>
              <span>{formatPercent(cvar95)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
              <span className="text-neutral-600">베타</span>
              <span>{formatNumber(beta)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
              <span className="text-neutral-600">섹터 모멘텀</span>
              <span>{formatNumber(sectorMomentum)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
              <span className="text-neutral-600">RS 값</span>
              <span>{formatNumber(rsValue)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
              <span className="text-neutral-600">RS 순위</span>
              <span>{rsRank || '-'}</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
              <span className="text-neutral-600">업종 순위</span>
              <span>{industryRank ? `${industryRank}위` : '-'}</span>
            </div>
            <div className="flex justify-between px-2 py-1 bg-neutral-50 rounded">
              <span className="text-neutral-600">섹터 순위</span>
              <span>{sectorRank ? `${sectorRank}위` : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
