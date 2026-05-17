// /admin/* 경로를 세션 쿠키로 보호하는 Next.js 미들웨어
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "./lib/auth";

const PROTECTED = /^\/admin(\/|$)/;

export async function middleware(req: NextRequest) {
  if (!PROTECTED.test(req.nextUrl.pathname)) {
    return NextResponse.next();
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return redirectToLogin(req);
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
