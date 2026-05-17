// 짧은 ID 생성기 — 시트에서 사람이 봐도 구분 가능한 prefix 형식
import { randomBytes } from "crypto";

function shortId(): string {
  return randomBytes(4).toString("hex"); // 8자
}

export const newCourseId = () => `crs_${shortId()}`;
export const newStudentId = () => `std_${shortId()}`;
export const newLogId = () => `log_${shortId()}`;
