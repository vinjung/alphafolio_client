import { AnalysisInfoModal } from '@/components/shared/analysis-info-modal';

export function Footer() {
  return (
    <footer className="pt-8 pb-28 px-4 mt-6 bg-[#F3F3F3]">
      {/* Disclaimer */}
      <p className="text-b3 text-neutral-900 mb-4 leading-relaxed">
        본 서비스 및 LLM(AI 비서)이 제공하는 모든 정보, 분석, 예측, 의견 등은
        일반적인 참고용 정보이며, 「자본시장과 금융투자업에 관한 법률」상
        투자자문 또는 투자권유에 해당하지 않습니다.
        투자에 대한 최종 판단과 그에 따른 손실 및 법적 책임은 전적으로
        이용자 본인에게 있으며, 본 서비스 제공자 및 개발자는 이에 대해
        어떠한 책임도 지지 않습니다.
        과거 데이터나 모형에 기반한 설명 및 예시는 미래 수익률이나
        성과를 보장하지 않습니다.
      </p>

      {/* Links */}
      <div className="flex gap-4 mb-4 text-b3">
        <a
          href="https://www.notion.so/2f43dda5336c80c5aa12e6ba4c97c4bf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-900 underline"
        >
          이용약관
        </a>
        <a
          href="https://www.notion.so/2f43dda5336c8079a385c59597c482dd"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-900 underline"
        >
          개인정보처리방침
        </a>
        <AnalysisInfoModal />
      </div>

      {/* Company Info */}
      <div className="text-b3 text-neutral-900 space-y-0.5">
        <p>클레버리지 | 대표: 정인호</p>
        <p>사업자등록번호: 373-57-00993</p>
        <p>주소: 서울시 강남구 영동대로 602, 6층 sgi237 (삼성동, 삼성동 미켈란107)</p>
        <p>cleverage426@gmail.com</p>
        <p className="mt-2">© 2026 Cleverage. All rights reserved.</p>
      </div>
    </footer>
  );
}
