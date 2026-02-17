# 떡상 - Frontend Client(www.dducksang.com)

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?logo=railway&logoColor=white)

시나리오 기반 주식 투자 전략 서비스 "떡상"의 프론트엔드 애플리케이션입니다. Next.js 15 App Router와 React 19를 사용하여 모바일 우선 설계로 개발된 PWA입니다.

---

## 목차

- [이 저장소의 역할](#이-저장소의-역할)
- [프로젝트 구조](#프로젝트-구조)
- [서비스 페이지 구성](#서비스-페이지-구성)
- [Redis 캐싱 시스템](#redis-캐싱-시스템)
- [아키텍처 개요](#아키텍처-개요)
- [인증 및 보안](#인증-및-보안)
- [기술 스택](#기술-스택)
- [PWA 및 모바일 기능](#pwa-및-모바일-기능)
- [데이터베이스 워크플로우](#데이터베이스-워크플로우)
- [개발 환경 요구사항](#개발-환경-요구사항)
- [내부 디렉토리 구조](#내부-디렉토리-구조)

---

## 이 저장소의 역할

전체 프로젝트 중 **Frontend (UI/UX)** 컴포넌트를 담당합니다.

- AI 기반 한국/미국 주식 분석 플랫폼의 프론트엔드
- 실시간 SSE 스트리밍 AI 채팅 인터페이스
- 모바일 우선 PWA (Progressive Web App)
- Kakao OAuth 인증 및 세션 관리

## 프로젝트 구조

| 저장소 | 설명 | 기술 스택 |
|--------|------|-----------|
| [**overview**](https://github.com/vinjung/alphafolio_overview) | 프로젝트 설명 | - |
| [**client**](https://github.com/vinjung/alphafolio_client) | **📍 Frontend (UI/UX) (현재 저장소)**  | Next.js 15, React 19, Tailwind CSS 4, Redis |
| [**api**](https://github.com/vinjung/alphafolio_api) | AI 채팅 백엔드 API | FastAPI, LangGraph, ChromaDB, Fine-tuned GPT |
| [**data**](https://github.com/vinjung/alphafolio_data) | 데이터 자동 수집 & 지표 계산 | FastAPI, asyncpg, Cloud Scheduler |
| [**chat**](https://github.com/vinjung/alphafolio_chat) | AI 비서 개발환경 | LangChain, LangGraph, ChromaDB |
| [**quant**](https://github.com/vinjung/alphafolio_quant) | 멀티팩터 퀀트 분석 엔진 | NumPy, SciPy, hmmlearn |
| [**stock_agent**](https://github.com/vinjung/alphafolio_stock_agent) | 종목 투자 전략 Multi-Agent AI | LangGraph, Task-driven Architecture |
| [**portfolio**](https://github.com/vinjung/alphafolio_portfolio) | 포트폴리오 생성 & 리밸런싱 엔진 | Risk Parity, VaR/CVaR, LangGraph |

---

## 서비스 페이지 구성

| 경로 | 페이지 | 렌더링 | 설명 |
|------|--------|--------|------|
| `/` | 온보딩 | Static | 랜딩 + 카카오 로그인 |
| `/terms` | 약관 | Static | 이용약관 페이지 |
| `/myportfolio` | 내 포트폴리오 | SSR | 즐겨찾기 포트폴리오 목록 |
| `/mystock` | 내 종목 | SSR | 즐겨찾기 종목 목록 |
| `/discover/list` | 포트폴리오 리스트 | SSR | 전체 LIVE 포트폴리오 목록 |
| `/discover/find` | 종목 검색 + 추천주 | CSR | 종목 검색 + 오늘의 추천주 Top 3 |
| `/portfolio/[pageId]` | 포트폴리오 상세 | SSR | 수익률 차트, 보유 종목, 리밸런싱 리포트 |
| `/stock-detail/[stockId]` | 종목 상세 | SSR | 등급, 차트, 시나리오, AI 전략 생성 (유료) |
| `/chat` | AI 채팅 | SSR | 주식 AI / 뇌절 AI 채팅 |
| `/chat/[chatId]` | 채팅 세션 | SSR | 특정 채팅 세션 이어하기 |
| `/mypage` | 마이페이지 | SSR | 프로필, 설정 |

---

## Redis 캐싱 시스템

### 캐싱 구조

데이터 갱신 시점이 고정되어 있어 캐시 효율이 높은 구조입니다.

| 데이터 | 갱신 시점 | 캐시 만료 | 파일 |
|--------|----------|----------|------|
| KR 종목 상세/차트 | 매일 20:00 | 당일 19:59 | stock.ts |
| US 종목 상세/차트 | 매일 15:30 | 당일 15:29 | stock.ts |
| 포트폴리오 리스트 | KR 기준 | 당일 19:59 | portfolio.ts |
| 포트폴리오 상세/보유종목/차트/리밸런싱 | KR 또는 US | 국가별 TTL | portfolio.ts |
| 일일 추천주 (KR) | 매일 20:00 | 당일 19:59 | recommendation.ts |
| 일일 추천주 (US) | 매일 15:30 | 당일 15:29 | recommendation.ts |
| 전체 종목 검색 목록 | 거의 변동 없음 | 24시간 (HTTP) | api/stock/list |

### 캐시 키 (lib/redis.ts)
```
stock:detail:{SYMBOL}
stock:chart:{SYMBOL}:{RANGE}
stock:strategy:{SYMBOL}
recommendation:daily:{COUNTRY}
portfolio:list:{COUNTRY}
portfolio:detail:{ID}
portfolio:holdings:{ID}
portfolio:chart:{ID}:{RANGE}
portfolio:rebalancing:{ID}
```

### 작동 방식
- Redis online + `REDIS_URL` 환경변수 설정 시 자동 활성화
- Redis offline 시 DB 직접 조회로 자동 fallback (코드 수정 없음)
- TTL 계산: `calculateTTL(market)` - 다음 갱신 시점까지 초 단위 계산
- 주말/휴일 처리: KR(금요일->월요일), US(토요일->화요일) 자동 계산

---

## 아키텍처 개요

### AI 채팅 시스템
- **주식 AI (SKYROCKET)**: 데이터 기반 주식 분석 (Text-to-SQL, RAG)
- **뇌절 AI (BRAIN_CRASH)**: 창의적 시장 분석
- **SSE 스트리밍**: 실시간 응답 스트리밍
- **중단 가능**: 사용자가 응답 중도 중단 가능
- **자동 저장**: 채팅 내역 자동 저장 및 세션 관리

### 데이터베이스 스키마 (PostgreSQL + Drizzle)
```
# 사용자 관리
├── users                    # OAuth 프로필 (soft delete 지원)
├── sessions                 # 보안 세션 (30일 만료)
└── user_limits              # 일일 채팅 한도

# 채팅 시스템
├── chat_sessions            # 채팅 대화 (모델 추적)
└── chat_messages            # 개별 채팅 메시지

# 주식 데이터 (퀀트 분석 결과)
├── kr_stock_grade           # 한국 종목 등급/점수
├── us_stock_grade           # 미국 종목 등급/점수
├── kr_intraday_total        # 한국 종목 가격 데이터
├── us_daily                 # 미국 종목 가격 데이터
└── daily_recommendation     # 일일 추천주 Top 3

# 포트폴리오
├── portfolio_master         # 포트폴리오 메타 (country, status, budget)
├── portfolio_holdings       # 보유 종목
├── portfolio_daily_performance  # 일일 성과
├── portfolio_daily_report   # 일일 리포트
├── rebalancing_history      # 리밸런싱 기록
└── rebalancing_report       # AI 리밸런싱 리포트

# 즐겨찾기
├── favorite_portfolios      # 포트폴리오 즐겨찾기
└── favorite_stocks          # 종목 즐겨찾기

# 분석
├── share_activity_logs      # 공유 추적
├── signup_activity_logs     # UTM 추적
├── daily_user_retention     # 리텐션 추적
└── user_statistics          # 가입 통계
```

---

## 인증 및 보안

### OAuth 2.0 (Kakao)
- **Arctic 3.7.0**: OAuth2 클라이언트 라이브러리
- **Oslo Crypto**: 안전한 세션 토큰 생성
- **30일 세션**: 자동 만료 및 갱신
- **Soft Delete**: 사용자 데이터 보존

### 보안 헤더
- **CSP**: Content Security Policy
- **CSRF 보호**: 동일 출처 정책
- **보안 쿠키**: HttpOnly, Secure, SameSite

---

## 기술 스택

### 핵심 기술
- **Next.js 15** (App Router, Turbopack)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + **PostCSS**
- **Drizzle ORM** + **PostgreSQL** (타입 참조 전용)
- **Redis** (서버 사이드 캐싱)

### 상태 관리 및 데이터
- **Zustand** (DevTools 포함)
- **React Markdown** (채팅 포맷팅)

### UI/UX
- **CVA** (컴포넌트 변형)
- **Motion** (애니메이션)
- **SVGR** (SVG 컴포넌트 변환)

### 배포 및 인프라
- **Railway** (클라우드 배포 플랫폼)
- **Cloudinary** (이미지 최적화 및 CDN)

---

## PWA 및 모바일 기능

### PWA 지원
- 앱 매니페스트: 한국어 브랜딩, 독립형 앱 모드
- 앱 아이콘: Android Chrome 최적화 (192x192, 512x512, maskable)
- 브랜드 테마: 떡상 (#FF2233)

### 모바일 우선 설계
- **터치 최적화**: Pull-to-refresh, 스와이프 네비게이션
- **세이프 에어리어**: iOS 지원
- **반응형 디자인**: Tailwind CSS 모바일 퍼스트
- **하단 네비게이션**: 활성 상태 표시

---

## 데이터베이스 워크플로우

### 스키마 관리 원칙
- **SQL 우선**: 모든 테이블 생성/수정은 SQL로 직접 수행
- **Drizzle 역할**: TypeScript 타입 안전성만 제공
- **워크플로우**: SQL 변경 -> `pnpm db:pull` -> 타입 동기화

### 스키마 변경 프로세스
1. **PgAdmin/Railway Console**에서 SQL로 테이블 변경
2. `pnpm db:pull` 실행 (자동으로 date 타입 후처리)
3. 애플리케이션 코드에서 새 타입 사용
4. 테스트 후 배포

> **중요**: `db:push`, `db:generate` 명령어는 사용하지 않음

---

## 개발 환경 요구사항

- **Node.js**: 18+ (권장: 20.x)
- **pnpm**: 8+
- **PostgreSQL**: 14+
- **환경 변수**: OAuth, 데이터베이스, Redis, Cloudinary 설정 필요

---

## 내부 디렉토리 구조

### Next.js App Router
```
src/app/
├── layout.tsx                      # 루트 레이아웃
├── manifest.ts                     # PWA 매니페스트
│
├── (onboarding)/                   # 온보딩 라우트 그룹
│   ├── page.tsx                    # 랜딩 페이지 (/)
│   ├── terms/
│   │   └── page.tsx                # /terms (약관 페이지)
│   └── _components/
│       ├── carousel.tsx
│       ├── kakao-login-with-terms.tsx
│       ├── social-login-button.tsx
│       └── terms-agreement-modal.tsx
│
├── (service)/                      # 서비스 라우트 그룹 (인증 필요)
│   ├── layout.tsx
│   ├── _components/
│   │   └── bottom-navigation.tsx
│   │
│   ├── (home)/                     # 홈 탭 라우트 그룹
│   │   ├── layout.tsx
│   │   ├── _components/
│   │   │   ├── favoriteList.tsx
│   │   │   ├── favoriteItemPortfolio.tsx
│   │   │   └── scroll-container.tsx
│   │   ├── myportfolio/
│   │   │   └── page.tsx            # /myportfolio
│   │   └── mystock/
│   │       ├── page.tsx            # /mystock
│   │       └── _components/
│   │           └── stockTable.tsx
│   │
│   ├── discover/                   # 탐색 탭
│   │   ├── layout.tsx
│   │   ├── _components/
│   │   │   ├── discover-tabs-with-info.tsx
│   │   │   ├── market-toggle.tsx
│   │   │   ├── stock-card.tsx
│   │   │   └── stock-carousel.tsx
│   │   ├── list/
│   │   │   └── page.tsx            # /discover/list
│   │   └── find/
│   │       └── page.tsx            # /discover/find
│   │
│   ├── portfolio/[pageId]/         # 포트폴리오 상세
│   │   ├── layout.tsx
│   │   ├── page.tsx                # /portfolio/[pageId]
│   │   └── _components/
│   │       ├── customChart.tsx
│   │       ├── customTable.tsx
│   │       ├── portfolioReportSection.tsx
│   │       ├── rebalancingInfoModal.tsx
│   │       ├── rebalancingReportSection.tsx
│   │       └── targetTable.tsx
│   │
│   ├── stock-detail/[stockId]/     # 종목 상세
│   │   ├── page.tsx                # /stock-detail/[stockId]
│   │   └── _components/
│   │       ├── back-button.tsx
│   │       ├── grade-trend-chart.tsx
│   │       ├── stockDetailChart.tsx
│   │       ├── strategy-generator.tsx
│   │       └── tradingViewChart.tsx
│   │
│   ├── chat/                       # AI 채팅
│   │   ├── page.tsx                # /chat
│   │   ├── [chatId]/
│   │   │   └── page.tsx            # /chat/[chatId]
│   │   ├── _config/
│   │   │   └── models.ts
│   │   └── _components/
│   │       ├── ai-message.tsx
│   │       ├── chat-guide-message.tsx
│   │       ├── chat-header.tsx
│   │       ├── chat-history-modal.tsx
│   │       ├── chat-interface.tsx
│   │       ├── chat-limit-badge.tsx
│   │       ├── chat-skeleton.tsx
│   │       ├── data-table.tsx
│   │       ├── formatted-text.tsx
│   │       ├── message-input.tsx
│   │       ├── message-item.tsx
│   │       ├── message-list.tsx
│   │       ├── model-selector.tsx
│   │       ├── streaming-progress.tsx
│   │       ├── tool-call-section.tsx
│   │       └── visualization/      # 차트/테이블 시각화
│   │           ├── bar-chart.tsx
│   │           ├── candlestick-chart.tsx
│   │           ├── chart-renderer.tsx
│   │           ├── line-chart.tsx
│   │           ├── multi-chart.tsx
│   │           └── pie-chart.tsx
│   │
│   └── mypage/                     # 마이페이지
│       ├── page.tsx                # /mypage
│       └── _components/
│           ├── confirm-modal.tsx
│           ├── menu-item.tsx
│           ├── menu-section.tsx
│           ├── profile-edit-modal.tsx
│           └── profile-section.tsx
│
└── api/                            # API 라우트
    ├── auth/
    │   ├── kakao/
    │   │   ├── route.ts            # OAuth 시작
    │   │   └── callback/route.ts   # OAuth 콜백
    │   └── register/route.ts       # 회원가입
    ├── chat/
    │   ├── stream/route.ts         # AI 스트리밍
    │   ├── save/route.ts           # 채팅 저장
    │   ├── history/route.ts        # 히스토리 CRUD
    │   ├── limit/route.ts          # 사용량 한도
    │   ├── delete/route.ts         # 채팅 삭제
    │   ├── model-sessions/route.ts # 모델별 세션
    │   ├── messages/[sessionId]/route.ts
    │   └── job/                    # 비동기 AI 작업
    │       ├── active/route.ts     # 활성 작업 조회
    │       └── [jobId]/
    │           └── stream/route.ts # 작업 스트리밍
    ├── stock/
    │   ├── grade/route.ts          # 종목 상세 (캐싱)
    │   ├── grade-history/route.ts  # 등급 변동 이력
    │   ├── list/route.ts           # 전체 종목 (24시간 캐싱)
    │   ├── chart/route.ts          # 종목 차트
    │   └── search/route.ts         # 종목 검색
    ├── portfolio/
    │   └── chart/route.ts          # 포트폴리오 차트
    ├── recommendation/
    │   └── route.ts                # 일일 추천주 (캐싱)
    ├── stock-agents/               # 멀티 AI 에이전트 프록시 (유료회원 전용)
    │   ├── generate/route.ts       # 전략 생성 요청 (세션+등급 확인 → stock_agents)
    │   └── status/[symbol]/route.ts # 생성 상태 폴링 (세션 확인 → stock_agents)
    ├── favorite/
    │   ├── toggle/route.ts         # 즐겨찾기 토글
    │   ├── status/route.ts         # 즐겨찾기 상태
    │   ├── portfolios/route.ts     # 즐겨찾기 포트폴리오
    │   └── stocks/route.ts         # 즐겨찾기 종목
    ├── health/route.ts
    ├── retention/route.ts
    ├── share/log/route.ts
    └── signup/log/route.ts
```

### 서버 사이드 함수 (lib/server/)
```
lib/
├── redis.ts                   # Redis 캐싱 클라이언트 (node-redis, CacheKeys, calculateTTL)
└── server/
    ├── db.ts                  # Drizzle 데이터베이스 설정
    ├── session.ts             # 세션 관리
    ├── oauth.ts               # Kakao OAuth
    ├── user.ts                # 사용자 관리
    ├── stock.ts               # 종목 조회 (Redis 캐싱)
    ├── portfolio.ts           # 포트폴리오 조회 (Redis 캐싱)
    ├── recommendation.ts      # 일일 추천주 조회 (Redis 캐싱)
    ├── favorite.ts            # 즐겨찾기 조회/토글
    ├── chat-history.ts        # 채팅 히스토리
    ├── chat-limit.ts          # 채팅 한도
    ├── api-config.ts          # API 및 Railway 설정
    ├── models.ts              # 데이터베이스 모델
    ├── rate-limit.ts          # 레이트 리미팅
    ├── redis.ts               # Redis 스트리밍 클라이언트 (ioredis)
    ├── request.ts             # HTTP 요청 유틸리티
    ├── retention-tracker.ts   # 리텐션 추적
    ├── share-analytics.ts     # 공유 분석
    ├── signup-analytics.ts    # 가입 분석
    ├── signup-tracker.ts      # 가입 추적
    ├── user-limit-management.ts # 사용자 한도 관리
    └── actions/               # Server Actions
        ├── index.ts
        ├── auth.ts            # 인증 관련 액션
        └── user.ts            # 사용자 관련 액션
```

### 공유 컴포넌트 (components/shared/)
```
components/shared/
├── button.tsx             # CVA 기반 버튼 시스템
├── modal.tsx              # 모달 다이얼로그
├── text.tsx               # 텍스트 컴포넌트
├── input.tsx              # 폼 입력
├── badge.tsx              # 상태 배지
├── chip.tsx               # 선택 가능한 칩
├── tab-item.tsx           # 탭 아이템
├── snackbar.tsx           # 토스트 알림
├── tooltip.tsx            # 툴팁
├── loading-dots.tsx       # 로딩 인디케이터
├── stock-search.tsx       # 종목 검색 (클라이언트 사이드 필터링)
├── favorite-button.tsx    # 즐겨찾기 버튼
├── info-popover.tsx       # 정보 팝오버
├── analysis-info-modal.tsx # 분석 정보 모달
├── premium-content.tsx    # 유료회원 전용 콘텐츠 (블러 + 잠금)
├── footer.tsx             # 서비스 푸터
├── bfcache-refresh.tsx    # BFCache 새로고침
└── service-suspension-modal.tsx # 서비스 점검 모달
```

### 커스텀 훅 (hooks/)
```
hooks/
├── use-chat-stream.ts       # 실시간 SSE 스트리밍
├── use-chat-session.ts      # 채팅 세션 상태
├── use-chat-messages.ts     # 채팅 메시지 로딩/저장
├── use-chat-save.ts         # 채팅 세션 저장
├── use-chat-status.ts       # 채팅 UI 상태
├── use-chat-limit.ts        # 채팅 사용량 한도
├── use-chat-model.ts        # AI 모델 선택
├── use-chat-navigation.ts   # 채팅 페이지 네비게이션
├── use-navigation-guard.ts  # 페이지 이동 가드
├── use-pull-to-refresh.ts   # 풀투리프레시 제스처
├── use-retention-tracker.ts # 사용자 리텐션 추적
├── use-share.ts             # 콘텐츠 공유
├── use-snackbar.ts          # 토스트 알림
├── use-tab-navigation.ts    # 탭 네비게이션 상태
└── use-tooltip.ts           # 툴팁 상태
```

### Zustand 상태 관리 (stores/)
```
stores/
├── streaming-store.ts       # 실시간 AI 스트리밍 상태
├── app-store.ts             # 글로벌 앱 상태 (모델 선택, 프리셋 메시지)
├── chat-session-store.ts    # 채팅 세션 및 메시지
├── chat-limit-store.ts      # 사용자 일일 채팅 한도
└── index.ts                 # 스토어 내보내기
```

---

## ⚠️ **사업 코드 - 제한적 공개**

🚫 **상업적 사용 / 수정 / 재배포 엄격 금지**
⏰ **임시 공개 후 Private 전환 예정**
👁️ **참고용으로만 사용하세요**

## License
[CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)
