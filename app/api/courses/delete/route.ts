// 교육과정 삭제 API — 학습자/발송로그까지 cascade 삭제
import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteCourse } from "@/lib/sheets";

const schema = z.object({
  courseId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  try {
    const result = await deleteCourse(parsed.data.courseId);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
