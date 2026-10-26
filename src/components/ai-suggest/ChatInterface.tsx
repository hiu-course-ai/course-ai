
'use client'

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  Bot,
  User,
  Send,
  LoaderCircle,
  RotateCcw,
  BookOpen,
  ExternalLink,
  X,
  GraduationCap,
} from 'lucide-react'

// ========================================
// テスト用授業データ
// 実際のシラバス情報に置き換えてください
// ========================================
type Course = {
  id: string
  name: string
  teacher: string
  laboratory?: string
  courseType: string
  requirement: string
  credits: number
  year: number
  openingYear: number
  semester: string
  evaluation: { name: string; percentage: number }[]
  textbook: boolean
  syllabusUrl: string
  reason: string
}

type Message = {
  id: number
  role: 'user' | 'assistant'
  content: string
  courses?: Course[]
}

// モックデータ：画面動作確認用
const MOCK_COURSES: Course[] = [
  {
    id: 'DEMO-001',
    name: 'プログラミング基礎（サンプル）',
    teacher: '山田 太郎（サンプル）',
    laboratory: '情報システム研究室（サンプル）',
    courseType: '専門',
    requirement: '必修',
    credits: 2,
    year: 1,
    openingYear: 2026,
    semester: '前期',
    evaluation: [
      { name: '試験', percentage: 60 },
      { name: '課題', percentage: 40 },
    ],
    textbook: true,
    syllabusUrl: 'https://www.example.com',
    reason:
      'プログラミングの基本的な考え方を学べるためです。情報分野の専門科目を学ぶ際の基礎として役立つことが期待できます。',
  },
]

// モックAI回答：実際のAI APIには未接続
function createMockReply(
  text: string,
  faculty: string,
  department: string,
) {
  if (!faculty || !department) {
    return {
      content:
        '相談ありがとうございます。回答をより適切にするため、学部と学科を選択してください。',
      courses: [],
    }
  }

  return {
    content:
      `「${text}」について、${faculty}・${department}の学生向けに授業を提案します。以下は動作確認用のサンプル授業です。`,
    courses: MOCK_COURSES,
  }
}

// ========================================
// 授業情報カード
// ========================================
function CourseCard({
  course,
  onShowReason,
}: {
  course: Course
  onShowReason: (course: Course) => void
}) {
  const total = course.evaluation.reduce(
    (sum, item) => sum + item.percentage,
    0,
  )

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-800 shadow-sm">
      <div className="border-b border-gray-100 bg-blue-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm text-blue-700">
          <BookOpen size={17} />
          <span>おすすめの授業</span>
          <span className="ml-auto rounded-full bg-white px-2 py-1 text-xs">
            {course.id}
          </span>
        </div>

        <h3 className="text-lg font-bold">{course.name}</h3>

        <p className="mt-1 text-sm text-gray-600">
          担当教員：{course.teacher}
        </p>

        {course.laboratory && (
          <p className="mt-1 text-sm text-gray-600">
            研究室：{course.laboratory}
          </p>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-gray-500">科目区分</p>
            <p className="mt-1 font-medium">{course.courseType}</p>
          </div>

          <div>
            <p className="text-gray-500">履修区分</p>
            <p className="mt-1 font-medium">{course.requirement}</p>
          </div>

          <div>
            <p className="text-gray-500">単位数</p>
            <p className="mt-1 font-medium">{course.credits}単位</p>
          </div>

          <div>
            <p className="text-gray-500">対象年次</p>
            <p className="mt-1 font-medium">{course.year}年</p>
          </div>

          <div>
            <p className="text-gray-500">開講年度</p>
            <p className="mt-1 font-medium">{course.openingYear}年度</p>
          </div>

          <div>
            <p className="text-gray-500">開講学期</p>
            <p className="mt-1 font-medium">{course.semester}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">成績評価の割合</p>

          <div className="space-y-2">
            {course.evaluation.map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span>{item.percentage}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {total !== 100 && (
            <p className="mt-2 text-xs text-amber-700">
              ※ 評価割合の合計が100%ではありません。
            </p>
          )}
        </div>

        <div className="text-sm">
          <span className="text-gray-500">教科書：</span>
          <span className="font-medium">
            {course.textbook ? 'あり' : 'なし'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onShowReason(course)}
            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
          >
            おすすめの理由を見る
          </button>

          <a
            href={course.syllabusUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium transition hover:bg-gray-50"
          >
            シラバスを見る
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}

// ========================================
// チャット画面
// ========================================
export function ChatInterface() {
  const [faculty, setFaculty] = useState('')
  const [department, setDepartment] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [reasonCourse, setReasonCourse] = useState<Course | null>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        'こんにちは！AI履修相談です。学部・学科を選択して、学びたい分野や履修について相談してください。',
    },
  ])

  const nextId = useRef(2)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // 学部・学科の候補：テスト用
  // 実際の大学の正式な情報に合わせて修正してください
  const departments: Record<string, string[]> = {
    経営情報学部: ['先端経営学科', 'システム情報学科'],
    情報メディア学部: ['情報メディア学科'],
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message = {
      id: nextId.current++,
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // API Route から DB の科目データを取得
      const res = await fetch('/api/courses')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'データ取得に失敗しました')
      }

      const assistantMessage: Message = {
        id: nextId.current++,
        role: 'assistant',
        content: `${faculty}・${department}の登録科目（データベースより取得）を表示します。`,
        courses: data.courses,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: 'assistant',
          content: '科目データの取得中にエラーが発生しました。もう一度お試しください。',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const handleReset = () => {
    if (loading) return

    setMessages([
      {
        id: nextId.current++,
        role: 'assistant',
        content:
          '会話をリセットしました。学部・学科を選択して、新しい相談を始めてください。',
      },
    ])

    setInput('')
    setReasonCourse(null)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] min-h-[500px] flex-col bg-gray-50">
      {/* 画面上部 */}
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <GraduationCap size={24} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900">
                AI履修相談
              </h1>
              <p className="text-xs text-gray-500">
                自分に合った授業を探しましょう
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={15} />
            <span className="hidden sm:inline">会話をリセット</span>
          </button>
        </div>

        {/* 学部・学科選択 */}
        <div className="mx-auto mt-4 grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">
              学部
            </span>

            <select
              value={faculty}
              onChange={(event) => {
                setFaculty(event.target.value)
                setDepartment('')
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">学部を選択してください</option>

              {Object.keys(departments).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">
              学科
            </span>

            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              disabled={!faculty}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="">学科を選択してください</option>

              {(departments[faculty] ?? []).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mx-auto mt-2 max-w-5xl text-xs text-amber-700">
          ※ 学部・学科と授業情報は動作確認用のサンプルです。
        </p>
      </header>

      {/* チャットメッセージ一覧 */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {message.role === 'user' ? (
                  <User size={18} />
                ) : (
                  <Bot size={19} />
                )}
              </div>

              <div className="min-w-0 max-w-[85%]">
                <div
                  className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-7 ${
                    message.role === 'user'
                      ? 'rounded-tr-sm bg-blue-600 text-white'
                      : 'rounded-tl-sm border border-gray-200 bg-white text-gray-800'
                  }`}
                >
                  {message.content}
                </div>

                {message.courses?.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onShowReason={setReasonCourse}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* AI回答待ちの表示 */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700">
                <Bot size={19} />
              </div>

              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                <LoaderCircle size={17} className="animate-spin" />
                回答を作成しています...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* メッセージ入力欄 */}
      <footer className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-3"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例：プログラミングを学びたい"
            rows={1}
            disabled={loading}
            className="max-h-36 min-h-12 flex-1 resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="メッセージを送信"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? (
              <LoaderCircle size={20} className="animate-spin" />
            ) : (
              <Send size={19} />
            )}
          </button>
        </form>

        <p className="mx-auto mt-2 max-w-3xl text-xs text-gray-400">
          Enterで送信・Shift + Enterで改行
        </p>
      </footer>

      {/* おすすめ理由のポップアップ */}
      {reasonCourse && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setReasonCourse(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reason-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-blue-600">
                  おすすめの理由
                </p>

                <h2
                  id="reason-title"
                  className="mt-1 text-lg font-bold text-gray-900"
                >
                  {reasonCourse.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setReasonCourse(null)}
                aria-label="ポップアップを閉じる"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {reasonCourse.reason}
            </p>

            <button
              type="button"
              onClick={() => setReasonCourse(null)}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
