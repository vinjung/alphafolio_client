'use client';

import { useState } from 'react';
import { Text } from '@/components/shared/text';
import { MenuItem } from './menu-item';
import { ConfirmModal } from './confirm-modal';
import { deleteAccountAction, logoutAction } from '@/lib/server/actions';

type ModalType = 'logout' | 'delete' | null;

export function MenuSection() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleLogout = async () => {
    await logoutAction();
  };

  const handleDeleteAccount = async () => {
    await deleteAccountAction();
  };

  const handleSendFeedback = () => {
    const email = 'cleverage426@gmail.com';
    const subject = '[떡상] 문의/피드백';
    const body = `안녕하세요! 떡상 서비스에 문의드립니다.

문의 유형을 선택해주세요:
- 기능 개선 제안
- 버그 신고
- 사용법 문의
- 주식 정보 오류
- 계정/로그인 문제
- 기타 문의

문의 내용:
[구체적인 문의 내용을 작성해주세요]

문제 발생 상황 (해당시):
- 발생 페이지: (예: 오늘의 떡상, 미래 전망 등)
- 발생 시간:
- 오류 메시지:

개선 제안 (해당시):
[어떤 기능이나 개선사항을 원하시는지 자세히 작성해주세요]

---
기기 정보:
- 사용 기기: (예: iPhone, 안드로이드, PC 웹)
- 브라우저: (웹 사용시)
- 문의일: ${new Date().toLocaleDateString('ko-KR')}`;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <>
      <div className="flex flex-col gap-5 px-4 py-8">
        {/* 계정 섹션 */}
        <div className="">
          <Text variant="b3" className="text-neutral-600 mb-2.5">
            계정
          </Text>
          <MenuItem
            title="로그아웃"
            className="rounded-none rounded-t-lg"
            onPress={() => setActiveModal('logout')}
          />
          <MenuItem
            title="회원탈퇴"
            className="rounded-none rounded-b-lg -mt-[1px]"
            onPress={() => setActiveModal('delete')}
          />
        </div>

        {/* 피드백 섹션 */}
        <div className="">
          <Text variant="b3" className="text-neutral-600 mb-3">
            지원 & 정보
          </Text>
          <MenuItem
            title="문의하기 cleverage426@gmail.com"
            className="rounded-lg"
            onPress={handleSendFeedback}
          />
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      <ConfirmModal
        isVisible={activeModal === 'logout'}
        onCloseAction={() => setActiveModal(null)}
        title="로그아웃 하시겠습니까?"
        description=""
        confirmText="확인"
        cancelText="취소"
        onConfirmAction={handleLogout}
      />

      {/* 회원탈퇴 확인 모달 */}
      <ConfirmModal
        isVisible={activeModal === 'delete'}
        onCloseAction={() => setActiveModal(null)}
        title="떡상하시길 바랍니다!"
        description=""
        confirmText="확인"
        cancelText="취소"
        onConfirmAction={handleDeleteAccount}
        isDestructive={true}
      />
    </>
  );
}
