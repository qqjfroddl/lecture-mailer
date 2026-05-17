// 학습자 이메일 등록 API
import { NextResponse } from "next/server";
import { z } from "zod";
import { addStudent, getCourse } from "@/lib/sheets";

const schema = z.object({
  courseId: z.string().min(1),
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "잘못된 요청" },
      { status: 400 },
    );
  }
  try {
    const course = await getCourse(parsed.data.courseId);
    if (!course) {
      return NextResponse.json(
        { error: "존재하지 않는 교육과정입니다." },
        { status: 404 },
      );
    }
    const student = await addStudent(course.id, parsed.data.email.trim());
    return NextResponse.json({ student });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
