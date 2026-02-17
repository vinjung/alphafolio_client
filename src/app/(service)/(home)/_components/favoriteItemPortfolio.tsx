'use client';

import { Text } from '@/components/shared/text';
import { useRouter } from 'next/navigation';

interface FavoriteItemPortFolioProps {
  portfolioId: string;
  portfolioName: string;
  country: string;
  initialBudget: number;
  benchmark: string | null;
  analysisDate: string | null;
  cumulativeReturn: string | null;
  benchmarkCumulativeReturn: string | null;
  favorite?: boolean;
}

/**
 * Format cumulative return as percentage string
 */
function formatReturn(value: string | null): string {
  if (!value) return '-';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '-';
  const sign = numValue >= 0 ? '+' : '';
  return `${sign}${numValue.toFixed(1)}%`;
}

/**
 * Format date to display format (YYYY-MM-DD)
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return dateStr;
}

/**
 * Format budget based on country
 * KR: Korean won format (e.g., 3,000만원)
 * US: Dollar format (e.g., 21,540달러)
 */
function formatBudget(value: number, country: string): string {
  if (country === 'US') {
    return `${value.toLocaleString()}달러`;
  }
  // KR
  if (value >= 100000000) {
    const billions = value / 100000000;
    return `${billions.toLocaleString()}억원`;
  }
  if (value >= 10000) {
    const tenThousands = value / 10000;
    return `${tenThousands.toLocaleString()}만원`;
  }
  return `${value.toLocaleString()}원`;
}

/**
 * Get country flag emoji
 */
function getCountryFlag(country: string): string {
  switch (country) {
    case 'KR':
      return '\u{1F1F0}\u{1F1F7}';
    case 'US':
      return '\u{1F1FA}\u{1F1F8}';
    default:
      return '';
  }
}

/**
 * Get text color class based on return value
 */
function getReturnColorClass(value: string | null): string {
  if (!value) return 'text-neutral-800';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'text-neutral-800';
  if (numValue > 0) return 'text-red-500';
  if (numValue < 0) return 'text-blue-500';
  return 'text-neutral-800';
}

export const FavoriteItemPortFolio = ({
  portfolioId,
  portfolioName,
  country,
  initialBudget,
  benchmark,
  analysisDate,
  cumulativeReturn,
  benchmarkCumulativeReturn,
  favorite: _favorite = false,
}: FavoriteItemPortFolioProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/portfolio/${portfolioId}`);
  };

  return (
    <div
      className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      {/* Line 1: Portfolio name + Country flag */}
      <div className="flex flex-row justify-between items-center">
        <Text variant="s1">{portfolioName}</Text>
        <span className="text-lg">{getCountryFlag(country)}</span>
      </div>

      {/* Line 2 & 3: Two-column grid layout */}
      <div className="grid grid-cols-2 gap-y-1 mt-1">
        {/* Line 2: Budget + Benchmark */}
        <Text variant="s1">
          <span className="text-neutral-500">예산 </span>
          <span className="text-neutral-800">{formatBudget(initialBudget, country)}</span>
        </Text>
        <Text variant="s1">
          <span className="text-neutral-500">벤치마크 </span>
          <span className="text-neutral-800">{benchmark || '-'}</span>
        </Text>

        {/* Line 3: Portfolio return + Benchmark return */}
        <Text variant="s1">
          <span className="text-neutral-500">총 수익률 </span>
          <span className={getReturnColorClass(cumulativeReturn)}>
            {formatReturn(cumulativeReturn)}
          </span>
        </Text>
        <Text variant="s1">
          <span className="text-neutral-500">벤치마크 수익률 </span>
          <span className={getReturnColorClass(benchmarkCumulativeReturn)}>
            {formatReturn(benchmarkCumulativeReturn)}
          </span>
        </Text>
      </div>

      {/* Line 4: Analysis date */}
      <Text variant="b3" className="mt-1">
        <span className="text-neutral-500">생성일 </span>
        <span className="text-neutral-800">{formatDate(analysisDate)}</span>
      </Text>
    </div>
  );
};
