# 떡상 커스텀 도메인(dducksang.com) 설정 가이드

기존 Railway 제공 URL(`https://client-production-b0352.up.railway.app/`)을 자체 도메인(`https://dducksang.com`)으로 교체하는 방법을 정리한 문서입니다.

---

## 1. Railway 커스텀 도메인 추가

1. [Railway 대시보드](https://railway.app) 접속
2. 프로젝트 → **client** 서비스 선택
3. **Settings** → **Networking** → **Add Custom Domain** 클릭
4. 아래 정보 입력:
   - **Domain**: `dducksang.com`
   - **Target port**: `3000` (Next.js 기본 포트)
5. 추가 후 Railway가 안내하는 **DNS 레코드 값**을 복사해둔다

> Railway는 커스텀 도메인 추가 후 DNS 설정이 완료되어야 SSL 인증서를 자동 발급합니다.

---

## 2. 도메인 DNS 설정

도메인을 구매한 곳(가비아, Cloudflare, Namecheap 등)의 DNS 관리 페이지에서 레코드를 추가합니다.

### 방법 A: CNAME 레코드 (권장)

| 타입 | 호스트 | 값 | TTL |
|------|--------|-----|-----|
| CNAME | `@` 또는 루트 | Railway가 제공하는 값 (예: `client-production-b0352.up.railway.app`) | 자동/300 |

> **주의**: 일부 DNS 제공자는 루트 도메인(`dducksang.com`)에 CNAME을 설정할 수 없습니다.
> 이 경우 아래 방법 중 하나를 선택하세요:
> - **Cloudflare** 사용 시: CNAME Flattening을 자동 지원하므로 루트 도메인에 CNAME 설정 가능
> - `www.dducksang.com`으로 CNAME을 설정하고, 루트 도메인에서 `www`로 리다이렉트 설정

### 방법 B: www 서브도메인 사용

| 타입 | 호스트 | 값 | TTL |
|------|--------|-----|-----|
| CNAME | `www` | Railway가 제공하는 값 | 자동/300 |

이 경우 Railway에서 도메인을 `www.dducksang.com`으로 등록해야 합니다.

### DNS 전파 확인

설정 후 전파까지 수분~최대 48시간이 소요될 수 있습니다. 아래 명령어로 확인 가능:

```bash
# DNS 전파 확인
nslookup dducksang.com
dig dducksang.com
```

---

## 3. Railway 환경변수 업데이트

Railway 대시보드 → client 서비스 → **Variables**에서 아래 환경변수를 확인/수정합니다:

```
NEXT_PUBLIC_APP_URL=https://dducksang.com
```

이 변수는 코드 내 아래 위치에서 사용됩니다:

| 파일 | 용도 |
|------|------|
| `src/app/layout.tsx` | 메타데이터 siteUrl |
| `src/app/sitemap.ts` | 사이트맵 baseUrl |
| `src/app/robots.ts` | robots.txt baseUrl |
| `src/app/(onboarding)/page.tsx` | 온보딩 페이지 canonical URL, OG 이미지 |
| `src/app/api/auth/register/route.ts` | 회원가입 후 리다이렉트 |
| `src/app/api/auth/kakao/callback/route.ts` | 카카오 로그인 콜백 리다이렉트 |

> 코드에는 이미 `process.env.NEXT_PUBLIC_APP_URL || 'https://dducksang.com'`으로 fallback이 설정되어 있으므로, 환경변수만 올바르게 설정하면 별도 코드 수정은 필요 없습니다.

---

## 4. 카카오 OAuth 설정 변경

카카오 로그인을 사용하므로, [Kakao Developers](https://developers.kakao.com)에서 도메인 관련 설정을 업데이트해야 합니다.

### 4-1. 플랫폼 등록

1. **내 애플리케이션** → 해당 앱 선택
2. **앱 설정** → **플랫폼** → **Web**
3. 사이트 도메인에 `https://dducksang.com` 추가
   - 기존 Railway URL은 테스트용으로 남겨두거나 제거

### 4-2. 카카오 로그인 Redirect URI

1. **제품 설정** → **카카오 로그인**
2. **Redirect URI**에 추가:
   ```
   https://dducksang.com/api/auth/kakao/callback
   ```
3. 기존 Railway URL의 Redirect URI는 이전이 완료된 후 제거

> **중요**: Redirect URI를 변경하지 않으면 카카오 로그인 시 "redirect_uri mismatch" 에러가 발생합니다.

---

## 5. SSL 인증서 확인

Railway는 커스텀 도메인에 대해 **Let's Encrypt SSL 인증서를 자동 발급**합니다.

- DNS 전파가 완료되면 자동으로 인증서가 생성됨
- Railway 대시보드 → Settings → Networking에서 인증서 상태 확인 가능
- 정상 발급 시 `https://dducksang.com`으로 접속했을 때 자물쇠 아이콘이 표시됨

---

## 6. 최종 확인 체크리스트

- [ ] Railway에 커스텀 도메인(`dducksang.com`) 추가 완료
- [ ] DNS CNAME 레코드 설정 완료
- [ ] DNS 전파 확인 (`nslookup dducksang.com`)
- [ ] Railway 환경변수 `NEXT_PUBLIC_APP_URL=https://dducksang.com` 설정
- [ ] SSL 인증서 자동 발급 확인 (HTTPS 접속 확인)
- [ ] 카카오 Developers 사이트 도메인 추가
- [ ] 카카오 로그인 Redirect URI 업데이트
- [ ] `https://dducksang.com` 접속 테스트
- [ ] 카카오 로그인 테스트
- [ ] 기존 Railway URL 접속 시 동작 확인 (필요 시 리다이렉트 설정)
