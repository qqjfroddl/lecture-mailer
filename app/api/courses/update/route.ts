// 교육과정 정보 수정 API
import { NextResponse } from "next/server";
import { z } from "zod";
import { updateCourse } from "@/lib/sheets";

const schema = z.object({
  courseId: z.string().min(1),
  date: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  courseName: z.string().min(1).optional(),
  audience: z.string().optional(),
  duration: z.string().optional(),
  notionUrl: z.string().url().optional(),
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
    const { courseId, ...patch } = parsed.data;
    const updated = await updateCourse(courseId, patch);
    if (!updated) {
      return NextResponse.json({ error: "존재하지 않는 교육과정" }, { status: 404 });
    }
    return NextResponse.json({ course: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
