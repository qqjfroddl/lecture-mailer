# lecture-mailer — Context Notes

작업 중 내린 결정과 그 이유를 시간순으로 누적한다.
다음 세션(나 자신이든 다른 사람이든)이 같은 결정을 다시 내리지 않도록 한다.

---

## 2026-05-16 — 초기 설계 결정

### 결정 1: Next.js (App Router) 채택
- **왜**: 학습자 등록 페이지가 공개 URL이어야 하므로 정적 사이트만으로는 불가. Server Action / Route Handler로 백엔드까지 한 곳에서 처리 가능. Vercel 배포 무료.
- **대안 검토**: 순수 Node Express + 정적 HTML도 가능하나, Vercel 배포 편의성과 TypeScript 통합 면에서 Next.js가 유리.

### 결정 2: Google Sheets를 DB로 사용
- **왜**: 소장님이 직접 데이터를 보고 편집할 수 있어야 함. 학습자 수가 강의당 100명 이내라 Sheets API 제한(분당 60건 쓰기 정도) 안에 충분히 들어옴. 별도 DB 인프라 비용/관리 부담 없음.
- **트레이드오프**: 동시 쓰기에 약함, 대용량 부적합. V1 규모에서는 문제 없음.

### 결정 3: 인증은 단일 비밀번호 + httpOnly 쿠키
- **왜**: 소장님 한 명만 사용. 풀 인증 시스템(Supabase 등) 도입은 과함.
- **구현**: 쿠키에는 JWT 형태로 만료시간 포함. 미들웨어에서 검증.

### 결정 4: 메일 발송은 Daum SMTP + nodemailer
- **왜**: 소장님이 이미 ledhelper@daum.net으로 Node.js 테스트 성공했다고 함. 별도 외부 서비스 가입 불필요.
- **주의**: Daum은 발송량 제한이 있음(보통 일 1,000건). 강의당 100명 이하면 충분. 발송 시 1초 간격으로 throttle.
- **From 주소**: ledhelper@daum.net이지만 발신자 이름은 "박재현"으로 설정.

### 결정 5: 학습자 등록은 이메일만 받음
- **왜**: 요구사항에 "학습자들이 자신의 이메일을 입력한다"만 명시됨. 이름·회사 같은 추가 필드를 임의로 넣지 않음 (Simplicity First).
- **추후**: V2에서 필요시 컬럼 추가 가능 (시트 컬럼만 늘리면 됨).

### 결정 6: 메일 템플릿은 코드에 하드코딩 + UI에서 수정 가능
- **왜**: 요구사항에 "기본으로 작성되어 있고, 필요시 수정이 가능함" 명시.
- **구현**: 기본 템플릿은 `lib/templates.ts`에 함수로 정의. UI에서 textarea로 보여주고 수정한 본문을 그대로 발송. 수정본은 별도 저장하지 않음 (1회성).
- **추후**: 저장 기능 필요해지면 courses 시트에 컬럼 추가하거나 별 시트.

### 결정 7: QR은 서버에서 SVG로 생성
- **왜**: 클라이언트 라이브러리 안 써도 되고, 인쇄·다운로드 편함. `qrcode` 라이브러리 사용.
- **URL 포맷**: `{NEXT_PUBLIC_BASE_URL}/r/{courseId}`

### 결정 8: send_logs 시트로 발송 이력 추적
- **왜**: "누가 어떤 메일을 받았는지" 확인이 필요할 수 있음. 디버깅 + 학습자 문의 대응.
- **구조**: id, course_id, kind(kickoff|review), to_email, sent_at, status(ok|error), error_message

### 결정 9: 폴더 이름은 `lecture-mailer`
- **왜**: 짧고 영문이라 터미널/git 다루기 편함. "강의 메일러" 의미가 직관적.

---

## 다음 결정이 필요한 지점

- [ ] **메일 발송 트리거 후 응답**: 100명에게 보내면 SMTP 발송에 100초 정도 걸림. 동기로 기다리게 할지, 백그라운드로 돌리고 즉시 응답할지. → V1은 그냥 기다리게 하고, 화면에 진행상황 표시.
- [ ] **중복 등록 방지**: 같은 이메일이 같은 과정에 두 번 등록되면? → 두번째는 무시 (atomic 처리는 안 함, 마지막 한 번만 살리는 방식).
- [ ] **취소·삭제 기능**: 잘못 등록한 학습자 제거? → 시트에서 직접 삭제하도록 안내. V1은 UI에 안 넣음.

---

## 2026-05-16 (오후) — 빌드 검증 중 발견

### 결정 10: useSearchParams 는 Suspense 로 감쌀 것
- `/login` 페이지에서 `useSearchParams()` 를 그냥 쓰면 Next 15 빌드가 prerender 단계에서 실패한다.
- 해결: `LoginPage` 는 `<Suspense fallback={null}><LoginForm/></Suspense>` 로만 구성하고, 실제 폼은 `LoginForm` 내부에서 훅을 사용.

### 결정 11: next.config 의 experimental.typedRoutes 제거
- Next 15.5 부터는 최상위 `typedRoutes` 로 이동. 안 쓸 거면 그냥 빼는 게 깔끔.

### 환경 이슈 메모: OneDrive 동기화
- 작업 폴더가 OneDrive 안에 있으면 일부 파일 Write/Edit 후 동기화 과정에서 파일 끝이 NULL 패딩되거나 잘려서 저장되는 현상 관찰됨.
- 대응: 빌드/테스트는 OneDrive 밖(`/tmp/`)에서 진행, 검증 끝나면 `cp` 로 OneDrive 로 되돌려 쓰기. `cp` 는 정상 동작.
- 향후 코드 수정 시: Write 후에는 `wc -c` 로 파일 크기 확인 권장.

### 빌드 결과 요약 (2026-05-16)
- `npm run build` 성공. 13개 라우트 생성 확인.
- 정적: `/`, `/admin/new`, `/login`
- 동적: `/admin`, `/admin/[courseId]`, `/r/[courseId]`, 모든 `/api/*`
- 미들웨어 52.3kB 로 `/admin/*` 보호 동작.
