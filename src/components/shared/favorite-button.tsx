'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Text } from '@/components/shared/text';

type FavoriteItemType = 'PORTFOLIO' | 'STOCK';

interface FavoriteButtonProps {
  itemType: FavoriteItemType;
  itemId: string;
  initialFavorite: boolean;
  isLoggedIn: boolean;
  size?: number;
  className?: string;
}

export function FavoriteButton({
  itemType,
  itemId,
  initialFavorite,
  isLoggedIn,
  size = 24,
  className = '',
}: FavoriteButtonProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();
  const [popoverMessage, setPopoverMessage] = useState<string | null>(null);

  // Auto-hide popover after 2 seconds
  useEffect(() => {
    if (popoverMessage) {
      const timer = setTimeout(() => {
        setPopoverMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [popoverMessage]);

  const handleClick = async () => {
    // If not logged in, redirect to login
    if (!isLoggedIn) {
      router.push('/');
      return;
    }

    // Optimistic update
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      const response = await fetch('/api/favorite/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemType, itemId }),
      });

      const data = await response.json();

      if (!data.success) {
        // Rollback on failure
        setIsFavorite(previousState);
        console.error('Failed to toggle favorite:', data.message);
      } else {
        // Sync with server state
        setIsFavorite(data.isFavorite);

        // Show popover message
        if (data.isFavorite) {
          setPopoverMessage('즐겨찾기에 추가 되었습니다.\n대시보드에서 확인하세요.');
        } else {
          setPopoverMessage('즐겨찾기가 해제 되었습니다.');
        }

        // Refresh the page data
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      // Rollback on error
      setIsFavorite(previousState);
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        className={`p-2 rounded-lg transition-colors cursor-pointer ${className}`}
        aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        type="button"
        onClick={handleClick}
        disabled={isPending}
      >
        {isFavorite ? (
          <Icon.favorite.filled size={size} className="text-red-500" />
        ) : (
          <Icon.favorite.outline size={size} className="text-neutral-400" />
        )}
      </button>

      {/* Popover */}
      {popoverMessage && (
        <div className="absolute top-full right-0 mt-2 w-56 p-3 bg-white rounded-xl shadow-lg border border-neutral-200 z-[9999]">
          <Text variant="b2" className="text-neutral-700 leading-relaxed whitespace-pre-line">
            {popoverMessage}
          </Text>
        </div>
      )}
    </div>
  );
}
