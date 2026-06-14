// 과정 정보 수정 화면 - 기존 값을 미리 채워둔 CourseForm
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/sheets";
import CourseForm from "../../_components/CourseForm";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  if (!course) notFound();

  return (
    <CourseForm
      mode="edit"
      courseId={course.id}
      cancelHref={`/admin/${course.id}`}
      title={`${course.company} · ${course.courseName} 수정`}
      initial={{
        date: course.date,
        company: course.company,
        courseName: course.courseName,
        audience: course.audience,
        duration: course.duration,
        notionUrl: course.notionUrl,
      }}
    />
  );
}
