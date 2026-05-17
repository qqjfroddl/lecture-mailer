// 발송 이력 조회 API
import { NextResponse } from "next/server";
import { listSendLogs } from "@/lib/sheets";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId 필요" }, { status: 400 });
  }
  try {
    const logs = await listSendLogs(courseId);
    return NextResponse.json({ logs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
