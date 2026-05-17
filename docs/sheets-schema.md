# Google Sheets 스키마 설계

이 앱은 Google Sheets를 데이터베이스로 사용한다.
아래 구조 그대로 시트를 만든 다음, 시트 ID를 환경변수 `GOOGLE_SHEET_ID`에 넣으면 된다.

---

## 1. 시트 파일 생성

1. Google Drive에서 새 스프레드시트 생성.
2. 파일 이름 예: `lecture-mailer DB`
3. URL에서 시트 ID 확인 — `https://docs.google.com/spreadsheets/d/{여기가_시트_ID}/edit`
4. 아래 3개 탭을 만든다. **탭 이름은 반드시 영문 소문자**로 정확히.

| 탭 이름 | 용도 |
|---|---|
| `courses` | 교육과정 정보 |
| `students` | 학습자 이메일 등록 기록 |
| `send_logs` | 메일 발송 이력 |

---

## 2. `courses` 시트

1행에 다음 헤더를 그대로 입력. 컬럼 순서 중요.

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| id | created_at | date | company | course_name | audience | duration | notion_url |

### 컬럼 설명

- **id**: 자동 생성. 앱이 `crs_` 접두사 + 짧은 랜덤 문자열 (예: `crs_a1b2c3`)
- **created_at**: 자동 기록. ISO 8601 (예: `2026-05-16T10:30:00+09:00`)
- **date**: 교육일자 (예: `2026-05-20`)
- **company**: 회사명 (예: `삼성전자`)
- **course_name**: 과정명 (예: `AI 활용 마스터 클래스`)
- **audience**: 대상자 (예: `팀장급 30명`)
- **duration**: 시간 정보 (예: `09:00-18:00 (8시간)`)
- **notion_url**: 학습자에게 공유할 노션 링크

### 예시 행

| crs_a1b2c3 | 2026-05-16T10:30:00+09:00 | 2026-05-20 | 삼성전자 | AI 활용 마스터 | 팀장 30명 | 09:00-18:00 | https://notion.so/... |

---

## 3. `students` 시트

| A | B | C | D |
|---|---|---|---|
| id | course_id | email | registered_at |

### 컬럼 설명

- **id**: 자동 생성 (`std_xxxxxx`)
- **course_id**: 어떤 과정에 등록한 학습자인지 (`courses.id` 참조)
- **email**: 학습자 이메일
- **registered_at**: 등록 시각 (ISO 8601)

### 예시 행

| std_x9y8z7 | crs_a1b2c3 | learner1@gmail.com | 2026-05-20T08:55:23+09:00 |

---

## 4. `send_logs` 시트

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| id | course_id | kind | to_email | sent_at | status | error |

### 컬럼 설명

- **id**: 자동 생성 (`log_xxxxxx`)
- **course_id**: 발송 대상 과정 ID
- **kind**: `kickoff` (교육자료) 또는 `review` (복습자료)
- **to_email**: 수신자 이메일
- **sent_at**: 발송 시각
- **status**: `ok` 또는 `error`
- **error**: 실패 시 에러 메시지, 성공이면 빈 칸

### 예시 행

| log_p1q2r3 | crs_a1b2c3 | kickoff | learner1@gmail.com | 2026-05-20T09:01:12+09:00 | ok |  |

---

## 5. Google Service Account에 시트 공유

이 시트를 코드가 읽고 쓸 수 있게 하려면 Service Account 이메일에 **편집자** 권한으로 공유해야 한다.

1. Google Cloud Console에서 Service Account 생성 → JSON 키 다운로드.
2. JSON 안의 `client_email` 값을 복사 (예: `lecture-mailer@...iam.gserviceaccount.com`).
3. Google Sheets 우상단 [공유] 버튼 → 위 이메일을 **편집자**로 추가.

상세 절차는 추후 작성될 `README.md`의 배포 가이드 참고.
