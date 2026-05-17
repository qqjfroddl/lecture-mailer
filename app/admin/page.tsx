// 관리자 홈 — 교육과정 목록
import Link from "next/link";
import { listCourses } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const courses = await listCourses();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">교육과정</h1>
        <Link
          href="/admin/new"
          className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-accent transition"
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
            <li key={c.id}>
              <Link
                href={`/admin/${c.id}`}
                className="block bg-white rounded-xl p-5 hover:shadow transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-brand/60">{c.date}</div>
                    <div className="font-semibold text-brand mt-1">
                      {c.company} · {c.courseName}
                    </div>
                    <div className="text-sm text-brand/70 mt-1">
                      {c.audience} · {c.duration}
                    </div>
                  </div>
                  <span className="text-brand/40">›</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
