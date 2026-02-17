'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationGuardOptions {
  isBlocked: boolean;
  onNavigationAttempt?: (targetUrl: string) => void;
  onNavigationConfirm?: (targetUrl: string) => void;
  onNavigationCancel?: () => void;
}

interface NavigationGuardResult {
  isDialogOpen: boolean;
  targetUrl: string | null;
  closeDialog: () => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  guardedNavigate: (url: string) => void;
}

export function useNavigationGuard(
  _options: NavigationGuardOptions
): NavigationGuardResult {
  const router = useRouter();

  // 백그라운드 생성으로 전환되었으므로 가드 비활성화
  // 자유롭게 이동 가능
  const guardedNavigate = useCallback(
    (url: string) => {
      router.push(url);
    },
    [router]
  );

  const confirmNavigation = useCallback(() => {}, []);
  const cancelNavigation = useCallback(() => {}, []);
  const closeDialog = useCallback(() => {}, []);

  return {
    isDialogOpen: false,
    targetUrl: null,
    closeDialog,
    confirmNavigation,
    cancelNavigation,
    guardedNavigate,
  };
}
