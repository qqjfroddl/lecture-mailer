// 학습자 이메일 등록 폼 — 동시 접속 대비 1회 자동 재시도
"use client";

import { useState } from "react";

async function tryRegister(courseId: string, email: string): Promise<{ ok: true } | { ok: false; error: string; retryable: boolean }> {
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, email }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    // 429 / 500 / 503 은 재시도 가치 있음
    const retryable = res.status === 429 || res.status >= 500;
    return { ok: false, error: data.error ?? `요청 실패 (${res.status})`, retryable };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "네트워크 오류", retryable: true };
  }
}

export default function RegisterForm({ courseId }: { courseId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1차 시도
    let result = await tryRegister(courseId, email);
    // 실패 + 재시도 가치 있으면 0.8초 대기 후 1회 더
    if (!result.ok && result.retryable) {
      await new Promise((r) => setTimeout(r, 800));
      result = await tryRegister(courseId, email);
    }

    if (result.ok) {
      setDone(true);
    } else {
      setError(
        result.retryable
          ? "지금 등록자가 몰려서 잠시 지연되고 있어요. 10초 뒤 다시 한 번 눌러주세요."
          : result.error,
      );
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="mt-6 text-center bg-brand-surface rounded-xl p-6">
        <p className="text-2xl">✓</p>
        <p className="font-semibold text-brand mt-2">등록 완료</p>
        <p className="text-base text-brand/70 mt-1">
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
      {error && <p className="text-base text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-lg bg-brand text-white text-base font-medium hover:bg-brand-accent transition disabled:opacity-50"
      >
        {loading ? "등록 중…" : "등록하기"}
      </button>
    </form>
  );
}
