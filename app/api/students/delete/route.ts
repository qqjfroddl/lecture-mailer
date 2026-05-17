// 학습자 다건 삭제 API — studentIds 배열로 받음
import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteStudents } from "@/lib/sheets";

const schema = z.object({
  studentIds: z.array(z.string().min(1)).min(1).max(500),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  try {
    const deleted = await deleteStudents(parsed.data.studentIds);
    return NextResponse.json({ deleted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
