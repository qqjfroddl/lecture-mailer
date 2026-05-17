// 과정 목록의 카드 1개 — 클릭 시 상세 이동 + 우측에 삭제 버튼
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Course } from "@/lib/sheets";

export default function CourseListItem({ course }: { course: Course }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const label = `${course.company} · ${course.courseName}`;
    if (
      !window.confirm(
        `"${label}" 과정을 삭제할까요?\n\n등록된 학습자와 발송 이력도 함께 삭제됩니다.\n복구할 수 없습니다.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/courses/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`삭제 실패: ${data.error ?? ""}`);
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류");
      setDeleting(false);
    }
  }

  return (
    <li className="bg-white rounded-xl hover:shadow transition flex items-stretch">
      <Link
        href={`/admin/${course.id}`}
        className="flex-1 block p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-brand/60">{course.date}</div>
            <div className="font-semibold text-brand mt-1">
              {course.company} · {course.courseName}
            </div>
            <div className="text-base text-brand/70 mt-1">
              {course.audience} · {course.duration}
            </div>
          </div>
          <span className="text-brand/40">›</span>
        </div>
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        title="과정 삭제"
        aria-label="과정 삭제"
        className="px-4 flex items-center justify-center text-red-600 hover:bg-red-50 border-l border-brand/10 rounded-r-xl transition disabled:opacity-50"
      >
        {deleting ? (
          <span className="text-sm">삭제 중…</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M19 6l-1.5 14a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5 6" />
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          </svg>
        )}
      </button>
    </li>
  );
}
