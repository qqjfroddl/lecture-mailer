// 학습자 목록 — 5초마다 polling + 이메일 텍스트 일괄 등록
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Student } from "@/lib/sheets";

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

export default function StudentsPanel({
  courseId,
  initial,
}: {
  courseId: string;
  initial: Student[];
}) {
  const [students, setStudents] = useState<Student[]>(initial);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 일괄 등록 UI 상태
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const extractedEmails = useMemo(() => {
    const matches = bulkText.match(EMAIL_REGEX) ?? [];
    // 소문자로 통일해 중복 제거
    const seen = new Set<string>();
    const list: string[] = [];
    for (const m of matches) {
      const key = m.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(m);
      }
    }
    return list;
  }, [bulkText]);

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

  async function submitBulk() {
    if (extractedEmails.length === 0) return;
    setBulkSubmitting(true);
    setBulkResult(null);
    try {
      const res = await fetch("/api/register-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, emails: extractedEmails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkResult(`실패: ${data.error ?? ""}`);
        return;
      }
      setBulkResult(
        `완료 — 새로 추가 ${data.added}건, 이미 등록됨 ${data.skipped}건${data.errors?.length ? `, 실패 ${data.errors.length}건` : ""}`,
      );
      setBulkText("");
      // 즉시 목록 새로고침
      const refreshed = await fetch(`/api/students?courseId=${courseId}`, { cache: "no-store" });
      if (refreshed.ok) {
        const d = await refreshed.json();
        setStudents(d.students ?? []);
      }
    } catch (err) {
      setBulkResult(err instanceof Error ? err.message : "오류");
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <section className="bg-white rounded-xl p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold text-brand/80">
            등록된 학습자 ({students.length}명)
          </h2>
          <p className="text-xs text-brand/50 mt-0.5">
            {autoRefresh ? "5초마다 자동 새로고침" : "자동 새로고침 꺼짐"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBulkOpen((v) => !v)}
            className="text-xs text-brand-accent hover:underline"
          >
            {bulkOpen ? "▲ 일괄 등록 닫기" : "▼ 이메일 텍스트로 일괄 등록"}
          </button>
          <label className="text-xs text-brand/70 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            자동 새로고침
          </label>
        </div>
      </div>

      {bulkOpen && (
        <div className="mb-4 bg-brand-surface rounded-lg p-4 space-y-3">
          <p className="text-xs text-brand/70">
            아래 칸에 이메일이 포함된 텍스트를 그대로 붙여넣으세요. 형식 상관없이 이메일 주소만 자동으로 추출합니다.
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder="예) 홍길동 hong@example.com, 김영희 yh@company.co.kr&#10;또는 한 줄에 하나씩"
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand/15 bg-white font-mono"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-brand/70">
              발견된 이메일 <strong className="text-brand">{extractedEmails.length}개</strong>
              {extractedEmails.length > 0 && (
                <span className="text-brand/50">
                  {" · "}
                  {extractedEmails.slice(0, 3).join(", ")}
                  {extractedEmails.length > 3 && ` 외 ${extractedEmails.length - 3}개`}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={submitBulk}
              disabled={bulkSubmitting || extractedEmails.length === 0}
              className="px-4 py-2 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-accent transition disabled:opacity-40"
            >
              {bulkSubmitting ? "추가 중…" : `${extractedEmails.length}개 추가`}
            </button>
          </div>
          {bulkResult && (
            <p className="text-xs text-brand">{bulkResult}</p>
          )}
        </div>
      )}

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
