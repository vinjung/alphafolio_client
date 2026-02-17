import { SlidingTabs, TabConfig } from '../_components/sliding-tab';
import { Text } from '@/components/shared/text';
import { getCurrentSession } from '@/lib/server/session';

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: _user } = await getCurrentSession();
  // const cookieStore = await cookies();
  // const hasSeenGuestOnboarding = cookieStore.get('hasSeenGuestOnboarding');

  // // 로그인된 사용자의 경우, hasCompletedOnboarding 플래그를 따름
  // const showOnboardingMaskForAuthenticated =
  //   user && !user.hasCompletedOnboarding;

  const HOME_TABS: TabConfig[] = [
    {
      id: 'home',
      label: '내 포트폴리오',
      path: '/myportfolio',
    },
    {
      id: 'stock',
      label: '관심 종목',
      path: '/mystock',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between w-full min-h-14 px-4 bg-neutral-z">
        <Text variant="brand">대시보드</Text>
      </header>
      <SlidingTabs tabs={HOME_TABS} />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
