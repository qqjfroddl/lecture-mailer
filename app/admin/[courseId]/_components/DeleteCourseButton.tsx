// 교육과정 삭제 버튼 — 명확하게 보이는 빨간 버튼
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCourseButton({
  courseId,
  courseName,
  studentsCount,
}: {
  courseId: string;
  courseName: string;
  studentsCount: number;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    const msg =
      `"${courseName}" 과정을 삭제할까요?\n\n` +
      `· 등록된 학습자 ${studentsCount}명도 함께 삭제됩니다.\n` +
      `· 발송 이력도 모두 삭제됩니다.\n\n` +
      `시트에서 행이 완전히 제거되어 복구할 수 없습니다.`;
    if (!window.confirm(msg)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/courses/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`삭제 실패: ${data.error ?? ""}`);
        setDeleting(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류");
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={deleting}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-medium transition disabled:opacity-50"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6h18" />
        <path d="M19 6l-1.5 14a2 2 0 0 1-2 1.8H8.5a2 2 0 0 1-2-1.8L5 6" />
        <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      </svg>
      {deleting ? "삭제 중…" : "과정 삭제"}
    </button>
  );
}
