"use client";

import { useState } from "react";

type Course = {
  id: number;
  name: string;
  year: number;
  semester: string;
  credits: number;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      name: "プログラミング基礎",
      year: 1,
      semester: "前期",
      credits: 2,
    },
    {
      id: 2,
      name: "情報数学",
      year: 1,
      semester: "後期",
      credits: 2,
    },
  ]);

  const [newCourseName, setNewCourseName] = useState("");

  const addCourse = () => {
    if (newCourseName.trim() === "") return;

    const newCourse: Course = {
      id: Date.now(),
      name: newCourseName,
      year: 1,
      semester: "前期",
      credits: 2,
    };

    setCourses([...courses, newCourse]);
    setNewCourseName("");
  };

  const deleteCourse = (id: number) => {
    setCourses(courses.filter((course) => course.id !== id));
  };

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-bold">履修済み科目</h1>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newCourseName}
          onChange={(e) => setNewCourseName(e.target.value)}
          placeholder="科目名を入力"
          className="rounded border px-3 py-2"
        />

        <button
          onClick={addCourse}
          className="rounded bg-blue-500 px-4 py-2 text-white"
        >
          追加
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">科目名</th>
              <th className="p-3 text-left">学年</th>
              <th className="p-3 text-left">学期</th>
              <th className="p-3 text-left">単位</th>
              <th className="p-3 text-left">操作</th>
            </tr>
          </thead>

          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-t">
                <td className="p-3">{course.name}</td>
                <td className="p-3">{course.year}年</td>
                <td className="p-3">{course.semester}</td>
                <td className="p-3">{course.credits}</td>
                <td className="p-3">
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="rounded bg-red-500 px-3 py-1 text-white"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
