'use client';

import { useState, KeyboardEvent, useEffect, useRef } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/shared/button';

interface MessageInputProps {
  onSendMessageAction: (message: string, clearInput: () => void) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  isStreaming?: boolean;
  presetMessage?: string;
  onPresetUsed?: () => void;
}

export function MessageInput({
  onSendMessageAction,
  disabled = false,
  placeholder = '우리 모두 떡상 가즈아!',
  className,
  isStreaming = false,
  presetMessage,
  onPresetUsed,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (presetMessage && !message) {
      setMessage(presetMessage);
      console.log('🎯 프리셋 메시지 입력창에 설정:', presetMessage);
    }
  }, [presetMessage, message]);

  // 텍스트 높이 자동 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '40px';
      const scrollHeight = textarea.scrollHeight;
      if (scrollHeight > 40) {
        const baseHeight = 40;
        const lineHeight = 20;
        const maxHeight = baseHeight + lineHeight * 4;
        const newHeight = Math.min(scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
      }
    }
  }, [message]);

  const handleSend = () => {
    if (!message.trim()) return;

    if (presetMessage && message === presetMessage && onPresetUsed) {
      onPresetUsed();
    }

    const clearInput = () => setMessage('');
    onSendMessageAction(message, clearInput);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    if (
      presetMessage &&
      (newValue !== presetMessage || newValue === '') &&
      onPresetUsed
    ) {
      console.log('🎯 프리셋 메시지 수정/삭제됨 - 프리셋 클리어');
      onPresetUsed();
    }
  };

  return (
    <div className={`px-4 py-2 bg-neutral-0 pb-safe ${className || ''}`}>
      <div className="flex gap-2.5 justify-between items-center">
        <div className="flex-1 relative flex items-center">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isStreaming}
            rows={1}
            spellCheck={false}
            className="w-full min-h-10 resize-none px-4 py-2.5 ring-1 ring-red-900 rounded-[20px] focus:ring-1 focus:outline-none bg-neutral-0 placeholder-neutral-600 text-neutral-1100 text-b1 disabled:ring-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-600 overflow-hidden leading-tight"
          />
        </div>

        <Button
          variant="send"
          onClick={handleSend}
          disabled={disabled || isStreaming}
          className={`w-7 h-7 flex-shrink-0 ${
            disabled || isStreaming
              ? 'bg-neutral-200'
              : 'bg-red-900 hover:bg-red-800'
          }`}
          aria-label="메시지 전송"
        >
          <Icon.send className="text-neutral-0" size={24} />
        </Button>
      </div>
    </div>
  );
}
