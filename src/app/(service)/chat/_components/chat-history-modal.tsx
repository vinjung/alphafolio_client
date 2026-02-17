'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Icon } from '@/components/icons';
import { Text } from '@/components/shared/text';
import { Modal } from '@/components/shared/modal';
import { FormattedText } from './formatted-text'; // ✅ 마크다운 컴포넌트 추가
import {
  formatRelativeTime,
  groupChatHistoryByDate,
} from '@/lib/utils/date-formatter';
import type { ChatHistoryItem } from '@/lib/utils/date-formatter';
import { Button } from '@/components/shared/button';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  preloadedHistory?: ChatHistoryItem[];
}

interface PullToSearchState {
  isPulling: boolean;
  pullDistance: number;
  isSearchVisible: boolean;
}

export function ChatHistoryModal({
  isOpen,
  onCloseAction,
  preloadedHistory = [],
}: ChatHistoryModalProps) {
  // ✅ 유일한 수정: 상태 업데이트 가능하도록 변경
  const [historyItems, setHistoryItems] =
    useState<ChatHistoryItem[]>(preloadedHistory);
  const [searchQuery, setSearchQuery] = useState('');
  const [pullState, setPullState] = useState<PullToSearchState>({
    isPulling: false,
    pullDistance: 0,
    isSearchVisible: false,
  });

  // ✅ 무한 스크롤 관련 상태
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(preloadedHistory.length);

  const startY = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPullingRef = useRef<boolean>(false);

  const SHOW_THRESHOLD = 20; // 30 → 20으로 낮춤 (더 민감하게)
  const RESISTANCE = 0.5; // 0.4 → 0.5로 높임 (더 자연스럽게)
  const SCROLL_THRESHOLD = 200; // 스크롤 바닥에서 200px 전에 로딩 시작

  // ✅ preloadedHistory 변경 시 상태 동기화 (추가된 유일한 로직)
  useEffect(() => {
    setHistoryItems(preloadedHistory);
    setOffset(preloadedHistory.length);
    setHasMore(true); // 모달 열 때마다 리셋
    console.log('📜 히스토리 상태 동기화:', preloadedHistory.length, '개');
  }, [preloadedHistory]);

  // ✅ 추가 히스토리 로드 함수
  const loadMoreHistory = useCallback(async () => {
    if (isLoadingMore || !hasMore || searchQuery) return;

    setIsLoadingMore(true);
    try {
      console.log('📡 추가 히스토리 로드 시작, offset:', offset);

      const response = await fetch(
        `/api/chat/history?limit=20&offset=${offset}`
      );
      if (!response.ok) throw new Error('히스토리 로드 실패');

      const result = await response.json();

      if (result.success && result.data) {
        const newItems = result.data.history || [];
        console.log('✅ 추가 로드 완료:', newItems.length, '개');

        if (newItems.length === 0) {
          setHasMore(false);
        } else {
          setHistoryItems((prev) => [...prev, ...newItems]);
          setOffset((prev) => prev + newItems.length);

          // pagination.hasMore가 false면 더 이상 로드할 것이 없음
          if (result.data.pagination && !result.data.pagination.hasMore) {
            setHasMore(false);
          }
        }
      }
    } catch (error) {
      console.error('히스토리 추가 로드 실패:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [offset, isLoadingMore, hasMore, searchQuery]);

  const handleItemClick = useCallback(
    (chatId: string) => {
      window.location.href = `/chat/${chatId}`;
      onCloseAction();
    },
    [onCloseAction]
  );

  // ✅ 채팅 삭제 핸들러
  const handleDeleteChat = useCallback(
    async (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation(); // 부모 버튼 클릭 방지

      if (!confirm('이 채팅을 삭제하시겠습니까?')) {
        return;
      }

      try {
        const response = await fetch('/api/chat/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const result = await response.json();

        if (result.success) {
          // 로컬 상태에서 삭제된 항목 제거
          setHistoryItems((prev) =>
            prev.filter((item) => item.id !== sessionId)
          );
        } else {
          alert(result.message || '삭제에 실패했습니다.');
        }
      } catch (error) {
        console.error('채팅 삭제 실패:', error);
        alert('삭제에 실패했습니다.');
      }
    },
    []
  );

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  // ✅ 검색 토글 함수 추가 (PC용 버튼에서 사용)
  const handleSearchToggle = useCallback(() => {
    setPullState((prev) => ({
      ...prev,
      isSearchVisible: !prev.isSearchVisible,
    }));
  }, []);

  // Pull-to-search 로직 (최상단에서만 활성화)
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!scrollRef.current) return;

    const scrollTop = scrollRef.current.scrollTop;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPullState((prev) => ({ ...prev, isPulling: true }));
      isPullingRef.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    if (deltaY > 0) {
      // Pull down
      const resistedDistance = deltaY * RESISTANCE;

      setPullState((prev) => ({
        ...prev,
        pullDistance: resistedDistance,
        isSearchVisible: resistedDistance > SHOW_THRESHOLD,
      }));

      if (resistedDistance > 5) {
        e.preventDefault();
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isPullingRef.current) return;

    isPullingRef.current = false;

    setPullState((prev) => {
      const shouldShow = prev.pullDistance > SHOW_THRESHOLD;
      return {
        isPulling: false,
        pullDistance: 0,
        isSearchVisible: shouldShow,
      };
    });
  }, []);

  // ✅ 스크롤 이벤트 핸들러 (무한 스크롤)
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isLoadingMore || !hasMore || searchQuery) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < SCROLL_THRESHOLD) {
      loadMoreHistory();
    }
  }, [loadMoreHistory, isLoadingMore, hasMore, searchQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    scrollContainer.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    scrollContainer.addEventListener('touchend', handleTouchEnd, {
      passive: true,
    });

    // ✅ 스크롤 이벤트 리스너 추가
    scrollContainer.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, handleTouchStart, handleTouchMove, handleTouchEnd, handleScroll]);

  // 검색 필터링 (useMemo로 최적화)
  const filteredItems = useMemo(() => {
    return searchQuery
      ? historyItems.filter(
          (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : historyItems;
  }, [historyItems, searchQuery]);

  // 날짜별로 그룹핑 (useMemo로 최적화)
  const groupedHistory = useMemo(() => {
    return groupChatHistoryByDate(filteredItems);
  }, [filteredItems]);

  return (
    <Modal
      isVisible={isOpen}
      onCloseAction={onCloseAction}
      variant="slideLeft"
      showCloseButton={false}
    >
      <div className="flex flex-col h-full">
        {/* 고정 헤더 */}
        <div className="sticky top-0 z-20 bg-white flex-shrink-0">
          <div className="flex items-center justify-center px-4 py-3 relative">
            {/* 뒤로가기 버튼 */}
            <button
              onClick={onCloseAction}
              className="absolute left-4 flex items-center gap-2 py-1 px-1 -ml-1 rounded-lg transition-colors cursor-pointer"
              aria-label="뒤로가기"
              type="button"
            >
              <Icon.arrowRight
                size={20}
                color="text-red-900"
                className="rotate-180 text-red-900"
              />
              <Text variant="s3" className="-ml-2 text-red-900">
                AI 비서
              </Text>
            </button>

            {/* 중앙 타이틀 */}
            <div className="flex-1 flex justify-center">
              <Text variant="s1">채팅 목록</Text>
            </div>

            <button
              onClick={handleSearchToggle}
              className="absolute right-4 p-2 rounded-lg transition-colors cursor-pointer"
              aria-label="검색"
              type="button"
            >
              <Icon.search size={20} className="text-red-900" />
            </button>
          </div>

          {/* 검색바 영역 */}
          <div
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{
              height: pullState.isSearchVisible ? '60px' : '0px',
            }}
          >
            <div className="px-4 py-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="키워드로 검색해 보세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  autoFocus={pullState.isSearchVisible}
                />
                <Icon.search
                  size={24}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-900"
                />
                {searchQuery && (
                  <button
                    onClick={handleSearchClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <Icon.clear size={24} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 스크롤 컨테이너 - 전체 영역 */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-none"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
          }}
        >
          {groupedHistory.length === 0 ? (
            // 빈 상태
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              {searchQuery ? (
                // 검색 결과 없음
                <>
                  <div className="mb-8">
                    <div className="text-6xl">🔍</div>
                  </div>
                  <div className="mb-2">
                    <Text
                      variant="t1"
                      className="text-neutral-900 font-bold mb-1"
                    >
                      &ldquo;{searchQuery}&rdquo;
                    </Text>
                    <Text variant="t1" className="text-neutral-700">
                      검색 결과가 없어요
                    </Text>
                  </div>
                </>
              ) : (
                // 히스토리 없음
                <>
                  <div className="mb-8">
                    <div className="text-[100px]">🚀</div>
                  </div>
                  <div className="mb-2">
                    <Text variant="t1" className="text-neutral-700">
                      아직 채팅이력이 없습니다
                    </Text>
                  </div>
                  <div className="mt-8 w-full max-w-sm">
                    <Button
                      variant="gradient"
                      onClick={() => {
                        onCloseAction();
                        window.location.href = '/chat';
                      }}
                      fullWidth
                    >
                      AI 비서와 대화하기
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            // 히스토리 목록
            <div className="px-6 mt-10">
              {groupedHistory.map((group) => (
                <div key={group.label} className="mb-1">
                  {/* 날짜 헤더 */}
                  <div className="sticky top-0 bg-white py-2 mb-2 z-10">
                    <Text variant="b3" className="text-neutral-500 font-medium">
                      {group.label}
                    </Text>
                  </div>

                  {/* 채팅 목록 */}
                  <div className="space-y-2">
                    {group.items.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="w-full text-left transition-colors border-b border-neutral-200 flex items-start gap-2"
                      >
                        <button
                          onClick={() => handleItemClick(item.id)}
                          className="flex-1 text-left min-w-0"
                          type="button"
                        >
                          <div className="flex flex-col gap-1">
                            <Text variant="s1" className="truncate">
                              {item.title}
                            </Text>

                            {/* 마크다운 렌더링 적용 + 생성 중 상태 */}
                            <div className="line-clamp-2">
                              {item.status === 'processing' ? (
                                <Text
                                  variant="b2"
                                  className="text-red-900 animate-pulse"
                                >
                                  답변 생성 중...
                                </Text>
                              ) : item.lastMessage === '메시지가 없습니다' ? (
                                <Text
                                  variant="b2"
                                  className="text-neutral-500 italic"
                                >
                                  {item.lastMessage}
                                </Text>
                              ) : (
                                <FormattedText className="text-sm text-neutral-700">
                                  {item.lastMessage}
                                </FormattedText>
                              )}
                            </div>

                            <Text
                              variant="b3"
                              className="text-neutral-600 flex-shrink-0 mb-1.5"
                            >
                              {formatRelativeTime(item.updatedAt).text}
                            </Text>
                          </div>
                        </button>

                        {/* ✅ 삭제 버튼 */}
                        <button
                          onClick={(e) => handleDeleteChat(e, item.id)}
                          className="p-2 flex-shrink-0 hover:bg-neutral-100 rounded-lg transition-colors"
                          type="button"
                          aria-label="채팅 삭제"
                        >
                          <Icon.inputClear size={20} className="text-neutral-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* ✅ 로딩 인디케이터 */}
              {isLoadingMore && (
                <div className="flex justify-center py-8">
                  <Text variant="b2" className="text-neutral-600">
                    채팅 내역을 가져오고 있습니다.
                  </Text>
                </div>
              )}

              {/* ✅ 더 이상 데이터가 없을 때 */}
              {/* {!hasMore && historyItems.length > 0 && !searchQuery && (
                <div className="text-center py-8">
                  <Text variant="b2" className="text-neutral-500">
                    모든 채팅을 불러왔어요
                  </Text>
                </div>
              )} */}
            </div>
          )}
        </div>

        {/* 디버그 정보 제거됨 */}
      </div>
    </Modal>
  );
}
