'use client';

import { useState } from 'react';

type Market = 'korea' | 'us';

interface MarketToggleProps {
  defaultValue?: Market;
  onChange?: (market: Market) => void;
}

export function MarketToggle({
  defaultValue = 'korea',
  onChange,
}: MarketToggleProps) {
  const [selected, setSelected] = useState<Market>(defaultValue);

  const handleSelect = (market: Market) => {
    setSelected(market);
    onChange?.(market);
  };

  return (
    <div className="relative flex p-1 bg-gray-100 rounded-xl w-[135px] h-[35px]">
      {/* 슬라이드 배경 */}
      <div
        className={`
          absolute top-1 h-[calc(100%-8px)] bg-white rounded-lg shadow-md
          transition-transform duration-300 ease-out
          ${selected === 'korea' ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width: 'calc(50% - 4px)', left: '4px' }}
      />

      <button
        type="button"
        onClick={() => handleSelect('korea')}
        className={`
          relative z-10 flex items-center gap-2 rounded-md justify-center
          transition-colors duration-200 font-medium cursor-pointer
          ${selected === 'korea' ? 'text-gray-900' : 'text-gray-500'}
        `}
        style={{ width: 'calc(50% - 4px)' }}
      >
        <span className="text-s3">한국</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('us')}
        className={`
          relative z-10 flex items-center gap-2 rounded-md justify-center
          transition-colors duration-200 font-medium cursor-pointer
          ${selected === 'us' ? 'text-gray-900' : 'text-gray-500'}
        `}
        style={{ width: 'calc(50% - 4px)' }}
      >
        <span className="text-s3">미국</span>
      </button>
    </div>
  );
}
