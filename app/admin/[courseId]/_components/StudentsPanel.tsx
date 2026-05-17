// 학습자 목록 — 5초마다 polling 으로 실시간 갱신
"use client";

import { useEffect, useState } from "react";
import type { Student } from "@/lib/sheets";

export default function StudentsPanel({
  courseId,
  initial,
}: {
  courseId: string;
  initial: Student[];
}) {
  const [students, setStudents] = useState<Student[]>(initial);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/students?courseId=${courseId}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        setStudents(data.students ?? []);
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(t);
  }, [courseId, autoRefresh]);

  return (
    <section className="bg-white rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-brand/80">
            등록된 학습자 ({students.length}명)
          </h2>
          <p className="text-xs text-brand/50 mt-0.5">
            {autoRefresh ? "5초마다 자동 새로고침" : "자동 새로고침 꺼짐"}
          </p>
        </div>
        <label className="text-xs text-brand/70 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          자동 새로고침
        </label>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-brand/50 text-center py-6">
          아직 등록한 학습자가 없습니다.
        </p>
      ) : (
        <ul className="text-sm text-brand divide-y divide-brand/10">
          {students.map((s) => (
            <li key={s.id} className="py-2 flex items-center justify-between">
              <span className="font-mono">{s.email}</span>
              <span className="text-xs text-brand/50">
                {formatTime(s.registeredAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}
