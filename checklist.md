# lecture-mailer — Checklist

작업 진행하면서 체크박스를 채워나간다.

## Phase 0. 기획 & 셋업

- [x] 프로젝트 폴더 생성
- [x] plan.md 작성
- [x] checklist.md 작성
- [x] context-notes.md 작성
- [ ] Google Sheets 스키마 문서 작성 (`docs/sheets-schema.md`)
- [ ] Next.js 프로젝트 스캐폴딩 (`npx create-next-app@latest .`)
- [ ] 의존성 설치 (googleapis, nodemailer, qrcode, zod, jose)
- [ ] `.env.example` 작성
- [ ] `.gitignore` 점검

## Phase 1. 핵심 모듈

- [ ] `lib/env.ts` — 환경변수 안전한 로딩 (zod 검증)
- [ ] `lib/sheets.ts` — Google Sheets 클라이언트
  - [ ] `getCourses()`, `getCourse(id)`, `createCourse(data)`
  - [ ] `addStudent(courseId, email)`, `listStudents(courseId)`
  - [ ] `logSend(courseId, kind, email, status, error?)`
- [ ] `lib/mailer.ts` — Daum SMTP 발송기
  - [ ] `sendMail({ to, subject, html, text })`
  - [ ] `sendBulk(list, builder)` — 1초 sleep 권장
- [ ] `lib/auth.ts` — 비밀번호 검증 + 쿠키 발급
- [ ] `lib/templates.ts` — kickoff / review 메일 템플릿 생성

## Phase 2. 페이지 & API

- [ ] `app/login/page.tsx` — 비밀번호 입력
- [ ] `app/api/login/route.ts` — 검증 + 쿠키 set
- [ ] `middleware.ts` — `/admin/*` 보호
- [ ] `app/admin/page.tsx` — 교육과정 목록
- [ ] `app/admin/new/page.tsx` — 신규 과정 생성
- [ ] `app/api/courses/route.ts` — POST: 과정 생성
- [ ] `app/admin/[courseId]/page.tsx` — 과정 상세 (QR, 학습자, 발송)
- [ ] `app/api/qr/[courseId]/route.ts` — QR SVG 응답
- [ ] `app/r/[courseId]/page.tsx` — 학습자 공개 등록 페이지
- [ ] `app/api/register/route.ts` — 이메일 등록 처리
- [ ] `app/api/send/route.ts` — 메일 발송 (all / individual)

## Phase 3. 검증

- [ ] `npm run dev` 기동
- [ ] 로그인 → 과정 생성 → QR 확인
- [ ] 학습자 페이지에서 이메일 등록 → 시트 확인
- [ ] "교육자료 송부" → 실제 메일 수신 확인
- [ ] 개별 발송 → 수신 확인
- [ ] 복습자료 발송 → 수신 확인
- [ ] `npm run build` 통과

## Phase 4. 배포 가이드

- [ ] `README.md`에 다음 절차 정리
  - [ ] Google Cloud 프로젝트 생성 + Service Account
  - [ ] Sheets API 활성화 + 시트 공유
  - [ ] Daum 앱 비밀번호 발급 방법
  - [ ] Vercel 프로젝트 연결 + 환경변수 등록
  - [ ] 첫 로그인 후 점검 사항

## 진행 메모

작업하다가 새 할 일이 보이면 여기 아래에 추가:

-
