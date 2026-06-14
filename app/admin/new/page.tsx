// 신규 교육과정 생성 화면
import CourseForm from "../_components/CourseForm";

export default function NewCoursePage() {
  return (
    <CourseForm
      mode="create"
      cancelHref="/admin"
      title="새 교육과정"
    />
  );
}
