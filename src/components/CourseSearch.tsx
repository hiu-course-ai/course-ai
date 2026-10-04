'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

import { CourseCard, type Course } from '@/components/CourseCard'

// ============================================================
// 仮データ
// ------------------------------------------------------------
// FE-03では、まだ授業検索API（BE-03）が完成していないため、
// 動作確認用としてここに仮の授業データを用意しています。
//
// BE-03が完成したら、この部分をAPIから取得する処理に変更します。
// 例：
// const response = await fetch('/api/courses')
// const courses = await response.json()
// ============================================================
const MOCK_COURSES: Course[] = [
  {
    id: '001',
    name: 'プログラミング基礎',
    teacher: '山田 太郎',
    year: '1年',
    semester: '前期',
    category: '情報',
    credits: 2,
    description:
      'プログラミングの基本的な考え方やアルゴリズム、基本的なコーディング技術について学びます。',
  },
  {
    id: '002',
    name: 'データベース',
    teacher: '佐藤 花子',
    year: '2年',
    semester: '前期',
    category: '情報',
    credits: 2,
    description:
      'データベースの基本概念やSQL、データの検索・登録・更新などについて学びます。',
  },
  {
    id: '003',
    name: 'マーケティング論',
    teacher: '鈴木 一郎',
    year: '2年',
    semester: '後期',
    category: '経営',
    credits: 2,
    description:
      'マーケティングの基礎となる顧客ニーズや市場調査、商品企画などについて学びます。',
  },
  {
    id: '004',
    name: '情報システム学概論',
    teacher: '田中 次郎',
    year: '1年',
    semester: '後期',
    category: '情報',
    credits: 2,
    description:
      '情報システムの基本的な考え方や、企業における情報システムの役割について学びます。',
  },
  {
    id: '005',
    name: '統計学',
    teacher: '高橋 美咲',
    year: '2年',
    semester: '前期',
    category: '数学',
    credits: 2,
    description:
      'データの整理や代表値、確率、推定、検定など、統計学の基礎について学びます。',
  },
  {
    id: '006',
    name: 'Webアプリケーション開発',
    teacher: '伊藤 健',
    year: '3年',
    semester: '前期',
    category: '情報',
    credits: 2,
    description:
      'HTML、CSS、JavaScriptなどを利用してWebアプリケーションを開発する方法を学びます。',
  },
]

// カテゴリの選択肢
const CATEGORIES = ['すべて', '情報', '経営', '数学']

export function CourseSearch() {
  // 入力欄に現在入力されているキーワード
  const [keyword, setKeyword] = useState('')

  // 現在選択されているカテゴリ
  const [category, setCategory] = useState('すべて')

  // 実際に検索に使用したキーワード
  const [searchedKeyword, setSearchedKeyword] = useState('')

  // 実際に検索に使用したカテゴリ
  const [searchedCategory, setSearchedCategory] = useState('すべて')

  // 検索ボタンを押したかどうか
  const [hasSearched, setHasSearched] = useState(false)

  // 検索処理
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSearchedKeyword(keyword)
    setSearchedCategory(category)
    setHasSearched(true)
  }

  // ============================================================
  // 仮データから検索結果を作成
  // ------------------------------------------------------------
  // 現在はMOCK_COURSESを検索しています。
  //
  // BE-03の授業検索APIが完成したら、
  // この部分をAPIから取得したデータを表示する処理に変更します。
  // ============================================================
  const searchResults = MOCK_COURSES.filter((course) => {
    const normalizedKeyword = searchedKeyword.trim().toLowerCase()

    // キーワードが空なら、キーワードによる絞り込みは行わない
    const matchesKeyword =
      normalizedKeyword === '' ||
      course.name.toLowerCase().includes(normalizedKeyword) ||
      course.teacher.toLowerCase().includes(normalizedKeyword) ||
      course.description.toLowerCase().includes(normalizedKeyword)

    // 「すべて」ならカテゴリによる絞り込みは行わない
    const matchesCategory =
      searchedCategory === 'すべて' ||
      course.category === searchedCategory

    return matchesKeyword && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          授業検索
        </h1>

        <p className="mt-2 text-muted-foreground">
          キーワードやカテゴリから授業を検索できます。
        </p>
      </div>

      {/* 検索フォーム */}
      <form
        onSubmit={handleSearch}
        className="rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_200px_auto]">
          {/* キーワード入力 */}
          <div>
            <label
              htmlFor="course-keyword"
              className="mb-2 block text-sm font-medium"
            >
              キーワード
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

              <input
                id="course-keyword"
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="授業名・教員名などを入力"
                className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* カテゴリ選択 */}
          <div>
            <label
              htmlFor="course-category"
              className="mb-2 block text-sm font-medium"
            >
              カテゴリ
            </label>

            <select
              id="course-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* 検索ボタン */}
          <div className="flex items-end">
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 md:w-auto"
            >
              <Search className="size-4" />
              検索
            </button>
          </div>
        </div>
      </form>

      {/* 検索結果 */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                検索結果
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {searchResults.length}件の授業が見つかりました
              </p>
            </div>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid gap-4">
              {searchResults.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <Search className="mx-auto size-10 text-muted-foreground" />

              <h3 className="mt-4 font-semibold">
                授業が見つかりませんでした
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                キーワードやカテゴリを変更して、もう一度検索してください。
              </p>
            </div>
          )}
        </div>
      )}

      {/* 検索前の表示 */}
      {!hasSearched && (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Search className="mx-auto size-10 text-muted-foreground" />

          <h2 className="mt-4 font-semibold">
            授業を検索してください
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            授業名や教員名などを入力して検索できます。
          </p>
        </div>
      )}
    </div>
  )
}