'use client';

import { Button } from '@/components/shared/button';
import { ScrollContainer } from './scroll-container';
import { Text } from '@/components/shared/text';
import { FavoriteItemPortFolio } from './favoriteItemPortfolio';
import { Footer } from '@/components/shared/footer';
import Link from 'next/link';

interface PortfolioItem {
  portfolioId: string;
  portfolioName: string;
  country: string;
  initialBudget: number;
  benchmark: string | null;
  analysisDate: string | null;
  cumulativeReturn: string | null;
  benchmarkCumulativeReturn: string | null;
}

interface FavoriteListProps {
  portfolioList: PortfolioItem[];
}

export const FavoriteList = ({ portfolioList }: FavoriteListProps) => {
  return (
    <>
      <Text variant="s1" className="mb-3">포트폴리오 리스트</Text>
      <ScrollContainer className="">
        {portfolioList.map((portfolio) => (
          <FavoriteItemPortFolio
            key={portfolio.portfolioId}
            portfolioId={portfolio.portfolioId}
            portfolioName={portfolio.portfolioName}
            country={portfolio.country}
            initialBudget={portfolio.initialBudget}
            benchmark={portfolio.benchmark}
            analysisDate={portfolio.analysisDate}
            cumulativeReturn={portfolio.cumulativeReturn}
            benchmarkCumulativeReturn={portfolio.benchmarkCumulativeReturn}
            favorite
          />
        ))}
        <Footer />
      </ScrollContainer>
      <div className="absolute bottom-24 left-4 right-4 py-3 bg-white">
        <Link href="/discover/list">
          <Button variant="gradient" size="sm" fullWidth>
            포트폴리오 추가하러 가기
          </Button>
        </Link>
      </div>
    </>
  );
};
