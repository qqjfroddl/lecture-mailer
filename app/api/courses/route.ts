// 교육과정 생성 API
import { NextResponse } from "next/server";
import { z } from "zod";
import { addStudent, createCourse } from "@/lib/sheets";

// 과정 생성 시 자동 등록되는 관리자 검증용 이메일 (발송 확인용)
const ADMIN_VERIFY_EMAIL = "matt@deeptactlearning.com";

const schema = z.object({
  date: z.string().min(1),
  company: z.string().min(1),
  courseName: z.string().min(1),
  audience: z.string().default(""),
  duration: z.string().default(""),
  notionUrl: z.string().url(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    const course = await createCourse(parsed.data);
    // 발송 검증용 — 관리자 이메일 자동 등록 (실패해도 과정 생성은 성공으로 처리)
    try {
      await addStudent(course.id, ADMIN_VERIFY_EMAIL);
    } catch {
      // ignore
    }
    return NextResponse.json({ course });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
