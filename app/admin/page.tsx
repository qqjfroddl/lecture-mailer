// 관리자 홈 — 교육과정 목록
import Link from "next/link";
import { listCourses } from "@/lib/sheets";
import CourseListItem from "./_components/CourseListItem";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const courses = await listCourses();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">교육과정</h1>
        <Link
          href="/admin/new"
          className="px-4 py-2 rounded-lg bg-brand text-white text-base font-medium hover:bg-brand-accent transition"
        >
          + 새 과정
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-brand/60">
          아직 생성된 과정이 없습니다.<br />
          오른쪽 위 [+ 새 과정] 버튼으로 시작하세요.
        </div>
      ) : (
        <ul className="space-y-2">
          {courses.map((c) => (
            <CourseListItem key={c.id} course={c} />
          ))}
        </ul>
      )}
    </div>
  );
}
