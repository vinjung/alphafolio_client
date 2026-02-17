export interface AIModel {
  id: string;
  name: string;
  description: string;
  welcomeMessage: {
    title: string;
    content: string;
  };
  // 🚀 API 파라미터 매핑 - 새로운 enum 값으로 수정
  apiConfig: {
    chat_service_type: 'ALPHA_AI';
    provider: 'anthropic' | 'openai' | 'google' | 'perplexity';
    model: string;
  };
}

// API 설정 타입 별도 정의 (재사용을 위해)
export interface ModelApiConfig {
  chat_service_type: 'ALPHA_AI' | 'BRAIN_CRASH'; // ✅ API enum 값에 맞춤
  provider: 'anthropic' | 'openai' | 'google' | 'perplexity';
  model: string;
}

// AI 모델 기본 정보 (API 매핑 포함)
const BASE_MODELS = [
  {
    id: 'alpha-ai',
    name: '알파 AI',
    description: '데이터 기반 쉽고 똑똑한 투자 분석',
    apiConfig: {
      chat_service_type: 'ALPHA_AI' as const, // ✅ 새로운 enum 값
      provider: 'anthropic' as const,
      model: 'claude-sonnet-4-5-20250929',
    },
  },
  // ⏸️ 뇌절 AI 일시 비활성화 (삭제 아님 - 나중에 주석 해제하여 복원 가능)
  // {
  //   id: 'brain-ai',
  //   name: '뇌절 AI',
  //   description: '국장 특화, 창의적인 분석으로 연관주 발굴',
  //   apiConfig: {
  //     chat_service_type: 'BRAIN_CRASH' as const,
  //     provider: 'anthropic' as const,
  //     model: 'claude-sonnet-4-5-20250929',
  //   },
  // },
] as const;

// 개인화된 웰컴 메시지 생성 (웰컴 화면용)
export function createPersonalizedModels(nickname: string): AIModel[] {
  return [
    {
      ...BASE_MODELS[0],
      welcomeMessage: {
        title: `**안녕하세요 ${nickname}님👋🏻**`,
        content: `한국과 미국 주식 데이터를 분석하는 AI 비서입니다.  \n재무제표 / 시가총액 / 배당 / 애널리스트 목표가 등 데이터를 기반으로 답변합니다.  \n최신 뉴스와 공시 정보도 함께 반영하니, 종목 분석부터 종목 발굴까지 편하게 활용해 보세요.\n\n🏷️ 이렇게 질문해 보세요  \n1. 삼성전자 최근 실적이랑 애널리스트 목표가 알려줘  \n2. 한미 반도체 관련주 시가총액 상위 10개 비교해줘  \n3. 삼성전자랑 SK하이닉스 최근 한 달간 RSI, MACD 추이 비교해주고 외국인 순매수 현황도 같이 알려줘\n\n많은 데이터 참고와 추론 작업으로 인해 답변까지 약 2분 소요됩니다.\n\n답변은 투자 참고용이며, 최종 투자 판단은 본인의 책임 하에 결정하시기 바랍니다.`,
      },
    },
    // ⏸️ 뇌절 AI 일시 비활성화 (삭제 아님 - 나중에 주석 해제하여 복원 가능)
    // {
    //   ...BASE_MODELS[1],
    //   welcomeMessage: {
    //     title: `**${nickname}님🥸 뇌절 AI 입장~~~🚪** \n \n **국장 궁금한거 던지면 창의력 기반 연관주 소환!**`,
    //     content: `국장 궁금한거 던지면 창의력 기반 연관주 소환!\n뇌절 AI는 재미와 상상력 위주 답변이며, 실제 투자 결정은 신중히 판단하시기 바랍니다. \n
    //     \n 🏷️ 이렇게 질문해 볼 수 있어요
    //     \n 1. 키워드 위주로 질문해보세요 ex. 반도체, 인공지능 등
    //     \n 2. 타임머신 발명되어서 과거 주식 거래 가능해지면?
    //     \n 3. 치킨 가격 인상 관련주 있나?`,
    //   },
    // },
  ];
}
