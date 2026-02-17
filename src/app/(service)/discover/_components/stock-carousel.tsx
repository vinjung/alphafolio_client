'use client';

import { StockCard } from './stock-card';
import Link from 'next/link';
import type { RecommendationItem } from '@/lib/server/recommendation';

interface StockCarouselProps {
  stocks: RecommendationItem[];
}

export function StockCarousel({ stocks }: StockCarouselProps) {
  if (stocks.length === 0) {
    return (
      <div className="w-full py-8 text-center">
        <p className="text-neutral-500">추천 종목이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        {stocks.map((stock, index) => (
          <Link
            key={`${stock.symbol}-${index}`}
            href={`/stock-detail/${stock.symbol}`}
            className="w-full cursor-pointer"
          >
            <StockCard
              stockName={stock.stockName}
              symbol={stock.symbol}
              country={stock.country}
              finalGrade={stock.finalGrade}
              close={stock.close}
              changeRate={stock.changeRate}
              signalOverall={stock.signalOverall}
              timeSeriesText={stock.timeSeriesText}
              riskProfileText={stock.riskProfileText}
              volatilityAnnual={stock.volatilityAnnual}
              maxDrawdown1Y={stock.maxDrawdown1Y}
              var95={stock.var95}
              cvar95={stock.cvar95}
              beta={stock.beta}
              sectorMomentum={stock.sectorMomentum}
              rsValue={stock.rsValue}
              rsRank={stock.rsRank}
              industryRank={stock.industryRank}
              sectorRank={stock.sectorRank}
            />
          </Link>
        ))}
      </div>

    </div>
  );
}
