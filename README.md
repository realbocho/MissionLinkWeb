# MissionLink (Web v2)

웹 기반 신용카드 후원 미션 플랫폼

## 스택
- **Frontend**: React + Vite (Vercel)
- **API**: Vercel Serverless Functions
- **DB**: Supabase (PostgreSQL)
- **Auth**: JWT (이메일/비밀번호)
- **결제**: Stripe (신용카드)

## 변경 사항 (v1 → v2)
- ❌ 텔레그램 미니앱 → ✅ 일반 웹사이트
- ❌ TON Connect (암호화폐) → ✅ Stripe 신용카드
- ❌ Telegram 로그인 → ✅ 이메일/비밀번호 + JWT

## 배포 순서

### 1. Supabase 설정
1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. Settings → API에서 `URL`과 `service_role` 키 복사

### 2. Stripe 설정
1. [stripe.com](https://stripe.com)에서 계정 생성
2. Dashboard → Developers → API keys에서 키 복사
3. Webhooks 설정: `https://your-domain.vercel.app/api/payments/webhook`
   - Events: `payment_intent.succeeded`
4. Stripe Connect 설정 (크리에이터 정산용)

### 3. Vercel 배포
```bash
npm i -g vercel
vercel --prod
```

### 4. 환경변수 설정 (Vercel Dashboard → Settings → Environment Variables)
`.env.example` 참고

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/users/me` | 내 정보 |
| GET | `/api/missions` | 미션 목록 |
| POST | `/api/missions` | 미션 생성 |
| GET | `/api/missions/:id` | 미션 상세 |
| PATCH | `/api/missions/:id` | 미션 수정/취소 |
| POST | `/api/donations` | 후원 등록 |
| POST | `/api/payments/create-intent` | Stripe PaymentIntent 생성 |
| POST | `/api/payments/webhook` | Stripe 웹훅 (자동 확인) |

## 결제 플로우

```
사용자 금액 입력 + 카드 정보 입력
  → /api/payments/create-intent (PaymentIntent 생성)
    → Stripe.confirmCardPayment (프론트에서 결제)
      → payment_intent.succeeded webhook
        → donations 테이블 confirmed 상태로 저장
          → mission.current_ton 즉시 업데이트
            → 목표 달성 시 추첨 → 당첨자 이메일 알림
```
