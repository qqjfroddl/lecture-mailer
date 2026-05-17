// 메일 템플릿 — kickoff(교육자료) / review(복습자료) 기본 문구
import type { Course, SendKind } from "./sheets";

export type TemplateDraft = {
  subject: string;
  body: string;
};

export function defaultTemplate(
  course: Course,
  kind: SendKind,
): TemplateDraft {
  const label = `${course.company}-${course.courseName}`;
  if (kind === "kickoff") {
    return {
      subject: `${label}-실습자료`,
      body:
        `안녕하세요? 오늘 교육에 실습할 자료입니다. 아래 링크를 클릭해주세요.\n\n` +
        `${course.notionUrl}\n\n` +
        `감사합니다.\n` +
        `박재현 드림`,
    };
  }
  return {
    subject: `[자료공유] ${label}-복습자료`,
    body:
      `안녕하세요? 강의한 박재현입니다.\n` +
      `강의 잘 들어주시고, 소감도 남겨주셔서 감사합니다.\n` +
      `강의 자료 및 추가 참고 자료 업데이트한 노션 링크 공유합니다.\n` +
      `(*개인 복습용으로만 활용하시고, 외부 공유는 삼가해주세요 :D)\n\n` +
      `${course.notionUrl}\n\n` +
      `그럼 일과 삶에 잘 적용하시길 응원합니다!\n` +
      `감사합니다.\n` +
      `박재현 드림`,
  };
}
