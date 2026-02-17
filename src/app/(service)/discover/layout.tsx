import { Text } from '@/components/shared/text';
import { getCurrentSession } from '@/lib/server/session';
import { DiscoverTabsWithInfo } from './_components/discover-tabs-with-info';

export default async function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: _user } = await getCurrentSession();

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between w-full min-h-14 px-4 bg-neutral-z">
        <Text variant="brand">떡상</Text>
      </header>
      <DiscoverTabsWithInfo />
      <div className="flex-1 overflow-y-auto pb-24 relative z-0">
        {children}
      </div>
    </div>
  );
}
