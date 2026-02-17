# Frontend Structure Reference

> Backend 작업 시 참고용 프론트엔드 구조 문서
> 최종 업데이트: 2026-01-10

---

## 1. 기술 스택

| 항목 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 15.3.2 |
| UI Library | React | 19.1.0 |
| Language | TypeScript | 5.8.3 |
| State Management | Zustand | 5.0.6 |
| Styling | Tailwind CSS | 4.1.11 |
| Charts | Recharts | 3.3.0 |
| Markdown | React Markdown | 10.1.0 |
| Animation | Motion | 12.19.2 |
| Database ORM | Drizzle | 0.43.1 |

---

## 2. 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (service)/          # 서비스 페이지 그룹
│   │   ├── chat/           # 채팅 기능
│   │   ├── stock-detail/   # 종목 상세
│   │   └── portfolio/      # 포트폴리오
│   └── api/                # API Routes
├── components/             # 공통 UI 컴포넌트
├── hooks/                  # Custom React Hooks (15개)
├── lib/                    # 유틸리티 함수
├── stores/                 # Zustand 상태 관리
├── styles/                 # CSS 설정
└── types/                  # TypeScript 타입 정의
```

---

## 3. API Routes

### 3.1 채팅 관련

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/chat/stream` | POST | AI 응답 스트리밍 |
| `/api/chat/history` | GET/POST | 채팅 세션 관리 |
| `/api/chat/messages/[sessionId]` | GET | 세션별 메시지 조회 |
| `/api/chat/limit` | GET | 일일 사용량 조회 |
| `/api/chat/model-sessions` | GET | 모델별 세션 조회 |

### 3.2 기타

| Endpoint | Method | 설명 |
|----------|--------|------|
| `/api/auth/kakao` | GET | OAuth 인증 |
| `/api/health` | GET | 헬스체크 |
| `/api/share/log` | POST | 공유 로깅 |
| `/api/retention` | POST | 리텐션 추적 |

---

## 4. 채팅 응답 구조 (Backend Response Format)

### 4.1 기본 메시지 응답

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  metadata?: {
    model?: string;
    tokens_used?: number;
  };
}
```

### 4.2 스트리밍 응답 형식

```typescript
// Server-Sent Events (SSE) 형식
// Content-Type: text/event-stream

// 텍스트 청크
data: {"type": "text", "content": "응답 텍스트..."}

// 완료
data: {"type": "done", "metadata": {...}}

// 에러
data: {"type": "error", "message": "에러 메시지"}
```

### 4.3 세션 한도 정보

```typescript
interface SessionLimitInfo {
  can_continue: boolean;
  current_messages: number;
  max_messages: number;           // 50
  remaining_messages: number;
  current_tokens: number;
  max_tokens: number;             // 100,000
  remaining_tokens: number;
  limit_reason: string | null;    // 'message_limit' | 'token_limit' | null
}
```

---

## 5. 시각화 데이터 구조 (Visualization)

### 5.1 Backend 응답에 포함할 시각화 데이터

```typescript
interface VisualizationData {
  type: 'line_chart' | 'bar_chart' | 'candlestick' | 'table' | 'pie_chart';
  title: string;
  data: ChartData;
  options?: ChartOptions;
}

interface ChatResponseWithVisualization {
  message: string;
  visualization?: VisualizationData;
  sql_result?: Record<string, any>;
  metadata?: Record<string, any>;
}
```

### 5.2 Line Chart 데이터

```typescript
interface LineChartData {
  labels: string[];              // X축 레이블 (날짜 등)
  datasets: [{
    label: string;               // 범례 이름
    data: number[];              // Y축 값
    borderColor?: string;        // 선 색상 (기본: #2563eb)
  }];
}

// 예시
{
  "type": "line_chart",
  "title": "삼성전자 주가 추이 (30일)",
  "data": {
    "labels": ["12/01", "12/02", "12/03"],
    "datasets": [{
      "label": "종가",
      "data": [71000, 71500, 72000],
      "borderColor": "#2563eb"
    }]
  },
  "options": {
    "yAxisLabel": "가격 (원)",
    "xAxisLabel": "날짜"
  }
}
```

### 5.3 Bar Chart 데이터

```typescript
interface BarChartData {
  labels: string[];              // X축 레이블 (종목명 등)
  datasets: [{
    label: string;
    data: number[];
    backgroundColor?: string[];  // 막대 색상
  }];
}

// 예시
{
  "type": "bar_chart",
  "title": "거래대금 상위 5개",
  "data": {
    "labels": ["삼성전자", "SK하이닉스", "LG에너지솔루션", "삼성바이오", "현대차"],
    "datasets": [{
      "label": "거래대금 (억원)",
      "data": [5420, 3210, 2890, 2450, 2100]
    }]
  }
}
```

### 5.4 Candlestick Chart 데이터

```typescript
interface CandlestickDataPoint {
  time: string;                  // 'YYYY-MM-DD' 형식
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// 예시
{
  "type": "candlestick",
  "title": "삼성전자 일봉 차트",
  "data": [
    {"time": "2026-01-01", "open": 71000, "high": 72500, "low": 70500, "close": 72000},
    {"time": "2026-01-02", "open": 72000, "high": 73000, "low": 71500, "close": 71800}
  ]
}
```

### 5.5 Table 데이터

```typescript
interface TableData {
  headers: string[];             // 컬럼 헤더
  rows: (string | number)[][];   // 데이터 행
}

// 예시
{
  "type": "table",
  "title": "RSI 30 이하 종목",
  "data": {
    "headers": ["종목코드", "종목명", "현재가", "RSI", "등락률"],
    "rows": [
      ["005930", "삼성전자", 71000, 28.5, -2.3],
      ["000660", "SK하이닉스", 125000, 25.2, -3.1]
    ]
  }
}
```

### 5.6 Pie Chart 데이터

```typescript
interface PieChartData {
  labels: string[];              // 항목명
  data: number[];                // 값 (비율로 자동 계산됨)
  backgroundColor?: string[];    // 색상
}

// 예시
{
  "type": "pie_chart",
  "title": "섹터별 비중",
  "data": {
    "labels": ["IT", "금융", "헬스케어", "소비재", "산업재"],
    "data": [35, 25, 20, 12, 8]
  }
}
```

---

## 6. 기존 차트 컴포넌트 참조

### 6.1 stockDetailChart.tsx

- **위치:** `src/app/(service)/stock-detail/_components/stockDetailChart.tsx`
- **기술:** Recharts LineChart
- **기능:**
  - 그라데이션 채움
  - 커스텀 툴팁 (가격 + 원)
  - 기준선 (현재가)
  - 시간 범위 선택 (1일, 1주, 1달, 1년, 5년, 최대)

### 6.2 customChart.tsx

- **위치:** `src/app/(service)/portfolio/[pageId]/_components/customChart.tsx`
- **기술:** Recharts AreaChart
- **기능:**
  - 다중 세그먼트 (상승: 빨강, 하락: 파랑, 중립: 회색)
  - 벤치마크 비교선
  - 커스텀 라벨

### 6.3 차트 유틸리티

- **위치:** `src/lib/utils/chart-formatters.ts`
- **함수:**
  - `formatPrice()` - 가격 포맷 (28,050)
  - `formatPriceWithUnit()` - 가격 + 원 (28,050원)
  - `formatPercent()` - 등락률 포맷
  - `calculateYAxisDomain()` - Y축 범위 계산

---

## 7. Zustand 상태 관리

### 7.1 Store 목록

| Store | 파일 | 용도 |
|-------|------|------|
| AppStore | `app-store.ts` | 앱 전역 상태 |
| ChatSessionStore | `chat-session-store.ts` | 채팅 세션 상태 |
| ChatLimitStore | `chat-limit-store.ts` | 사용량 한도 |
| StreamingStore | `streaming-store.ts` | 스트리밍 상태 |

### 7.2 ChatSessionStore 주요 상태

```typescript
interface ChatSessionStore {
  // 상태
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  sessionLimit: SessionLimitInfo | null;

  // 액션
  setSessionId: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  setSessionLimit: (limit: SessionLimitInfo) => void;
  clearSession: () => void;
}
```

---

## 8. 채팅 컴포넌트 구조

```
chat/_components/
├── chat-interface.tsx      # 메인 컨테이너
├── message-list.tsx        # 메시지 목록
├── message-item.tsx        # 개별 메시지
├── ai-message.tsx          # AI 응답 렌더링 (마크다운 지원)
├── message-input.tsx       # 입력창
├── chat-header.tsx         # 헤더
├── chat-guide-message.tsx  # 가이드/경고 메시지
├── formatted-text.tsx      # 마크다운 렌더링
└── tool-call-section.tsx   # 도구 호출 표시
```

---

## 9. 시각화 트리거 조건 (권장)

```python
# Backend에서 질문 키워드에 따라 차트 타입 결정
VISUALIZATION_TRIGGERS = {
    "추이": "line_chart",      # "삼성전자 주가 추이"
    "차트": "candlestick",     # "삼성전자 일봉 차트"
    "비교": "bar_chart",       # "거래량 비교"
    "상위": "table",           # "거래대금 상위 10개"
    "랭킹": "table",           # "시총 랭킹"
    "비중": "pie_chart",       # "섹터별 비중"
    "분포": "pie_chart",       # "등급 분포"
}
```

---

## 10. 색상 팔레트

| 용도 | 색상 코드 | 설명 |
|------|----------|------|
| Primary Blue | `#2563eb` | 기본 선 색상 |
| Up/Positive | `#ef4444` | 상승 (빨강) |
| Down/Negative | `#3b82f6` | 하락 (파랑) |
| Neutral | `#6b7280` | 중립 (회색) |
| Background | `#f8fafc` | 배경색 |

---

## 11. 주의사항

1. **날짜 형식:** `YYYY-MM-DD` 또는 `MM/DD` 형식 권장
2. **숫자 포맷:** 천 단위 구분자 (,) 사용
3. **통화:** 원화는 숫자만, 달러는 $ 접두사
4. **응답 크기:** 차트 데이터는 100개 포인트 이하 권장
5. **에러 처리:** `visualization` 필드는 optional, 없으면 텍스트만 표시

---

## 12. 파일 참조 경로

| 용도 | 경로 |
|------|------|
| 차트 타입 정의 | `src/types/chart.d.ts` |
| 차트 유틸리티 | `src/lib/utils/chart-formatters.ts` |
| 채팅 컴포넌트 | `src/app/(service)/chat/_components/` |
| 채팅 훅 | `src/hooks/use-chat-*.ts` |
| 스토어 | `src/stores/` |
| API 라우트 | `src/app/api/` |
