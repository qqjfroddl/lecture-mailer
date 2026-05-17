// 메일 발송 패널 — kickoff / review 탭, 템플릿 수정, 전체/개별 발송, 발송 이력
"use client";

import { useEffect, useState } from "react";
import type { SendKind, SendLog, Student } from "@/lib/sheets";
import type { TemplateDraft } from "@/lib/templates";

type Props = {
  courseId: string;
  kickoff: TemplateDraft;
  review: TemplateDraft;
  initialStudents: Student[];
  initialLogs: SendLog[];
};

export default function SendPanel({
  courseId,
  kickoff,
  review,
  initialStudents,
  initialLogs,
}: Props) {
  const [kind, setKind] = useState<SendKind>("kickoff");
  const [draft, setDraft] = useState<TemplateDraft>(kickoff);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<SendLog[]>(initialLogs);

  useEffect(() => {
    setDraft(kind === "kickoff" ? kickoff : review);
    setResult(null);
  }, [kind, kickoff, review]);

  // 5초마다 학습자 polling — StudentsPanel 과 동기화
  useEffect(() => {
    const t = setInterval(fetchStudents, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function fetchStudents() {
    try {
      const res = await fetch(`/api/students?courseId=${courseId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students ?? []);
      }
    } catch {
      // ignore
    }
  }

  async function fetchLogs() {
    const res = await fetch(`/api/send-logs?courseId=${courseId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs ?? []);
    }
  }

  function toggle(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => s.email)));
    }
  }

  async function send(recipients: "all" | "selected") {
    const emails =
      recipients === "all"
        ? students.map((s) => s.email)
        : Array.from(selected);
    if (emails.length === 0) {
      setResult("발송할 학습자가 없습니다.");
      return;
    }
    const confirmText =
      recipients === "all"
        ? `등록된 전체 ${emails.length}명에게 발송할까요?`
        : `선택된 ${emails.length}명에게 발송할까요?`;
    if (!window.confirm(confirmText)) return;

    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          kind,
          recipients: emails,
          subject: draft.subject,
          body: draft.body,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(`실패: ${data.error ?? ""}`);
        return;
      }
      const okCount = data.results.filter((r: { status: string }) => r.status === "ok").length;
      const errCount = data.results.length - okCount;
      setResult(
        `발송 완료 — 성공 ${okCount}건${errCount > 0 ? `, 실패 ${errCount}건` : ""}`,
      );
      setSelected(new Set());
      await fetchLogs();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="bg-white rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand/80">메일 발송</h2>
        <div className="flex gap-1 bg-brand-surface rounded-lg p-1">
          <TabButton active={kind === "kickoff"} onClick={() => setKind("kickoff")}>
            교육자료 (시작)
          </TabButton>
          <TabButton active={kind === "review"} onClick={() => setKind("review")}>
            복습자료 (종료)
          </TabButton>
        </div>
      </div>

      {/* 템플릿 편집 */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-brand/70 block mb-1">
            제목
          </label>
          <input
            value={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand/15 bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-brand/70 block mb-1">
            본문
          </label>
          <textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            rows={12}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand/15 bg-white font-mono leading-relaxed"
          />
        </div>
      </div>

      {/* 수신자 선택 */}
      <div className="border-t border-brand/10 pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-brand/70">
            수신자 ({students.length}명)
          </p>
          {students.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-brand-accent hover:underline"
            >
              {selected.size === students.length ? "전체 해제" : "전체 선택"}
            </button>
          )}
        </div>
        {students.length === 0 ? (
          <p className="text-xs text-brand/50 py-3">
            등록된 학습자가 없습니다. 학습자가 QR로 등록하면 여기에 표시됩니다.
          </p>
        ) : (
          <ul className="max-h-48 overflow-y-auto text-sm divide-y divide-brand/10 border border-brand/10 rounded-lg">
            {students.map((s) => (
              <li key={s.id}>
                <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-surface">
                  <input
                    type="checkbox"
                    checked={selected.has(s.email)}
                    onChange={() => toggle(s.email)}
                  />
                  <span className="font-mono text-brand">{s.email}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 발송 버튼 */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => send("all")}
          disabled={sending || students.length === 0}
          className="px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-accent transition disabled:opacity-50"
        >
          {sending ? "발송 중…" : `전체 ${students.length}명에게 발송`}
        </button>
        <button
          type="button"
          onClick={() => send("selected")}
          disabled={sending || selected.size === 0}
          className="px-4 py-2.5 rounded-lg border border-brand text-brand text-sm font-medium hover:bg-brand-surface transition disabled:opacity-30"
        >
          선택한 {selected.size}명에게 발송
        </button>
      </div>

      {result && (
        <div className="text-sm bg-brand-surface text-brand rounded-lg px-4 py-3">
          {result}
        </div>
      )}

      {/* 발송 이력 */}
      <div className="border-t border-brand/10 pt-4">
        <p className="text-xs font-medium text-brand/70 mb-2">
          발송 이력 ({logs.length}건)
        </p>
        {logs.length === 0 ? (
          <p className="text-xs text-brand/50">아직 발송 이력이 없습니다.</p>
        ) : (
          <ul className="max-h-48 overflow-y-auto text-xs divide-y divide-brand/10">
            {logs
              .slice()
              .reverse()
              .map((l) => (
                <li key={l.id} className="py-1.5 flex items-center gap-3">
                  <span
                    className={
                      l.status === "ok" ? "text-green-700" : "text-red-600"
                    }
                  >
                    {l.status === "ok" ? "✓" : "✕"}
                  </span>
                  <span className="font-mono text-brand">{l.toEmail}</span>
                  <span className="text-brand/40">{l.kind}</span>
                  <span className="text-brand/40 ml-auto">
                    {formatLogTime(l.sentAt)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-3 py-1.5 text-xs rounded-md font-medium transition " +
        (active ? "bg-brand text-white" : "text-brand/70 hover:text-brand")
      }
    >
      {children}
    </button>
  );
}

function formatLogTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
