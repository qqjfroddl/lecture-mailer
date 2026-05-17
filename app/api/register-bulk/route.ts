// 이메일 일괄 등록 API — 배열 받아서 addStudent 반복 호출 (중복은 내부에서 무시)
import { NextResponse } from "next/server";
import { z } from "zod";
import { addStudent, getCourse } from "@/lib/sheets";

const schema = z.object({
  courseId: z.string().min(1),
  emails: z.array(z.string().email()).min(1).max(500),
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
  const course = await getCourse(parsed.data.courseId);
  if (!course) {
    return NextResponse.json(
      { error: "존재하지 않는 교육과정" },
      { status: 404 },
    );
  }

  let added = 0;
  let skipped = 0;
  const errors: string[] = [];
  for (const email of parsed.data.emails) {
    try {
      const before = Date.now();
      const student = await addStudent(course.id, email.trim());
      // 중복이면 registeredAt이 과거(이전 등록 시각). 새로 추가됐다면 직전 시간.
      if (Date.parse(student.registeredAt) >= before - 1000) {
        added++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors.push(email);
    }
  }

  return NextResponse.json({ added, skipped, errors, total: parsed.data.emails.length });
}
