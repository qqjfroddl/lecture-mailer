// 전역 레이아웃 — 한국어 폰트 및 메타 설정
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "lecture-mailer · 강의 메일 자동화",
  description: "박재현 소장 강의 운영 자동화 도구",
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
