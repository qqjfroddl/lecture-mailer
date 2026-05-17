// 관리자 영역 공통 레이아웃 — 헤더 + 로그아웃
import Link from "next/link";
import LogoutButton from "./_components/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="bg-brand text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin" className="text-sm font-semibold">
            lecture-mailer
          </Link>
          <LogoutButton />
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
