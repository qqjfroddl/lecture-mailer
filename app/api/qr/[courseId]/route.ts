// 과정 ID 에 해당하는 학습자 등록 URL 의 QR 코드 SVG 응답
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { env } from "@/lib/env";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await ctx.params;
  const url = `${env().NEXT_PUBLIC_BASE_URL}/r/${courseId}`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: 320,
    color: { dark: "#2E3142", light: "#FFFFFF" },
  });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}
