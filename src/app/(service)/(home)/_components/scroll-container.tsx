'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cx } from '@/lib/utils/cva.config';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  fullHeight?: boolean;
}

export function ScrollContainer({
  children,
  className,
  style,
  fullHeight = false,
}: ScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const { isVisible, bindScrollElement } = usePullToRefresh({
    showThreshold: 20,
    resistance: 0.6,
  });

  // 스크롤 위치 감지
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      setIsScrolled(scrollElement.scrollTop > 0);

      // 하단 도달 여부 체크 (여유값 2px)
      const isBottom =
        scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 2;
      setIsAtBottom(isBottom);
    };

    // 초기 상태 체크
    handleScroll();

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      bindScrollElement(scrollRef.current);
    }
  }, [bindScrollElement]);

  // 스크롤 리셋 이벤트 리스너
  useEffect(() => {
    const handleScrollToTop = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }
    };

    window.addEventListener('scrollToTop', handleScrollToTop);

    return () => {
      window.removeEventListener('scrollToTop', handleScrollToTop);
    };
  }, []);

  return (
    <div
      className="relative"
      style={{
        height: fullHeight ? '100%' : 'calc(100dvh - 56px - 63px - 58px - 96px - 83px - 12px)',
      }}
    >
      {/* 스크롤 콘텐츠 */}
      <div
        ref={scrollRef}
        className={cx('h-full overflow-y-auto overflow-x-hidden overscroll-none', className)}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          ...style,
        }}
      >
        <div
          style={{
            paddingTop: isVisible ? '60px' : '0px',
            transition: 'padding-top 300ms ease-out',
          }}
        >
          {children}
          {/*<Text variant="b3" className="text-center text-neutral-800">
            본 서비스가 제공하는 정보는 참고용이며,
            <br /> 투자의 최종 판단과 책임은 전적으로 사용자 본인에게 있습니다.
          </Text>*/}
        </div>
      </div>

      {/* 상단 페이드 - 스크롤 시에만 표시 */}
      {isScrolled && (
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none z-10"
          style={{
            height: '20px',
            background:
              'linear-gradient(to bottom, rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0.8) 70%, transparent 100%)',
          }}
        />
      )}

      {/* 하단 페이드 - 스크롤이 끝까지 내려가지 않았을 때만 표시 */}
      {!isAtBottom && (
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-10"
          style={{
            height: '20px',
            background:
              'linear-gradient(to top, rgb(255, 255, 255) 0%, rgba(255, 255, 255, 0.8) 70%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
}
