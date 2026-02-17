import { getCurrentSession } from '@/lib/server/session';
import { Text } from '@/components/shared/text';
import { Button } from '@/components/shared/button';
import { BfcacheRefresh } from '@/components/shared/bfcache-refresh';
import { StockTable } from './_components/stockTable';
import { getFavoriteStocks } from '@/lib/server/favorite';
import { Footer } from '@/components/shared/footer';
import Link from 'next/link';

interface StockPageProps {
  searchParams: Promise<{ country?: string }>;
}

export default async function StockPage({ searchParams }: StockPageProps) {
  const { user } = await getCurrentSession();
  const _params = await searchParams;
  const isLoggedIn = !!user;

  // Get favorite stocks for logged-in users
  const favoriteStocks = isLoggedIn ? await getFavoriteStocks() : [];

  // Determine country for display (default to KR, or use first stock's country)
  const displayCountry = favoriteStocks.length > 0 ? favoriteStocks[0].country : 'KR';

  const noLoginMessage = function () {
    return (
      <div className="bg-white flex flex-col justify-center items-center px-4 py-5">
        <Text variant="s1">로그인이 필요합니다</Text>
        <Text variant="b1" className="text-neutral-800">
          로그인 후 즐겨찾기한 종목을 확인하세요.
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
        <Text variant="t1" className="text-center">
          나에게 딱 맞는 종목
          <br />
          직접 발굴해 보세요!
        </Text>
        <Text variant="s1" className="text-neutral-800">
          종목 상세 페이지에서 하트를 눌러 즐겨찾기 하세요.
        </Text>
        <Link href="/discover/find" className="w-full mt-5">
          <Button variant="gradient" size="sm" fullWidth>
            종목 추가하기
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
      ) : favoriteStocks.length > 0 ? (
        <div className="bg-white h-full px-4 py-4 overflow-x-hidden overflow-y-auto pb-24">
          <Text variant="s1">내 관심 종목 리스트</Text>
          <div className="mt-4">
            <StockTable className="-mx-4" stocks={favoriteStocks} country={displayCountry} returnLabel="등락률" maxHeight="none" />
          </div>
          <Footer />
          <div className="h-16" />
          <div className="absolute bottom-24 left-4 right-4 py-3 bg-white">
            <Link href="/discover/find">
              <Button variant="gradient" size="sm" fullWidth>
                종목 추가하기
              </Button>
            </Link>
          </div>
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
