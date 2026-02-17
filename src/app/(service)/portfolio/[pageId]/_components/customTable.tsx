'use client';

import { Text } from '@/components/shared/text';
import Link from 'next/link';

// 종목 데이터 타입 (DB 연동)
export interface PortfolioStock {
  symbol: string;
  stockName: string | null;
  currentPrice: string | null;
  shares?: number | null;
  cumulativeReturn: string | null;
  finalGrade: string | null;
  valueScore: string | null;
  qualityScore: string | null;
  momentumScore: string | null;
  growthScore: string | null;
}

interface PortfolioTableProps {
  className?: string;
  stocks: PortfolioStock[];
  country: string;
  returnLabel?: string;
  maxHeight?: string;
  showDetailScores?: boolean;
}

export function PortfolioTable({ stocks, className, country, returnLabel = '수익률', maxHeight = '320px', showDetailScores = true }: PortfolioTableProps) {
  // 통화 단위
  const currencyUnit = country === 'KR' ? '원' : '달러';

  // 가격 포맷팅
  const formatPrice = (price: string | null): string => {
    if (!price) return '-';
    const numValue = parseFloat(price);
    if (isNaN(numValue)) return '-';
    return `${Math.round(numValue).toLocaleString()}${currencyUnit}`;
  };

  // 수익률 포맷팅
  const formatReturnRate = (rate: string | null): string => {
    if (!rate) return '-';
    const numValue = parseFloat(rate);
    if (isNaN(numValue)) return '-';
    const sign = numValue >= 0 ? '+' : '';
    return `${sign}${numValue.toFixed(1)}%`;
  };

  // 수익률 색상
  const getReturnColor = (rate: string | null): string => {
    if (!rate) return 'text-neutral-700';
    const numValue = parseFloat(rate);
    if (isNaN(numValue)) return 'text-neutral-700';
    if (numValue >= 0) return 'text-red-600 font-semibold';
    return 'text-blue-600 font-semibold';
  };

  // 등급별 스타일
  // 강력 매수, 매수, 매수 고려 = red (빨간색)
  // 중립 = yellow (노란색)
  // 매도 고려, 매도, 강력 매도 = blue (파란색)
  const getGradeStyle = (grade: string | null): string => {
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
  };

  // 점수 포맷팅
  const formatScore = (score: string | null): string => {
    if (!score) return '-';
    const numValue = parseFloat(score);
    if (isNaN(numValue)) return '-';
    return numValue.toFixed(1);
  };

  return (
    <div className={`${className} bg-white h-full`}>
      {/* 테이블 래퍼 */}
      <div
        className={`relative ${showDetailScores ? 'overflow-x-auto' : 'overflow-x-hidden'} overflow-y-auto -webkit-overflow-scrolling-touch`}
        style={{ maxHeight: maxHeight === 'none' ? 'none' : maxHeight }}
      >
        <table className="w-full border-collapse">
          <thead className="bg-white sticky top-0 z-30">
            <tr>
              <th className={`${showDetailScores ? 'sticky left-0 z-40 shadow-[2px_0_4px_rgba(0,0,0,0.05)]' : ''} bg-white px-4 py-3 text-left border-b border-neutral-200`}>
                <Text variant="b2" className="text-neutral-700 font-semibold">
                  종목명
                </Text>
              </th>
              <th className={`${showDetailScores ? 'px-4' : 'px-2'} py-3 text-center border-b border-neutral-200 whitespace-nowrap`}>
                <Text variant="b2" className="text-neutral-700 font-semibold">
                  현재가
                </Text>
              </th>
              <th className={`${showDetailScores ? 'px-4' : 'px-2'} py-3 text-center border-b border-neutral-200 whitespace-nowrap`}>
                <Text variant="b2" className="text-neutral-700 font-semibold">
                  {returnLabel}
                </Text>
              </th>
              <th className={`${showDetailScores ? 'px-4' : 'px-2'} py-3 text-center border-b border-neutral-200 whitespace-nowrap`}>
                <Text variant="b2" className="text-neutral-700 font-semibold">
                  보유 수량
                </Text>
              </th>
              <th className={`${showDetailScores ? 'px-4' : 'px-2'} py-3 text-center border-b border-neutral-200 whitespace-nowrap`}>
                <Text variant="b2" className="text-neutral-700 font-semibold">
                  종합평가등급
                </Text>
              </th>
              {showDetailScores && (
                <>
                  <th className="px-4 py-3 text-center border-b border-neutral-200 whitespace-nowrap">
                    <Text variant="b2" className="text-neutral-700 font-semibold">
                      가치
                    </Text>
                  </th>
                  <th className="px-4 py-3 text-center border-b border-neutral-200 whitespace-nowrap">
                    <Text variant="b2" className="text-neutral-700 font-semibold">
                      품질
                    </Text>
                  </th>
                  <th className="px-4 py-3 text-center border-b border-neutral-200 whitespace-nowrap">
                    <Text variant="b2" className="text-neutral-700 font-semibold">
                      모멘텀
                    </Text>
                  </th>
                  <th className="px-4 py-3 text-center border-b border-neutral-200 whitespace-nowrap">
                    <Text variant="b2" className="text-neutral-700 font-semibold">
                      성장
                    </Text>
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {stocks.map((stock, index) => (
              <tr key={`${stock.symbol}-${index}`}>
                {/* 고정 컬럼: 종목명 */}
                <td className={`${showDetailScores ? 'sticky left-0 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]' : ''} bg-white px-4 py-4 border-b border-neutral-100`}>
                  <Link href={`/stock-detail/${stock.symbol}`} className="block">
                    <div className="flex flex-col gap-0.5 min-w-[120px]">
                      <Text variant="s2" className="text-neutral-1100">
                        {stock.stockName || '-'}
                      </Text>
                      <Text variant="b3" className="text-neutral-500">
                        ({stock.symbol})
                      </Text>
                    </div>
                  </Link>
                </td>

                {/* 스크롤 가능한 컬럼들 */}
                <td className={`${showDetailScores ? 'px-4' : 'px-2'} py-4 border-b border-neutral-100 whitespace-nowrap text-center`}>
                  <Text variant="b2">{formatPrice(stock.currentPrice)}</Text>
                </td>

                <td className={`${showDetailScores ? 'px-4' : 'px-2'} py-4 border-b border-neutral-100 whitespace-nowrap text-center`}>
                  <Text variant="b2" className={getReturnColor(stock.cumulativeReturn)}>
                    {formatReturnRate(stock.cumulativeReturn)}
                  </Text>
                </td>

                <td className={`${showDetailScores ? 'px-4' : 'px-2'} py-4 border-b border-neutral-100 whitespace-nowrap text-center`}>
                  <Text variant="b2" className="text-neutral-700">
                    {stock.shares != null ? stock.shares.toLocaleString() : '-'}
                  </Text>
                </td>

                <td className={`${showDetailScores ? 'px-4' : 'px-2'} py-4 border-b border-neutral-100 whitespace-nowrap text-center`}>
                  <span
                    className={`inline-block px-2 py-1 rounded text-b3 font-semibold ${getGradeStyle(stock.finalGrade)}`}
                  >
                    {stock.finalGrade || '-'}
                  </span>
                </td>

                {showDetailScores && (
                  <>
                    <td className="px-4 py-4 border-b border-neutral-100 whitespace-nowrap text-center">
                      <Text variant="b2" className="text-neutral-700">
                        {formatScore(stock.valueScore)}
                      </Text>
                    </td>

                    <td className="px-4 py-4 border-b border-neutral-100 whitespace-nowrap text-center">
                      <Text variant="b2" className="text-neutral-700">
                        {formatScore(stock.qualityScore)}
                      </Text>
                    </td>

                    <td className="px-4 py-4 border-b border-neutral-100 whitespace-nowrap text-center">
                      <Text variant="b2" className="text-neutral-700">
                        {formatScore(stock.momentumScore)}
                      </Text>
                    </td>

                    <td className="px-4 py-4 border-b border-neutral-100 whitespace-nowrap text-center">
                      <Text variant="b2" className="text-neutral-700">
                        {formatScore(stock.growthScore)}
                      </Text>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
