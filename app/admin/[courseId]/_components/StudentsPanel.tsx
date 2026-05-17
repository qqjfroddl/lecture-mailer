// 학습자 목록 — 5초마다 polling + 이메일 텍스트 일괄 등록 + 선택 삭제
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

  // 선택 삭제 상태
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const extractedEmails = useMemo(() => {
    const matches = bulkText.match(EMAIL_REGEX) ?? [];
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

  async function fetchStudents() {
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
  }

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(fetchStudents, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, autoRefresh]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => s.id)));
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const sample = students
      .filter((s) => selected.has(s.id))
      .slice(0, 3)
      .map((s) => s.email)
      .join(", ");
    const more = selected.size > 3 ? ` 외 ${selected.size - 3}명` : "";
    if (
      !window.confirm(
        `선택된 ${selected.size}명을 삭제할까요?\n\n${sample}${more}\n\n삭제하면 시트에서 행이 완전히 제거됩니다.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/students/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`삭제 실패: ${data.error ?? ""}`);
        return;
      }
      setSelected(new Set());
      await fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류");
    } finally {
      setDeleting(false);
    }
  }

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
      await fetchStudents();
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
          <h2 className="text-base font-semibold text-brand/80">
            등록된 학습자 ({students.length}명)
          </h2>
          <p className="text-sm text-brand/50 mt-0.5">
            {autoRefresh ? "5초마다 자동 새로고침" : "자동 새로고침 꺼짐"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setBulkOpen((v) => !v)}
            className="text-sm text-brand-accent hover:underline"
          >
            {bulkOpen ? "▲ 일괄 등록 닫기" : "▼ 이메일 텍스트로 일괄 등록"}
          </button>
          <label className="text-sm text-brand/70 flex items-center gap-2 cursor-pointer">
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
          <p className="text-sm text-brand/70">
            아래 칸에 이메일이 포함된 텍스트를 그대로 붙여넣으세요. 형식 상관없이 이메일 주소만 자동으로 추출합니다.
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder="예) 홍길동 hong@example.com, 김영희 yh@company.co.kr&#10;또는 한 줄에 하나씩"
            className="w-full px-3 py-2 text-base rounded-lg border border-brand/15 bg-white font-mono"
          />
          <div className="flex items-center justify-between text-sm">
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
              className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-accent transition disabled:opacity-40"
            >
              {bulkSubmitting ? "추가 중…" : `${extractedEmails.length}개 추가`}
            </button>
          </div>
          {bulkResult && (
            <p className="text-sm text-brand">{bulkResult}</p>
          )}
        </div>
      )}

      {students.length === 0 ? (
        <p className="text-base text-brand/50 text-center py-6">
          아직 등록한 학습자가 없습니다.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm text-brand/60 hover:text-brand-accent"
            >
              {selected.size === students.length ? "전체 해제" : "전체 선택"}
            </button>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={deleteSelected}
                disabled={deleting}
                className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-40"
              >
                {deleting ? "삭제 중…" : `선택 ${selected.size}명 삭제`}
              </button>
            )}
          </div>
          <ul className="text-base text-brand divide-y divide-brand/10 border border-brand/10 rounded-lg">
            {students.map((s) => (
              <li key={s.id}>
                <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-surface">
                  <input
                    type="checkbox"
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                  />
                  <span className="font-mono flex-1">{s.email}</span>
                  <span className="text-sm text-brand/50">
                    {formatTime(s.registeredAt)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
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
