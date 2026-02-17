'use client';

import { useState } from 'react';
import { Text } from '@/components/shared/text';
import { cx } from '@/lib/utils/cva.config';

interface TermsAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsAgreementModal({
  isOpen,
  onClose,
}: TermsAgreementModalProps) {
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    age: false,
  });

  const allAgreed = agreements.terms && agreements.privacy && agreements.age;

  const handleAllAgree = () => {
    const newValue = !allAgreed;
    setAgreements({
      terms: newValue,
      privacy: newValue,
      age: newValue,
    });
  };

  const handleSingleAgree = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = () => {
    if (allAgreed) {
      // Redirect to Kakao OAuth
      window.location.href = '/api/auth/kakao';
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl animate-slide-up">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Text variant="h3" className="text-neutral-900">
              약관 동의
            </Text>
            <button
              onClick={onClose}
              className="p-1 text-neutral-500 hover:text-neutral-700"
              aria-label="닫기"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* All Agree Checkbox */}
          <div
            className="flex items-center gap-3 p-4 mb-4 bg-neutral-100 rounded-xl cursor-pointer"
            onClick={handleAllAgree}
          >
            <Checkbox checked={allAgreed} />
            <Text variant="s1" className="text-neutral-900">
              약관 전체 동의
            </Text>
          </div>

          {/* Individual Checkboxes */}
          <div className="space-y-3 mb-6">
            {/* Terms of Service */}
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleSingleAgree('terms')}
              >
                <Checkbox checked={agreements.terms} />
                <Text variant="b1" className="text-neutral-800">
                  <span className="text-red-900">(필수)</span> 이용약관 동의
                </Text>
              </div>
              <button
                onClick={() =>
                  openExternalLink(
                    'https://www.notion.so/2f43dda5336c80c5aa12e6ba4c97c4bf'
                  )
                }
                className="text-neutral-500 underline text-sm cursor-pointer"
              >
                내용보기
              </button>
            </div>

            {/* Privacy Policy */}
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleSingleAgree('privacy')}
              >
                <Checkbox checked={agreements.privacy} />
                <Text variant="b1" className="text-neutral-800">
                  <span className="text-red-900">(필수)</span> 개인정보 처리방침
                  동의
                </Text>
              </div>
              <button
                onClick={() =>
                  openExternalLink(
                    'https://www.notion.so/2f43dda5336c8079a385c59597c482dd'
                  )
                }
                className="text-neutral-500 underline text-sm cursor-pointer"
              >
                내용보기
              </button>
            </div>

            {/* Age Verification */}
            <div className="flex flex-col gap-2">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleSingleAgree('age')}
              >
                <Checkbox checked={agreements.age} />
                <Text variant="b1" className="text-neutral-800">
                  <span className="text-red-900">(필수)</span> 본인은 만 14세
                  이상입니다.
                </Text>
              </div>
              <Text variant="b3" className="text-neutral-500 ml-8">
                ※ 떡상 서비스는 금융 정보가 포함되어 있어 만 14세 미만 아동의
                회원 가입을 제한합니다.
              </Text>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!allAgreed}
            className={cx(
              'w-full h-14 rounded-xl font-semibold transition-colors',
              allAgreed
                ? 'bg-[#FEE500] text-black hover:bg-[#F6DC00] cursor-pointer'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            )}
          >
            회원가입
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={cx(
        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
        checked ? 'bg-red-900 border-red-900' : 'bg-white border-neutral-300'
      )}
    >
      {checked && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 7L5.5 10L11.5 4" />
        </svg>
      )}
    </div>
  );
}
