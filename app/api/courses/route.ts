// 교육과정 생성 API
import { NextResponse } from "next/server";
import { z } from "zod";
import { createCourse } from "@/lib/sheets";

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
    return NextResponse.json({ course });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
