// 메일 발송 API — 전체/선택 학습자에게 발송, 결과를 로그에 기록
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCourse, logSend, type SendKind } from "@/lib/sheets";
import { sendBulk } from "@/lib/mailer";

const schema = z.object({
  courseId: z.string().min(1),
  kind: z.enum(["kickoff", "review"]),
  recipients: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "잘못된 입력", issues: parsed.error.issues },
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

  const { recipients, subject, body: text, kind } = parsed.data;

  const results = await sendBulk(recipients, () => ({
    subject,
    text,
  }));

  // 로그 기록은 모두 끝난 다음 한꺼번에 (순차)
  for (const r of results) {
    await logSend({
      courseId: course.id,
      kind: kind as SendKind,
      toEmail: r.email,
      status: r.status,
      error: r.error,
    });
  }

  return NextResponse.json({ results });
}
