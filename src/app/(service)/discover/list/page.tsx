import { Text } from '@/components/shared/text';
import { FavoriteItemPortFolio } from '../../(home)/_components/favoriteItemPortfolio';
import { getPortfolioList } from '@/lib/server/portfolio';
import { ScrollContainer } from '../../(home)/_components/scroll-container';
import { Footer } from '@/components/shared/footer';

export default async function Discover() {
  const [krList, usList] = await Promise.all([getPortfolioList('KR'), getPortfolioList('US')]);
  const portfolioList = [...krList, ...usList];

  const noList = function () {
    return (
      <div className="bg-white flex flex-col justify-center items-center px-4 h-full">
        <Text variant="t1" className="text-neutral-800 text-center text-xl">
          멀티 AI 에이전트가
          <br />
          다양한 예산별로
          <br />
          포트폴리오를 준비 중입니다.
        </Text>
      </div>
    );
  };

  return (
    <div className="bg-[#F0F2F4] h-full px-4 py-4">
      {portfolioList.length > 0 ? (
        <ScrollContainer fullHeight>
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
            />
          ))}
          <Footer />
        </ScrollContainer>
      ) : (
        noList()
      )}
    </div>
  );
}
