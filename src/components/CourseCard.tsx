type Course = {
  id: string
  name: string
  teacher: string
  year: string
  semester: string
  category: string
  credits: number
  description: string
}

type CourseCardProps = {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {course.category}
            </span>

            <span className="text-xs text-muted-foreground">
              科目ID: {course.id}
            </span>
          </div>

          <h2 className="mt-3 text-lg font-semibold text-foreground">
            {course.name}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            担当教員：{course.teacher}
          </p>
        </div>

        <div className="shrink-0 rounded-lg bg-muted px-3 py-2 text-sm">
          <p>{course.year}</p>
          <p>{course.semester}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {course.description}
      </p>

      <div className="mt-4 border-t border-border pt-4">
        <span className="text-sm font-medium">
          単位数：{course.credits}単位
        </span>
      </div>
    </div>
  )
}

export type { Course }