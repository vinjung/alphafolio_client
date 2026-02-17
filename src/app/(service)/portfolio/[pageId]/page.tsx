import { Icon } from '@/components/icons';
import { Text } from '@/components/shared/text';
import { InfoPopover } from '@/components/shared/info-popover';
import CustomChart from './_components/customChart';
import Badge from '@/components/shared/badge';
import { PortfolioTable } from './_components/customTable';
import { PortfolioReportSection } from './_components/portfolioReportSection';
import { RebalancingReportSection } from './_components/rebalancingReportSection';
import { Footer } from '@/components/shared/footer';
import { getPortfolioDetail, getPortfolioHoldings, getPortfolioChartData, getRebalancingReport } from '@/lib/server/portfolio';

const PORTFOLIO_STATUS_INFO = `본 포트폴리오는 최소 60일 이상의 중장기 관점에서 성과를 검증하도록 설계되었습니다.`;

const PORTFOLIO_STOCK_INFO = `포트폴리오 구성 종목은 리밸런싱 결과에 따라 지속적으로 업데이트됩니다.`;

/**
 * Format currency based on country
 */
function formatCurrency(value: string | number | null, country: string): string {
  if (value === null) return '-';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '-';
  const unit = country === 'KR' ? '원' : '달러';
  return `${Math.round(numValue).toLocaleString()}${unit}`;
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
 * Get badge variant based on return value
 */
function getReturnVariant(value: string | null): 'up' | 'down' | 'default' {
  if (!value) return 'default';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'default';
  if (numValue > 0) return 'up';
  if (numValue < 0) return 'down';
  return 'default';
}

interface PortfolioPageProps {
  params: Promise<{
    pageId: string;
  }>;
  searchParams: Promise<{
    new?: string;
    message?: string;
  }>;
}

export default async function PortfolioPage({
  params,
  searchParams: _searchParams,
}: PortfolioPageProps) {
  const { pageId } = await params;
  const portfolio = await getPortfolioDetail(pageId);

  if (!portfolio) {
    return (
      <div className="bg-[#F0F2F4] h-full px-4 py-4 flex items-center justify-center">
        <Text variant="s1">포트폴리오를 찾을 수 없습니다.</Text>
      </div>
    );
  }

  // Fetch portfolio holdings, chart data, and rebalancing report
  const holdings = await getPortfolioHoldings(pageId, portfolio.country);
  const initialChartData = await getPortfolioChartData(pageId, '최대');
  const rebalancingReport = await getRebalancingReport(pageId);

  return (
    <div className="bg-[#F0F2F4] h-full px-4 py-4 space-y-4">
      {/* 섹션 1: 포트폴리오 현황 */}
      <section className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 rounded-t-lg">
          <div className="flex items-center gap-1">
            <Text variant="s1">📈 포트폴리오 현황</Text>
            <InfoPopover content={PORTFOLIO_STATUS_INFO} iconSize={14} />
          </div>
        </div>
        <div className="px-4 py-4">
          <Text variant="b3" className="mb-3">
            <span className="text-neutral-600">생성일 | </span>
            {portfolio.analysisDate || '-'}
          </Text>
          <div className="rounded-xl text-b1 box-border inline-flex justify-center items-center p-4 select-none bg-neutral-100 text-neutral-800 w-full mb-7">
            <div className="w-100 flex flex-row justify-between items-center">
              <Icon.clipboard className="mr-2.5" />
              <div className="flex flex-col justify-between mr-auto items-start">
                <Text variant="b3" className="text-neutral-600">
                  추천 운영 예산
                </Text>
                <Text variant="s1">{formatCurrency(portfolio.initialBudget, portfolio.country)}</Text>
              </div>
            </div>
          </div>
          <CustomChart portfolioId={pageId} initialData={initialChartData} />
          <div className="flex flex-col mt-7">
            <div className="flex flex-row justify-between items-center gap-1.5 border-b border-neutral-200 py-3">
              <Text variant="b1">총 평가액</Text>
              <Text variant="b1" className="ml-auto">
                {formatCurrency(portfolio.totalPortfolioValue, portfolio.country)}
              </Text>
              <Badge variant={getReturnVariant(portfolio.cumulativeReturn)}>
                {formatReturn(portfolio.cumulativeReturn)}
              </Badge>
            </div>
            <div className="flex flex-row justify-between items-center gap-1.5 py-3">
              <Text variant="b1">벤치마크</Text>
              <Text variant="b1" className="ml-auto">
                {portfolio.benchmark || '-'}
              </Text>
              <Badge variant={getReturnVariant(portfolio.benchmarkCumulativeReturn)}>
                {formatReturn(portfolio.benchmarkCumulativeReturn)}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 섹션 2: 포트폴리오 구성 종목 리스트 */}
      <section className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 rounded-t-lg">
          <div className="flex flex-row justify-between">
            <div className="flex items-center gap-1">
              <Text variant="s1">📋 포트폴리오 구성 종목 리스트</Text>
              <InfoPopover content={PORTFOLIO_STOCK_INFO} iconSize={14} />
            </div>
            <Text variant="s1" className="text-neutral-500">
              {portfolio.stockCount ?? holdings.length}개
            </Text>
          </div>
        </div>
        <div className="px-4 py-4">
          <PortfolioTable stocks={holdings} country={portfolio.country} />
        </div>
      </section>

      {/* 섹션 3: 포트폴리오 리포트 */}
      <PortfolioReportSection
        portfolioId={pageId}
        reportDate={portfolio.reportDate}
        dailyReport={portfolio.dailyReport}
        country={portfolio.country}
      />

      {/* 섹션 4: 리밸런싱 리포트 */}
      <RebalancingReportSection
        portfolioId={pageId}
        planDate={rebalancingReport?.planDate ?? null}
        report={rebalancingReport?.report ?? null}
      />

      {/* Footer */}
      <section className="bg-white">
        <Footer />
      </section>
    </div>
  );
}
