# lecture-mailer

박재현 소장 강의 운영 자동화 — 교육과정 생성 → QR로 학습자 이메일 수집 → 시작/종료 자료 메일 자동 발송.

빌드 검증 완료. 아래 절차대로 셋업하면 Vercel 무료 플랜으로 운영 가능합니다.

---

## 1. Google Sheets DB 준비 (5분)

1. Google Drive 에서 새 스프레드시트 생성. 파일 이름: 자유 (예: `lecture-mailer DB`).
2. 하단 시트 탭을 3개로 만든다. **이름은 영문 소문자**로 정확히.
   - `courses`
   - `students`
   - `send_logs`
3. 각 시트 1행에 헤더를 입력. 상세 컬럼은 `docs/sheets-schema.md` 참고.
4. URL 에서 시트 ID 복사 — `https://docs.google.com/spreadsheets/d/{이_부분}/edit`

## 2. Google Service Account 생성 (10분)

코드가 시트를 읽고 쓸 수 있는 자격증명을 만든다.

1. [Google Cloud Console](https://console.cloud.google.com/) 접속.
2. 좌상단 프로젝트 선택 → 새 프로젝트 (이름: `lecture-mailer`).
3. 좌측 메뉴 → "API 및 서비스" → "라이브러리" → **Google Sheets API** 검색 → 사용 설정.
4. 좌측 메뉴 → "API 및 서비스" → "사용자 인증 정보" → "사용자 인증 정보 만들기" → "서비스 계정".
5. 이름 `lecture-mailer-bot` 정도로. 역할은 비워두고 완료.
6. 생성된 서비스 계정 클릭 → "키" 탭 → "키 추가" → "JSON" → 다운로드.
7. 다운로드된 JSON 파일에서 두 값을 복사:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL` 환경변수
   - `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` 환경변수
8. 1단계에서 만든 Google Sheets 열고 우상단 [공유] → 위 `client_email` 을 **편집자**로 추가.

## 3. Daum 앱 비밀번호 발급 (3분)

이미 ledhelper@daum.net 으로 Node.js 발송 테스트 성공하셨다면 그 비밀번호 그대로 사용.
새로 발급이 필요하면:

1. Daum 메일 로그인 → 우상단 환경설정 → POP3/IMAP 사용 설정 켜기.
2. 비밀번호는 카카오 계정 비밀번호 사용 (2단계 인증 켰다면 앱 비밀번호 발급 필요).

## 4. 로컬에서 한 번 돌려보기

```bash
cd lecture-mailer
npm install
cp .env.example .env.local
# .env.local 편집해서 값 채우기
npm run dev
```

브라우저에서 http://localhost:3000 접속 → "관리자 들어가기" → 비밀번호 입력 → 과정 생성 → QR 확인.

## 5. Vercel 배포 (10분)

1. https://vercel.com 가입 (GitHub 계정으로 빠름).
2. 이 폴더를 GitHub 에 푸시:
   ```bash
   cd lecture-mailer
   git init && git add . && git commit -m "init"
   # GitHub 에서 새 repo 만들고
   git remote add origin https://github.com/{USER}/lecture-mailer.git
   git push -u origin main
   ```
3. Vercel 대시보드 → "Add New" → "Project" → GitHub repo 선택.
4. **Environment Variables** 섹션에서 `.env.example` 의 모든 키를 입력.
   - `NEXT_PUBLIC_BASE_URL` 은 일단 빈 값으로 두고, 배포 후 받은 URL 로 갱신 → 재배포.
5. Deploy 클릭.

배포 완료되면 받은 URL (예: `https://lecture-mailer.vercel.app`) 을 `NEXT_PUBLIC_BASE_URL` 에 다시 넣고 재배포. 그래야 QR 이 올바른 주소로 만들어진다.

## 6. 사용 흐름

1. 강의 1일 전: `/admin/new` 에서 교육과정 생성 (회사, 과정명, 노션 링크 등).
2. 강의 시작 직전: 과정 상세 화면에서 QR 코드를 화면에 띄움. 학습자가 자기 폰으로 스캔 → 이메일 입력.
3. 강의 시작: "교육자료 송부" 탭에서 [전체 발송] 클릭. 본문 수정도 가능.
4. 늦게 등록한 사람: 새로고침되면 목록에 뜸 → 체크해서 [선택한 X명에게 발송].
5. 강의 종료 후: "복습자료 송부" 탭으로 바꾸고 [전체 발송].

발송 결과는 화면 하단 발송 이력에서 확인 가능. Google Sheets `send_logs` 탭에도 같은 내용이 쌓인다.

---

## 디렉토리 구조

```
lecture-mailer/
├── app/                       # Next.js App Router
│   ├── admin/                 # 관리자 영역
│   │   ├── [courseId]/        # 과정 상세 (QR, 학습자, 발송)
│   │   ├── new/               # 신규 과정 생성
│   │   └── page.tsx           # 과정 목록
│   ├── api/                   # API 라우트
│   │   ├── courses/           # 과정 생성
│   │   ├── login/             # 로그인
│   │   ├── logout/            # 로그아웃
│   │   ├── qr/[courseId]/     # QR SVG
│   │   ├── register/          # 학습자 등록
│   │   ├── send/              # 메일 발송
│   │   ├── send-logs/         # 발송 이력 조회
│   │   └── students/          # 학습자 목록
│   ├── login/                 # 관리자 로그인 화면
│   ├── r/[courseId]/          # 학습자 공개 등록 페이지
│   ├── globals.css            # 한국어 가독성 전역 CSS
│   ├── layout.tsx             # 루트 레이아웃
│   └── page.tsx               # 홈
├── lib/                       # 핵심 모듈
│   ├── auth.ts                # 단일 비밀번호 + JWT 쿠키
│   ├── env.ts                 # 환경변수 zod 검증
│   ├── ids.ts                 # 짧은 ID 생성기
│   ├── mailer.ts              # Daum SMTP nodemailer
│   ├── sheets.ts              # Google Sheets 클라이언트
│   └── templates.ts           # kickoff / review 메일 템플릿
├── docs/
│   └── sheets-schema.md       # Google Sheets 컬럼 스펙
├── middleware.ts              # /admin/* 인증 보호
├── plan.md                    # 기획 문서
├── checklist.md               # 작업 체크리스트
├── context-notes.md           # 결정 기록
└── README.md                  # 이 파일
```

## 개발 명령어

```bash
npm run dev          # 로컬 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 빌드된 결과 실행
npm run typecheck    # TypeScript 타입 검사만
```

## 트러블슈팅

**"환경변수가 올바르지 않습니다" 에러**
→ `.env.local` 의 값이 누락되거나 형식 오류. 메시지에 표시된 키를 확인.

**Sheets API 권한 오류**
→ 서비스 계정 이메일이 시트에 **편집자**로 공유되어 있는지 재확인.

**메일이 발송되지 않음**
→ Daum SMTP 비밀번호 확인. 일부 계정은 2단계 인증 켜져 있으면 일반 비밀번호로 안 됨 → 앱 비밀번호 발급.

**QR 을 스캔했는데 빈 페이지**
→ `NEXT_PUBLIC_BASE_URL` 이 실제 배포 URL 인지 확인. 변경 후 재배포 필수.
