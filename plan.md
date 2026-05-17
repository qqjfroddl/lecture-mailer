# 강의 메일 자동화 앱 (lecture-mailer) — Plan

## 1. 무엇을 만드는가

박재현 소장의 강의 진행 워크플로우 중 **시작 전 자료 공유 메일** + **종료 후 복습 자료 메일** 발송을 자동화하는 웹 앱.
관리자(소장)는 강의별 교육과정을 생성하고, 학습자는 QR/링크로 자신의 이메일을 등록하며, 관리자는 버튼 한 번으로 전체에게 메일을 보낸다.

## 2. 왜 만드는가

지금은 매 강의마다 학습자 이메일을 수집하고, 메일 본문을 손으로 복사·붙여넣어 보낸다.
강의 수가 늘어날수록 반복 작업의 부담이 커지고, 누락·오타·지각 등록자 처리가 어렵다.
"교육과정 생성 → QR 공유 → 등록 → 버튼 한 번 발송"의 흐름으로 만들면, 강의 운영 부담이 거의 사라진다.

## 3. 핵심 사용자 시나리오

1. (강의 1일 전) 소장이 관리자 화면에서 교육과정을 생성한다. 교육일자/회사/과정명/대상자/시간/노션 링크 입력.
2. 시스템이 학습자용 QR 코드와 공유 링크를 즉시 만들어준다.
3. (강의 시작) 소장이 QR을 화면에 띄우고 학습자가 자기 폰으로 스캔 → 이메일 입력 → 등록.
4. 이메일이 Google Sheet에 실시간으로 쌓인다.
5. 소장이 "교육자료 송부" 버튼 클릭 → 등록된 모두에게 노션 링크가 담긴 메일이 한 번에 발송된다.
6. 늦게 등록한 학습자에게는 체크박스로 선택해 개별 발송.
7. (강의 종료 후) 소장이 "복습자료 송부" 버튼 클릭 → 다른 템플릿으로 복습용 메일 발송.

## 4. 기술 스택

- 프론트엔드: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- 데이터베이스: Google Sheets (googleapis 라이브러리, Service Account 인증)
- 메일 발송: Daum SMTP (nodemailer) — ledhelper@daum.net (이미 Node.js 테스트 완료)
- 인증: 단일 비밀번호 + httpOnly 쿠키
- QR 생성: qrcode 라이브러리 (서버에서 SVG 생성)
- 배포: Vercel (무료 플랜)

## 5. 사용자 화면 구조

```
공개 (인증 없음)
  GET  /                    → 소장 안내 페이지 또는 /admin 리다이렉트
  GET  /r/[courseId]        → 학습자 이메일 등록 페이지
  POST /api/register        → 학습자 이메일 등록 처리
  GET  /login               → 관리자 로그인

관리자 (쿠키 인증 필요)
  GET  /admin               → 교육과정 목록
  GET  /admin/new           → 신규 교육과정 생성 폼
  GET  /admin/[courseId]    → 과정 상세 (QR, 학습자 목록, 발송 버튼)
  POST /api/courses         → 교육과정 생성
  POST /api/send            → 메일 발송 (kind: 'kickoff' | 'review', recipients: 'all' | string[])
```

## 6. Google Sheets 스키마 요약

- **courses** 시트: id, created_at, date, company, course_name, audience, duration, notion_url
- **students** 시트: id, course_id, email, registered_at
- **send_logs** 시트: id, course_id, kind, to_email, sent_at, status, error

상세 컬럼/예시는 `docs/sheets-schema.md` 참고.

## 7. 환경변수

```
# Daum SMTP
SMTP_HOST=smtp.daum.net
SMTP_PORT=465
SMTP_USER=ledhelper@daum.net
SMTP_PASS=<앱 비밀번호>
SMTP_FROM_NAME=박재현

# Google Sheets
GOOGLE_SHEET_ID=<생성한 시트 ID>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service-account@...>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=<PEM 형식 키>

# 관리자 인증
ADMIN_PASSWORD=<단일 비밀번호>
SESSION_SECRET=<쿠키 서명용 랜덤 문자열>

# 배포 URL (QR 생성 시 사용)
NEXT_PUBLIC_BASE_URL=https://lecture-mailer.vercel.app
```

## 8. 성공 기준 (verification)

- [ ] 관리자가 교육과정을 생성하면 Google Sheet `courses` 시트에 새 행이 추가된다.
- [ ] 생성된 QR을 스캔하면 학습자 등록 페이지가 열린다.
- [ ] 학습자가 이메일을 입력하면 Google Sheet `students` 시트에 즉시 추가된다.
- [ ] "교육자료 송부" 클릭 시 등록된 모든 학습자에게 Daum 메일이 발송된다.
- [ ] 발송 결과(성공/실패)가 `send_logs` 시트에 기록된다.
- [ ] 개별 학습자 선택 후 단건 발송도 동작한다.
- [ ] 복습자료도 동일한 방식으로 발송된다.
- [ ] `npm run build` 통과.

## 9. 범위 밖 (V1에 넣지 않음)

- 통계 대시보드 (오픈율, 클릭율)
- 다중 관리자
- 강사 여러 명 관리
- 메일 템플릿 다중 관리 (V1은 kickoff/review 2종 고정)
- 학습자 정보 추가 필드 (이름, 회사 등) — 이메일만 받음
- 카카오톡/SMS 발송

향후 V2에서 검토.
