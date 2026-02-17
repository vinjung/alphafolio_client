'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTabNavigation } from '@/hooks/use-tab-navigation';
import { InfoPopover } from '@/components/shared/info-popover';

const PORTFOLIO_INFO = `자체 포트폴리오 생성 시스템과 멀티 AI 에이전트가 통합 분석하여, 다양한 운영 예산이 될 수 있도록 주기적으로 포트폴리오를 신규 추가합니다.`;

const DISCOVER_TABS = [
  {
    id: 'list',
    label: '포트폴리오 리스트',
    path: '/discover/list',
  },
  {
    id: 'find',
    label: '종목 찾기',
    path: '/discover/find',
  },
];

interface DiscoverTabsWithInfoProps {
  className?: string;
}

export function DiscoverTabsWithInfo({ className }: DiscoverTabsWithInfoProps) {
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);

  const navTabs = DISCOVER_TABS.map((t) => ({ label: t.label, href: t.path }));
  const { activeIndex } = useTabNavigation(navTabs);

  useEffect(() => {
    if (tabsRef.current && activeIndex !== -1) {
      const activeTab = tabsRef.current.children[activeIndex] as HTMLElement;
      if (activeTab) {
        setSliderStyle({
          left: activeTab.offsetLeft,
          width: activeTab.offsetWidth,
        });
      }
    }
  }, [activeIndex]);

  return (
    <div
      className={`relative border-b border-neutral-200 bg-white px-4 z-[100] ${className || ''}`}
    >
      <div ref={tabsRef} className="relative flex box-border gap-5">
        {DISCOVER_TABS.map((tab, index) => {
          const isActive = index === activeIndex;

          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`flex items-center gap-2 py-4 transition-colors duration-200
                ${isActive ? 'text-neutral-1100' : 'text-neutral-500'}
              `}
            >
              <span className="text-t2">{tab.label}</span>
            </Link>
          );
        })}

        {activeIndex !== -1 && (
          <div
            className="absolute bottom-0 h-[2px] bg-neutral-1100 transition-all duration-300 ease-out"
            style={{
              left: `${sliderStyle.left}px`,
              width: `${sliderStyle.width}px`,
            }}
          />
        )}
      </div>

      {/* Info icon aligned with notification bell (right-4) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[9999]">
        <InfoPopover content={PORTFOLIO_INFO} iconSize={18} />
      </div>
    </div>
  );
}
