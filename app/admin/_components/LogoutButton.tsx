// 로그아웃 버튼 — 쿠키 삭제 후 /login 으로 이동
"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="text-xs text-white/80 hover:text-white underline"
    >
      로그아웃
    </button>
  );
}
