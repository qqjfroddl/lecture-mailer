// Google Sheets 를 DB 로 다루는 클라이언트
import { google, sheets_v4 } from "googleapis";
import { env, privateKey } from "./env";
import { newCourseId, newLogId, newStudentId } from "./ids";

const COURSES_RANGE = "courses!A:H";
const STUDENTS_RANGE = "students!A:D";
const LOGS_RANGE = "send_logs!A:G";

export type Course = {
  id: string;
  createdAt: string;
  date: string;
  company: string;
  courseName: string;
  audience: string;
  duration: string;
  notionUrl: string;
};

export type Student = {
  id: string;
  courseId: string;
  email: string;
  registeredAt: string;
};

export type SendKind = "kickoff" | "review";

export type SendLog = {
  id: string;
  courseId: string;
  kind: SendKind;
  toEmail: string;
  sentAt: string;
  status: "ok" | "error";
  error: string;
};

let cachedClient: sheets_v4.Sheets | null = null;

function client(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;
  const auth = new google.auth.JWT({
    email: env().GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

function sheetId() {
  return env().GOOGLE_SHEET_ID;
}

function isoNow() {
  return new Date().toISOString();
}

// ---------- courses ----------

function rowToCourse(row: string[]): Course {
  return {
    id: row[0] ?? "",
    createdAt: row[1] ?? "",
    date: row[2] ?? "",
    company: row[3] ?? "",
    courseName: row[4] ?? "",
    audience: row[5] ?? "",
    duration: row[6] ?? "",
    notionUrl: row[7] ?? "",
  };
}

export async function listCourses(): Promise<Course[]> {
  const res = await client().spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: COURSES_RANGE,
  });
  const rows = res.data.values ?? [];
  if (rows.length <= 1) return [];
  return rows
    .slice(1)
    .filter((r) => r[0])
    .map(rowToCourse)
    .reverse(); // 최신 우선
}

export async function getCourse(courseId: string): Promise<Course | null> {
  const courses = await listCourses();
  return courses.find((c) => c.id === courseId) ?? null;
}

export async function createCourse(input: {
  date: string;
  company: string;
  courseName: string;
  audience: string;
  duration: string;
  notionUrl: string;
}): Promise<Course> {
  const course: Course = {
    id: newCourseId(),
    createdAt: isoNow(),
    ...input,
  };
  await client().spreadsheets.values.append({
    spreadsheetId: sheetId(),
    range: COURSES_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          course.id,
          course.createdAt,
          course.date,
          course.company,
          course.courseName,
          course.audience,
          course.duration,
          course.notionUrl,
        ],
      ],
    },
  });
  return course;
}

// 과정 정보 수정 — id 로 행을 찾아 값을 덮어쓴다
export async function updateCourse(
  courseId: string,
  patch: {
    date?: string;
    company?: string;
    courseName?: string;
    audience?: string;
    duration?: string;
    notionUrl?: string;
  },
): Promise<Course | null> {
  const res = await client().spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: COURSES_RANGE,
  });
  const rows = res.data.values ?? [];
  // 헤더 제외, 시트 0-indexed 행 번호와 함께
  let targetRowIndex = -1;
  let existing: Course | null = null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === courseId) {
      targetRowIndex = i;
      existing = rowToCourse(rows[i]);
      break;
    }
  }
  if (!existing || targetRowIndex < 0) return null;

  const updated: Course = {
    ...existing,
    date: patch.date ?? existing.date,
    company: patch.company ?? existing.company,
    courseName: patch.courseName ?? existing.courseName,
    audience: patch.audience ?? existing.audience,
    duration: patch.duration ?? existing.duration,
    notionUrl: patch.notionUrl ?? existing.notionUrl,
  };

  // 1-indexed 시트 행 번호 (헤더가 1행이므로 targetRowIndex 0 = 1행, 1 = 2행)
  const sheetRow = targetRowIndex + 1;
  await client().spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `courses!A${sheetRow}:H${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          updated.id,
          updated.createdAt,
          updated.date,
          updated.company,
          updated.courseName,
          updated.audience,
          updated.duration,
          updated.notionUrl,
        ],
      ],
    },
  });
  return updated;
}

// ---------- students ----------

function rowToStudent(row: string[]): Student {
  return {
    id: row[0] ?? "",
    courseId: row[1] ?? "",
    email: row[2] ?? "",
    registeredAt: row[3] ?? "",
  };
}

export async function listStudents(courseId: string): Promise<Student[]> {
  const res = await client().spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: STUDENTS_RANGE,
  });
  const rows = res.data.values ?? [];
  if (rows.length <= 1) return [];
  const all = rows
    .slice(1)
    .filter((r) => r[0] && r[1] === courseId)
    .map(rowToStudent);
  // 출력 단계에서 같은 이메일 중복 제거 (가장 처음 등록 우선)
  const seen = new Set<string>();
  const unique: Student[] = [];
  for (const s of all) {
    const key = s.email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(s);
  }
  return unique;
}

export async function addStudent(
  courseId: string,
  email: string,
): Promise<Student> {
  // 동시 등록 경쟁 상태 회피를 위해 사전 중복 체크 없이 그냥 append.
  // 중복은 listStudents 출력 단계에서 제거.
  const student: Student = {
    id: newStudentId(),
    courseId,
    email,
    registeredAt: isoNow(),
  };
  await client().spreadsheets.values.append({
    spreadsheetId: sheetId(),
    range: STUDENTS_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [student.id, student.courseId, student.email, student.registeredAt],
      ],
    },
  });
  return student;
}

const cachedSheetIds: Record<string, number> = {};

async function getTabSheetId(title: string): Promise<number> {
  if (title in cachedSheetIds) return cachedSheetIds[title];
  const res = await client().spreadsheets.get({
    spreadsheetId: sheetId(),
    includeGridData: false,
  });
  const sheet = res.data.sheets?.find(
    (sh) => sh.properties?.title === title,
  );
  const id = sheet?.properties?.sheetId;
  if (id === null || id === undefined) {
    throw new Error(`${title} 시트를 찾을 수 없습니다.`);
  }
  cachedSheetIds[title] = id;
  return id;
}

async function getStudentsSheetId(): Promise<number> {
  return getTabSheetId("students");
}

// 학습자 다건 삭제 - 행 자체를 제거 (id 일치 기준)
export async function deleteStudents(
  studentIds: string[],
): Promise<number> {
  if (studentIds.length === 0) return 0;
  const res = await client().spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: STUDENTS_RANGE,
  });
  const rows = res.data.values ?? [];
  const idSet = new Set(studentIds);
  // rows[0] = 헤더, rows[i] = 시트 i행(0-indexed)
  const rowIndices: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    if (idSet.has(rows[i][0])) rowIndices.push(i);
  }
  if (rowIndices.length === 0) return 0;
  // 아래 행부터 삭제 (인덱스 밀림 방지)
  rowIndices.sort((a, b) => b - a);
  const studentsSheetId = await getStudentsSheetId();
  const requests = rowIndices.map((rowIdx) => ({
    deleteDimension: {
      range: {
        sheetId: studentsSheetId,
        dimension: "ROWS" as const,
        startIndex: rowIdx,
        endIndex: rowIdx + 1,
      },
    },
  }));
  await client().spreadsheets.batchUpdate({
    spreadsheetId: sheetId(),
    requestBody: { requests },
  });
  return rowIndices.length;
}

// ---------- send_logs ----------

export async function logSend(args: {
  courseId: string;
  kind: SendKind;
  toEmail: string;
  status: "ok" | "error";
  error?: string;
}): Promise<void> {
  await client().spreadsheets.values.append({
    spreadsheetId: sheetId(),
    range: LOGS_RANGE,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          newLogId(),
          args.courseId,
          args.kind,
          args.toEmail,
          isoNow(),
          args.status,
          args.error ?? "",
        ],
      ],
    },
  });
}

export async function listSendLogs(courseId: string): Promise<SendLog[]> {
  const res = await client().spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: LOGS_RANGE,
  });
  const rows = res.data.values ?? [];
  if (rows.length <= 1) return [];
  return rows
    .slice(1)
    .filter((r) => r[1] === courseId)
    .map((row) => ({
      id: row[0] ?? "",
      courseId: row[1] ?? "",
      kind: (row[2] as SendKind) ?? "kickoff",
      toEmail: row[3] ?? "",
      sentAt: row[4] ?? "",
      status: (row[5] as "ok" | "error") ?? "ok",
      error: row[6] ?? "",
    }));
}


// ---------- course delete (cascade) ----------

// 과정 + 관련 학습자 + 관련 발송 로그 모두 삭제
export async function deleteCourse(courseId: string): Promise<{
  courseDeleted: boolean;
  studentsDeleted: number;
  logsDeleted: number;
}> {
  // 1) 관련 행 인덱스 모두 조회
  const [coursesRes, studentsRes, logsRes] = await Promise.all([
    client().spreadsheets.values.get({
      spreadsheetId: sheetId(),
      range: COURSES_RANGE,
    }),
    client().spreadsheets.values.get({
      spreadsheetId: sheetId(),
      range: STUDENTS_RANGE,
    }),
    client().spreadsheets.values.get({
      spreadsheetId: sheetId(),
      range: LOGS_RANGE,
    }),
  ]);

  const courseRows = coursesRes.data.values ?? [];
  const studentRows = studentsRes.data.values ?? [];
  const logRows = logsRes.data.values ?? [];

  const findCourseIdx = (rows: string[][], idColIdx: number) => {
    const indices: number[] = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][idColIdx] === courseId) indices.push(i);
    }
    return indices;
  };

  // courses 는 첫 컬럼이 course id, students/send_logs 는 두번째 컬럼이 course_id
  const courseIndices = findCourseIdx(courseRows, 0);
  const studentIndices = findCourseIdx(studentRows, 1);
  const logIndices = findCourseIdx(logRows, 1);

  if (
    courseIndices.length === 0 &&
    studentIndices.length === 0 &&
    logIndices.length === 0
  ) {
    return { courseDeleted: false, studentsDeleted: 0, logsDeleted: 0 };
  }

  const [coursesSheetId, studentsSheetId, logsSheetId] = await Promise.all([
    getTabSheetId("courses"),
    getTabSheetId("students"),
    getTabSheetId("send_logs"),
  ]);

  // 각 시트별로 행 인덱스를 descending 정렬해 삭제 요청 생성
  const buildRequests = (indices: number[], sheetIdNum: number) =>
    indices
      .slice()
      .sort((a, b) => b - a)
      .map((rowIdx) => ({
        deleteDimension: {
          range: {
            sheetId: sheetIdNum,
            dimension: "ROWS" as const,
            startIndex: rowIdx,
            endIndex: rowIdx + 1,
          },
        },
      }));

  const requests = [
    ...buildRequests(courseIndices, coursesSheetId),
    ...buildRequests(studentIndices, studentsSheetId),
    ...buildRequests(logIndices, logsSheetId),
  ];

  if (requests.length > 0) {
    await client().spreadsheets.batchUpdate({
      spreadsheetId: sheetId(),
      requestBody: { requests },
    });
  }

  return {
    courseDeleted: courseIndices.length > 0,
    studentsDeleted: studentIndices.length,
    logsDeleted: logIndices.length,
  };
}
