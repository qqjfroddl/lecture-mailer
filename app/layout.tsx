// 전역 레이아웃 — 한국어 폰트 및 메타 설정
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "lecture-mailer · 강의 자료 공유 받기",
  description: "이메일을 입력하면 강의 자료를 받으실 수 있어요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
