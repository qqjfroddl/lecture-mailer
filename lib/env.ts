// 환경변수를 zod로 검증해 안전하게 노출하는 모듈
import { z } from "zod";

const schema = z.object({
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z
    .union([z.string(), z.boolean()])
    .transform((v) => v === true || v === "true"),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM_NAME: z.string().min(1),
  SMTP_FROM_EMAIL: z.string().email(),

  GOOGLE_SHEET_ID: z.string().min(1),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: z.string().min(1),

  ADMIN_PASSWORD: z.string().min(1),
  SESSION_SECRET: z.string().min(16),

  NEXT_PUBLIC_BASE_URL: z.string().url(),
});

let cached: z.infer<typeof schema> | null = null;

export function env() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `- ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `환경변수가 올바르지 않습니다. .env.local 을 확인하세요.\n${issues}`,
    );
  }
  cached = parsed.data;
  return cached;
}

// private key 에 \n 이스케이프가 들어있는 경우 실제 줄바꿈으로 풀어준다.
export function privateKey(): string {
  return env().GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n");
}
