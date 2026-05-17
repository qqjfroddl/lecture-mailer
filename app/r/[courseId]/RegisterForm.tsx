// 이메일 입력 → /api/register 호출 → 성공 화면
"use client";

import { useState } from "react";

export default function RegisterForm({ courseId }: { courseId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록 실패");
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mt-6 text-center bg-brand-surface rounded-xl p-6">
        <p className="text-2xl">✓</p>
        <p className="font-semibold text-brand mt-2">등록 완료</p>
        <p className="text-sm text-brand/70 mt-1">
          입력하신 이메일로 곧 자료가 발송됩니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        autoFocus
        className="w-full px-4 py-3 rounded-lg border border-brand/20 bg-white focus:outline-none focus:border-brand-accent"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-accent transition disabled:opacity-50"
      >
        {loading ? "등록 중…" : "등록하기"}
      </button>
    </form>
  );
}
