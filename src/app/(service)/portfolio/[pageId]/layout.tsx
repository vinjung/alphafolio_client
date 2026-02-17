import { Text } from '@/components/shared/text';
import { FavoriteButton } from '@/components/shared/favorite-button';
import { BackButton } from '../../stock-detail/_components/back-button';
import { getPortfolioDetail } from '@/lib/server/portfolio';
import { checkFavoriteStatus } from '@/lib/server/favorite';
import { getCurrentSession } from '@/lib/server/session';

interface PortfolioDetailLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    pageId: string;
  }>;
}

export default async function PortfolioDetailLayout({
  children,
  params,
}: PortfolioDetailLayoutProps) {
  const { pageId } = await params;
  const portfolio = await getPortfolioDetail(pageId);

  const { user } = await getCurrentSession();
  const isLoggedIn = !!user;
  const isFavorite = isLoggedIn ? await checkFavoriteStatus('PORTFOLIO', pageId) : false;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between w-full min-h-14 px-4 bg-neutral-0 border-b border-neutral-200">
        <BackButton />
        <Text variant="s1">{portfolio?.portfolioName || ''}</Text>
        <FavoriteButton
          itemType="PORTFOLIO"
          itemId={pageId}
          initialFavorite={isFavorite}
          isLoggedIn={isLoggedIn}
        />
      </header>
      <div className="flex-1 overflow-y-auto pb-24 relative z-0">
        {children}
      </div>
    </div>
  );
}
