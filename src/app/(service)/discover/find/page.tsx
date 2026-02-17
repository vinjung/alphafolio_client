'use client';

import { useState, useEffect } from 'react';
import { Text } from '@/components/shared/text';
import { MarketToggle } from '../_components/market-toggle';
import { StockCarousel } from '../_components/stock-carousel';
import { StockSearch } from '@/components/shared/stock-search';
import { ScrollContainer } from '../../(home)/_components/scroll-container';
import { Footer } from '@/components/shared/footer';
import { InfoPopover } from '@/components/shared/info-popover';
import type { RecommendationItem } from '@/lib/server/recommendation';

const RECOMMENDATION_INFO = `'오늘의 추천주'는 자체 개발 퀀트 분석 시스템과 멀티 AI 에이전트가 통합 분석하여 엄선한 Top 3 종목입니다.

한국 종목은 20:00, 미국 종목은 15:30에 업데이트되며, Top 3가 기준이기 때문에 전일과 동일 종목이 재선정될 수 있습니다.`;

type Market = 'korea' | 'us';

export default function DiscoverFind() {
  const [market, setMarket] = useState<Market>('korea');
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const country = market === 'korea' ? 'KR' : 'US';
        const response = await fetch(`/api/recommendation?country=${country}`);
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.data || []);
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [market]);

  const handleMarketChange = (newMarket: Market) => {
    setMarket(newMarket);
  };

  return (
    <div className="bg-[#F0F2F4] h-full px-4 py-4 flex flex-col overflow-hidden">
      {/* 2행: 검색창 - 고정 */}
      <StockSearch className="mb-4 flex-shrink-0" />
      {/* 3행: 오늘의 추천주 / 한국 / 미국 - 고정 */}
      <div className="flex flex-row justify-between items-center mb-2.5 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Text variant="s1">오늘의 추천주</Text>
          <InfoPopover content={RECOMMENDATION_INFO} iconSize={14} />
        </div>
        <MarketToggle defaultValue={market} onChange={handleMarketChange} />
      </div>
      {/* 4행: 종목 정보 - 스크롤 영역 */}
      {isLoading ? (
        <div className="w-full py-8 text-center">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <ScrollContainer fullHeight>
            <StockCarousel stocks={recommendations} />
            <Footer />
          </ScrollContainer>
        </div>
      )}
    </div>
  );
}
