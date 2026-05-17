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
  return rows
    .slice(1)
    .filter((r) => r[0] && r[1] === courseId)
    .map(rowToStudent);
}

export async function addStudent(
  courseId: string,
  email: string,
): Promise<Student> {
  // 중복 등록 무시 (이미 등록된 이메일이면 기존 레코드 반환)
  const existing = await listStudents(courseId);
  const dup = existing.find(
    (s) => s.email.toLowerCase() === email.toLowerCase(),
  );
  if (dup) return dup;

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
