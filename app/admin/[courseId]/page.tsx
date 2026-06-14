// 교육과정 상세 화면 — QR, 학습자 목록, 메일 발송
import Link from "next/link";
import {
  getCourse,
  listStudents,
  listSendLogs,
} from "@/lib/sheets";
import { defaultTemplate } from "@/lib/templates";
import { env } from "@/lib/env";
import ShareLink from "./_components/ShareLink";
import StudentsPanel from "./_components/StudentsPanel";
import SendPanel from "./_components/SendPanel";
import DeleteCourseButton from "./_components/DeleteCourseButton";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourse(courseId);

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-brand/70">존재하지 않는 교육과정입니다.</p>
        <Link href="/admin" className="text-brand-accent text-base underline mt-2 inline-block">
          목록으로
        </Link>
      </div>
    );
  }

  const [students, logs] = await Promise.all([
    listStudents(course.id),
    listSendLogs(course.id),
  ]);

  const shareUrl = `${env().NEXT_PUBLIC_BASE_URL}/r/${course.id}`;
  const kickoffTpl = defaultTemplate(course, "kickoff");
  const reviewTpl = defaultTemplate(course, "review");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-base text-brand/60 hover:text-brand">
          ← 목록
        </Link>
        <div className="mt-2 flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-brand/60">{course.date} · {course.duration}</p>
            <h1 className="text-2xl font-bold text-brand mt-1">
              {course.company} · {course.courseName}
            </h1>
            {course.audience && (
              <p className="text-base text-brand/70 mt-1">{course.audience}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/${course.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-surface hover:bg-brand/5 border border-brand/15 text-brand text-sm font-medium transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              과정 수정
            </Link>
            <DeleteCourseButton
              courseId={course.id}
              courseName={`${course.company} · ${course.courseName}`}
              studentsCount={students.length}
            />
          </div>
        </div>
      </div>

      {/* QR + 공유 링크 */}
      <section className="bg-white rounded-xl p-6">
        <h2 className="text-base font-semibold text-brand/80 mb-4">
          학습자 공유용 QR · 링크
        </h2>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-white border border-brand/10 rounded-lg p-2 print:border-0">
            <img
              src={`/api/qr/${course.id}`}
              alt="등록 QR 코드"
              width={280}
              height={280}
            />
          </div>
          <div className="flex-1 space-y-3">
            <ShareLink url={shareUrl} />
            <p className="text-sm text-brand/60">
              학습자가 이 QR을 스캔하거나 위 링크에 접속하면 이메일을 등록합니다.
            </p>
            <a
              href={course.notionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brand-accent underline break-all"
            >
              노션 자료 링크 확인 ↗
            </a>
          </div>
        </div>
      </section>

      {/* 학습자 목록 (자동 새로고침) */}
      <StudentsPanel courseId={course.id} initial={students} />

      {/* 메일 발송 */}
      <SendPanel
        courseId={course.id}
        kickoff={kickoffTpl}
        review={reviewTpl}
        initialStudents={students}
        initialLogs={logs}
      />
    </div>
  );
}
