// 학습자 공개 등록 페이지 — QR/링크로 진입
import { getCourse } from "@/lib/sheets";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourse(courseId);

  if (!course) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center text-brand/70">
          <p className="text-lg font-medium">존재하지 않는 교육과정입니다.</p>
          <p className="mt-2 text-base">관리자에게 링크를 다시 요청해주세요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <p className="text-sm text-brand/60">{course.date}</p>
          <h1 className="text-xl font-bold text-brand mt-1">
            {course.company} · {course.courseName}
          </h1>
          {course.audience && (
            <p className="text-base text-brand/70 mt-1">{course.audience}</p>
          )}
          <p className="text-base text-brand/80 mt-6">
            교육 자료를 받아보실 이메일을 입력해주세요.
          </p>
          <RegisterForm courseId={course.id} />
        </div>
      </div>
    </main>
  );
}
