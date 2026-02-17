'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTabNavigation } from '@/hooks/use-tab-navigation';
import { useNavigationGuard } from '@/hooks/use-navigation-guard';
import { useRetentionTracker } from '@/hooks/use-retention-tracker'; // 🆕 리텐션 훅 추가
import { useStreamingStore, useAppStore } from '@/stores';
import { Icon } from '@/components/icons';
import { TabItem } from '@/components/shared/tab-item';
import { NavigationGuard } from './navigation-guard';

const NAV_ITEMS = [
  {
    id: 'discover',
    label: '떡상',
    href: '/discover/list',
    iconKey: 'rocket',
    activePaths: ['/discover/list', '/discover/find'],
  },
  {
    id: 'home',
    label: '대시보드',
    href: '/myportfolio',
    iconKey: 'dashboard',
    activePaths: ['/myportfolio', '/mystock', '/portfolio'],
    dynamicPatterns: ['/portfolio/[pageId]'],
  },
  {
    id: 'chat',
    label: 'AI 비서',
    href: '/chat',
    iconKey: 'ipa',
    activePaths: ['/chat', '/chat-test'],
    dynamicPatterns: ['/chat/[chatId]'],
  },
  {
    id: 'mypage',
    label: '마이페이지',
    href: '/mypage',
    iconKey: 'profile',
    activePaths: ['/mypage'],
  },
];

export function BottomNavigationBar() {
  const { activeIndex: defaultActiveIndex } = useTabNavigation(NAV_ITEMS);
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);

  // /portfolio, /stock-detail 페이지에서는 sessionStorage의 값으로 활성화 결정
  useEffect(() => {
    const isDetailPage = pathname.startsWith('/portfolio/') || pathname.startsWith('/stock-detail/');

    if (isDetailPage) {
      const savedTab = sessionStorage.getItem('activeNavTab');
      if (savedTab === 'discover') {
        setActiveIndex(0);
      } else if (savedTab === 'home') {
        setActiveIndex(1);
      } else {
        setActiveIndex(-1); // 직접 URL 입력 시 모든 탭 비활성화
      }
    } else {
      setActiveIndex(defaultActiveIndex);
      // 탭바 메뉴 페이지 접속 시 sessionStorage에 저장
      if (pathname.startsWith('/discover')) {
        sessionStorage.setItem('activeNavTab', 'discover');
      } else if (pathname === '/myportfolio' || pathname === '/mystock') {
        sessionStorage.setItem('activeNavTab', 'home');
      }
    }
  }, [pathname, defaultActiveIndex]);

  // ✅ Zustand 스토어에서 상태 가져오기 (selector 패턴)
  const isStreaming = useStreamingStore((state) => state.isStreaming);
  const isNavigationGuardEnabled = useAppStore(
    (state) => state.isNavigationGuardEnabled
  );

  // 🆕 리텐션 추적 훅 - URL 변경 감지하여 자동 추적
  useRetentionTracker({
    enabled: true,
    trackablePaths: [
      '/today',
      '/future',
      '/chat',
      '/chat/[chatId]', // 동적 라우트 패턴
      '/mypage',
    ],
  });

  // 네비게이션 가드 설정
  const {
    isDialogOpen,
    targetUrl,
    confirmNavigation,
    cancelNavigation,
    guardedNavigate,
  } = useNavigationGuard({
    isBlocked: isStreaming && isNavigationGuardEnabled,
    onNavigationAttempt: (url) => {
      console.log('🚫 스트리밍 중 네비게이션 시도:', url);
    },
    onNavigationConfirm: (url) => {
      console.log('✅ 네비게이션 확인됨 - 스트리밍 중단:', url);
    },
    onNavigationCancel: () => {
      console.log('❌ 네비게이션 취소됨');
    },
  });

  // 네비게이션 아이템 클릭 핸들러
  const handleNavClick = (href: string, e: React.MouseEvent) => {
    // 현재 페이지와 동일하면 아무것도 하지 않음
    if (pathname === href) {
      e.preventDefault();
      return;
    }

    // 스트리밍 중이고 가드가 활성화되어 있으면 가드된 네비게이션 사용
    if (isStreaming && isNavigationGuardEnabled) {
      e.preventDefault();
      guardedNavigate(href);
    }
    // 그렇지 않으면 기본 Link 동작 사용
  };

  // ✅ 채팅 화면 감지 로직
  const isChatScreen = pathname === '/chat' || pathname.startsWith('/chat/');

  // ✅ 조건부 스타일 클래스
  const navigationClasses = `absolute bottom-0 left-0 right-0 z-50 bg-neutral-0 rounded-t-lg ${
    isChatScreen ? '' : 'drop-shadow-2xl'
  }`;

  return (
    <>
      <nav className={navigationClasses}>
        <ul className="flex justify-around items-center h-24 w-full max-w-lg mx-auto pb-4">
          {NAV_ITEMS.map((item, index) => (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-label={`${item.label} 페이지로 이동`}
                onClick={(e) => handleNavClick(item.href, e)}
                className="cursor-pointer"
              >
                <TabItem
                  iconKey={item.iconKey as keyof typeof Icon}
                  label={item.label}
                  isActive={index === activeIndex}
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 네비게이션 가드 */}
      <NavigationGuard
        isOpen={isDialogOpen}
        targetUrl={targetUrl}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </>
  );
}
