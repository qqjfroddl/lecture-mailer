// 학습자 목록 API (polling 용)
import { NextResponse } from "next/server";
import { listStudents } from "@/lib/sheets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId 필요" }, { status: 400 });
  }
  try {
    const students = await listStudents(courseId);
    return NextResponse.json({ students });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
