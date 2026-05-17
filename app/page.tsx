// 루트 — 관리자 진입 안내
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-brand">
          강의 메일 자동화
        </h1>
        <p className="mt-2 text-sm text-brand/70">
          박재현 소장 전용 운영 도구
        </p>
        <Link
          href="/admin"
          className="inline-block mt-8 px-6 py-3 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-accent transition"
        >
          관리자 들어가기
        </Link>
      </div>
    </main>
  );
}
