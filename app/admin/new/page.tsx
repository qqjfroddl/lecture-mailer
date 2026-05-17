// 신규 교육과정 생성 폼
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    date: "",
    company: "",
    courseName: "",
    audience: "",
    duration: "",
    notionUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "생성 실패");
        return;
      }
      router.replace(`/admin/${data.course.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-base text-brand/60 hover:text-brand">
          ← 목록
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-brand mb-6">새 교육과정</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white rounded-xl p-6">
        <Field label="교육일자" required>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="회사" required>
          <input
            type="text"
            required
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="예: 삼성전자"
            className="input"
          />
        </Field>
        <Field label="과정명" required>
          <input
            type="text"
            required
            value={form.courseName}
            onChange={(e) => update("courseName", e.target.value)}
            placeholder="예: AI 활용 마스터 클래스"
            className="input"
          />
        </Field>
        <Field label="대상자">
          <input
            type="text"
            value={form.audience}
            onChange={(e) => update("audience", e.target.value)}
            placeholder="예: 팀장급 30명"
            className="input"
          />
        </Field>
        <Field label="시간">
          <input
            type="text"
            value={form.duration}
            onChange={(e) => update("duration", e.target.value)}
            placeholder="예: 09:00-18:00 (8시간)"
            className="input"
          />
        </Field>
        <Field label="노션 링크 (학습자 공유)" required>
          <input
            type="url"
            required
            value={form.notionUrl}
            onChange={(e) => update("notionUrl", e.target.value)}
            placeholder="https://www.notion.so/..."
            className="input"
          />
        </Field>

        {error && <p className="text-base text-red-600">{error}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-brand text-white text-base font-medium hover:bg-brand-accent transition disabled:opacity-50"
          >
            {loading ? "생성 중…" : "교육과정 생성"}
          </button>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(46, 49, 66, 0.2);
          background: white;
          outline: none;
        }
        .input:focus { border-color: #3C6D71; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-base font-medium text-brand/80 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </div>
      {children}
    </label>
  );
}
