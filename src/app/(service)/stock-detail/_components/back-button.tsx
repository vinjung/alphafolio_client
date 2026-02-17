'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="p-2 rounded-lg transition-colors rotate-180 cursor-pointer"
      aria-label="뒤로가기"
      type="button"
    >
      <Icon.arrowRight size={24} className="text-neutal-800" />
    </button>
  );
}
