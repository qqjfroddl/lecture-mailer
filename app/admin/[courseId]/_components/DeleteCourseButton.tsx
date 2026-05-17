// 교육과정 삭제 버튼 — 확인 다이얼로그 + cascade 삭제
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
      className="text-xs text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
    >
      {deleting ? "삭제 중…" : "과정 삭제"}
    </button>
  );
}
