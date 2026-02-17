import { getCurrentSession } from '@/lib/server/session';
import { Text } from '@/components/shared/text';
import { Button } from '@/components/shared/button';
import { BfcacheRefresh } from '@/components/shared/bfcache-refresh';
import { FavoriteList } from '../_components/favoriteList';
import { getFavoritePortfolios } from '@/lib/server/favorite';
import { Footer } from '@/components/shared/footer';
import Link from 'next/link';

interface HomePageProps {
  searchParams: Promise<{ country?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const { user } = await getCurrentSession();
  const _params = await searchParams;
  const isLoggedIn = !!user;

  // Get favorite portfolios for logged-in users
  const portfolioList = isLoggedIn ? await getFavoritePortfolios() : [];

  const noLoginMessage = function () {
    return (
      <div className="bg-white flex flex-col justify-center items-center px-4 py-5">
        <Text variant="s1">로그인이 필요합니다</Text>
        <Text variant="b1" className="text-neutral-800">
          로그인 후 즐겨찾기한 포트폴리오를 확인하세요.
        </Text>
        <Link href="/" className="w-full">
          <Button variant="gradient" size="sm" className="mt-3" fullWidth>
            로그인하러 가기
          </Button>
        </Link>
      </div>
    );
  };

  const noList = function () {
    return (
      <div className="bg-white flex flex-col justify-center items-center px-4 py-5">
        <Text variant="t1">복잡한 종목 고민은 끝!</Text>
        <Text variant="s1" className="text-neutral-800 text-center">
          준비된 포트폴리오 상세페이지에서
          <br />
          하트를 눌러 즐겨찾기 하세요.
        </Text>
        <Link href="/discover/list" className="w-full mt-5">
          <Button variant="gradient" size="sm" fullWidth>
            포트폴리오 추가하기
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="bg-white h-full">
      <BfcacheRefresh />
      {!isLoggedIn ? (
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center px-4 py-4">
            {noLoginMessage()}
          </div>
          <Footer />
        </div>
      ) : portfolioList.length > 0 ? (
        <div className="px-4 py-4">
          <FavoriteList portfolioList={portfolioList} />
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center px-4 py-4">
            {noList()}
          </div>
          <Footer />
        </div>
      )}
    </div>
  );
}
