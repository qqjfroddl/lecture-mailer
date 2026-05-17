// 공유 URL 표시 + 복사 버튼
"use client";

import { useState } from "react";

export default function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-stretch gap-2">
      <input
        readOnly
        value={url}
        onClick={(e) => (e.target as HTMLInputElement).select()}
        className="flex-1 px-3 py-2 text-sm rounded-lg border border-brand/15 bg-brand-surface text-brand"
      />
      <button
        type="button"
        onClick={copy}
        className="px-4 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-accent transition"
      >
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}
