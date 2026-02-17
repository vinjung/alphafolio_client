'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/icons';
import { Text } from '@/components/shared/text';

interface InfoPopoverProps {
  content: string;
  iconSize?: number;
  className?: string;
}

export function InfoPopover({ content, iconSize = 16, className = '' }: InfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'left' | 'center' | 'right'>('left');
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Popover 위치 결정
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const button = buttonRef.current;
      const buttonRect = button.getBoundingClientRect();

      // mobile-container 찾기
      const container = document.getElementById('mobile-container');
      const containerRect = container?.getBoundingClientRect() || { left: 0, right: window.innerWidth, width: window.innerWidth };

      const popoverWidth = 288; // w-72 = 18rem = 288px
      const margin = 16;

      // 버튼의 컨테이너 내 상대 위치
      const buttonLeftInContainer = buttonRect.left - containerRect.left;
      const buttonRightInContainer = containerRect.right - buttonRect.right;

      // 왼쪽 정렬 시 오른쪽으로 넘치는지 확인
      const overflowRight = (buttonLeftInContainer + popoverWidth + margin) > containerRect.width;
      // 오른쪽 정렬 시 왼쪽으로 넘치는지 확인
      const overflowLeft = (buttonRightInContainer + popoverWidth + margin) > containerRect.width;

      if (overflowRight && !overflowLeft) {
        setPosition('right');
      } else if (!overflowRight) {
        setPosition('left');
      } else {
        setPosition('center');
      }
    }
  }, [isOpen]);

  const getPositionClass = () => {
    switch (position) {
      case 'right':
        return 'right-0';
      case 'center':
        return 'left-1/2 -translate-x-1/2';
      default:
        return 'left-0';
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:bg-neutral-100 transition-colors"
        aria-label="정보 보기"
        type="button"
      >
        <Icon.info size={iconSize} className="text-neutral-500" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute top-full mt-2 w-72 p-4 bg-white rounded-xl shadow-lg border border-neutral-200 z-[9999] ${getPositionClass()}`}
        >
          {/* 내용 */}
          <Text variant="b2" className="text-neutral-700 leading-relaxed whitespace-pre-line">
            {content}
          </Text>
        </div>
      )}
    </div>
  );
}
