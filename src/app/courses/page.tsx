"use client";

import { useState, useMemo } from "react";

// バックエンド設計に合わせた型拡張例
type Status = "PASSED" | "FAILED";

type Course = {
  id: number;
  name: string;
  year: number;
  semester: string;
  credits: number;
  status: Status; // 合格/不合格
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: "(例)プログラミング入門", year: 1, semester: "前期", credits: 4, status: "PASSED" },
  ]);

  // 入力用ステート
  const [name, setName] = useState("");
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState("前期");
  const [credits, setCredits] = useState(2);
  const [status, setStatus] = useState<Status>("PASSED");

  // 合格した単位のみを自動集計
  const totalCredits = useMemo(() => {
    return courses
      .filter((c) => c.status === "PASSED")
      .reduce((sum, c) => sum + c.credits, 0);
  }, [courses]);

  const addCourse = () => {
    if (name.trim() === "") return;

    const newCourse: Course = {
      id: Date.now(),
      name,
      year,
      semester,
      credits,
      status,
    };

    setCourses([...courses, newCourse]);
    setName("");
  };

  const deleteCourse = (id: number) => {
    setCourses(courses.filter((course) => course.id !== id));
  };

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">履修済み科目</h1>
        {/* 合格単位数の合計表示 */}
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-blue-700">
          合計修得単位数: <span className="text-xl font-bold">{totalCredits}</span> 単位
        </div>
      </div>

      {/* 入力フォームの拡張 */}
      <div className="mb-6 grid grid-cols-6 gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="科目名"
          className="col-span-2 rounded border px-3 py-2"
        />
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded border px-3 py-2">
          {[1, 2, 3, 4].map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
        <select value={semester} onChange={(e) => setSemester(e.target.value)} className="rounded border px-3 py-2">
          <option value="前期">前期</option>
          <option value="後期">後期</option>
        </select>
        <input
          type="number"
          value={credits}
          onChange={(e) => setCredits(Number(e.target.value))}
          placeholder="単位"
          className="rounded border px-3 py-2"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="rounded border px-3 py-2">
          <option value="PASSED">合格</option>
          <option value="FAILED">不合格</option>
        </select>
        <button onClick={addCourse} className="col-span-6 rounded bg-blue-500 py-2 text-white">
          追加
        </button>
      </div>

      {/* テーブル表示（合否ステータス追加） */}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">科目名</th>
              <th className="p-3 text-left">学年</th>
              <th className="p-3 text-left">学期</th>
              <th className="p-3 text-left">単位</th>
              <th className="p-3 text-left">合否</th>
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
                  <span className={`rounded px-2 py-1 text-xs ${course.status === "PASSED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {course.status === "PASSED" ? "合格" : "不合格"}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => deleteCourse(course.id)} className="rounded bg-red-500 px-3 py-1 text-white">
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