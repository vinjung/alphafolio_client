'use client';

import { useState } from 'react';
import { Text } from '@/components/shared/text';
import { cx } from '@/lib/utils/cva.config';

export default function TermsPage() {
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    age: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!allAgreed || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.redirectUrl || '/discover/list';
      } else {
        alert('회원가입에 실패했습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
      }
    } catch {
      alert('회원가입에 실패했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="bg-[#0c0c0c] flex flex-col flex-1 justify-between items-center p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      <div className="flex-grow flex flex-col justify-center items-center w-full max-w-md">
        <Text variant="t1" className="text-white mb-8">
          약관 동의
        </Text>

        {/* All Agree Checkbox */}
        <div
          className="flex items-center gap-3 p-4 mb-4 bg-neutral-800 rounded-xl cursor-pointer w-full"
          onClick={handleAllAgree}
        >
          <Checkbox checked={allAgreed} />
          <Text variant="s1" className="text-white">
            약관 전체 동의
          </Text>
        </div>

        {/* Individual Checkboxes */}
        <div className="space-y-3 mb-6 w-full">
          {/* Terms of Service */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleSingleAgree('terms')}
            >
              <Checkbox checked={agreements.terms} />
              <Text variant="b1" className="text-neutral-300">
                <span className="text-red-400">(필수)</span> 이용약관 동의
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
              <Text variant="b1" className="text-neutral-300">
                <span className="text-red-400">(필수)</span> 개인정보 처리방침
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
              <Text variant="b1" className="text-neutral-300">
                <span className="text-red-400">(필수)</span> 본인은 만 14세
                이상입니다.
              </Text>
            </div>
            <Text variant="b3" className="text-neutral-500 ml-8">
              ※ 떡상 서비스는 금융 정보가 포함되어 있어 만 14세 미만 아동의
              회원 가입을 제한합니다.
            </Text>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="w-full max-w-md">
        <button
          onClick={handleSubmit}
          disabled={!allAgreed || isSubmitting}
          className={cx(
            'w-full h-14 rounded-xl font-semibold transition-colors',
            allAgreed && !isSubmitting
              ? 'bg-[#FEE500] text-black hover:bg-[#F6DC00] cursor-pointer'
              : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
          )}
        >
          {isSubmitting ? '처리 중...' : '동의하고 시작하기'}
        </button>
      </div>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <div
      className={cx(
        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
        checked ? 'bg-red-900 border-red-900' : 'bg-transparent border-neutral-500'
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
