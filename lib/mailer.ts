// Daum SMTP 를 사용해 메일을 발송하는 모듈
import nodemailer, { Transporter } from "nodemailer";
import { env } from "./env";

let cachedTransporter: Transporter | null = null;

export function transporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;
  const e = env();
  cachedTransporter = nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_SECURE,
    auth: {
      user: e.SMTP_USER,
      pass: e.SMTP_PASS,
    },
  });
  return cachedTransporter;
}

export type SendArgs = {
  to: string;
  subject: string;
  text: string;
};

// 단건 발송
export async function sendMail(args: SendArgs): Promise<void> {
  const e = env();
  await transporter().sendMail({
    from: `"${e.SMTP_FROM_NAME}" <${e.SMTP_FROM_EMAIL}>`,
    to: args.to,
    subject: args.subject,
    text: args.text,
  });
}

// 다건 발송 — 결과를 모아서 반환. 한 사람 실패해도 다음 사람은 계속.
// SMTP rate limit 회피용으로 발송 사이 짧은 sleep.
export type BulkResult = {
  email: string;
  status: "ok" | "error";
  error?: string;
};

export async function sendBulk(
  recipients: string[],
  build: (email: string) => { subject: string; text: string },
  opts?: { delayMs?: number },
): Promise<BulkResult[]> {
  const delay = opts?.delayMs ?? 100;
  const results: BulkResult[] = [];
  for (const email of recipients) {
    try {
      const body = build(email);
      await sendMail({ to: email, ...body });
      results.push({ email, status: "ok" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ email, status: "error", error: msg });
    }
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  }
  return results;
}
