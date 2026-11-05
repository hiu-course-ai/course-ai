
'use client'

import { useState } from 'react'
import {
  FileText,
  Upload,
  Copy,
  Check,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react'

type CourseGrade = '秀' | '優' | '良' | '可' | '不可' | '履修'

type CourseStatus = '修得済み' | '未修得' | '履修中' | '要確認'

type CourseRecord = {
  id: number
  courseName: string
  credits: number
  grade: CourseGrade
  status: CourseStatus
}

type ExtractResult = {
  text: string
  pages: number
  fileName: string
  courses: CourseRecord[]
}

const GRADES: CourseGrade[] = ['秀', '優', '良', '可', '不可', '履修']

const STATUSES: CourseStatus[] = [
  '修得済み',
  '未修得',
  '履修中',
  '要確認',
]

// 成績から初期の取得状況を判定する
function getInitialStatus(grade: CourseGrade): CourseStatus {
  if (grade === '履修') return '履修中'
  if (grade === '不可') return '未修得'
  return '修得済み'
}

// PDFから抽出した文字列を、科目情報の候補に変換する
function parseCourses(text: string): CourseRecord[] {
  const courses: CourseRecord[] = []

  /*
   * 対応する表記の例
   *
   * プログラミング入門4秀424前
   * オペレーティングシステム2可1
   * ネットワークとセキュリティI2不可025後
   * 情報職業論*2履修
   *
   * 単位数の直後に成績が記載されている形式を探す。
   * 年度やGPは今回の保存対象ではないため、候補の抽出にのみ利用する。
   */
  const pattern =
    /(?<!\d)(\*?)([1-8])(不可|履修|秀|優|良|可)(?:(\d)(\d{2}(?:前|後))?|(\d{2}(?:前|後)))?(?!\d)/g

  let previousEnd = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const credits = Number(match[2])
    const grade = match[3] as CourseGrade

    // 前の成績情報から、今回の成績情報までの文字列を取得する
    let subjectSource = text.slice(previousEnd, match.index)

    /*
     * 年度表記が科目名より前にある場合、
     * 直近の年度表記より後ろを科目名候補にする。
     */
    const yearMatches = [
      ...subjectSource.matchAll(/\d{2}(?:前|後)/g),
    ]

    const lastYear = yearMatches[yearMatches.length - 1]

    if (lastYear?.index !== undefined) {
      subjectSource = subjectSource.slice(
        lastYear.index + lastYear[0].length
      )
    }

    /*
     * PDFの表の列が混ざったときに、
     * 複数の情報が連結している場合を考慮する。
     * 2文字以上の空白で区切り、最後の部分を候補にする。
     */
    const parts = subjectSource
      .split(/\s{2,}/)
      .map((part) => part.trim())
      .filter(Boolean)

    let courseName = parts[parts.length - 1] ?? ''

    courseName = courseName
      .replace(/^\s*\d{2}(?:前|後)\s*/, '')
      .replace(/^[\s*]+/, '')
      .replace(/\s+/g, ' ')
      .trim()

    // 科目名として明らかに不適切な見出しなどを除外する
    const invalidName =
      !courseName ||
      courseName.length > 50 ||
      /^(修得単位|専門選択|専門必修|専門教育科目|教養教育科目|卒業要件|科目名|単位数|年度|評価|ＧＰＡ|GPA|学籍番号|成績表|氏名|所属)/.test(
        courseName
      ) ||
      /修得単位合計|修得単位小計|卒業要件に含まれる科目/.test(
        courseName
      )

    // 不適切な候補は一覧に登録しない
    if (!invalidName) {
      courses.push({
        id: courses.length + 1,
        courseName,
        credits,
        grade,
        status: getInitialStatus(grade),
      })
    }

    // 次の候補を探す開始位置を更新する
    previousEnd = pattern.lastIndex
  }

  return courses
}

export function PdfTextExtractor() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ExtractResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // PDFを選択したときの処理
  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0]

    setResult(null)
    setError('')
    setCopied(false)

    if (!selectedFile) {
      setFile(null)
      return
    }

    // PDF以外のファイルを拒否
    if (
      selectedFile.type !== 'application/pdf' &&
      !selectedFile.name.toLowerCase().endsWith('.pdf')
    ) {
      setFile(null)
      setError('PDFファイルを選択してください。')
      event.target.value = ''
      return
    }

    // ファイルサイズを10MB以下に制限
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null)
      setError('ファイルサイズは10MB以下にしてください。')
      event.target.value = ''
      return
    }

    setFile(selectedFile)
  }

  // PDFを送信して文字列と科目候補を抽出する
  async function handleExtract() {
    if (!file) {
      setError('先にPDFファイルを選択してください。')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setCopied(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/pdf-extract', {
        method: 'POST',
        body: formData,
      })

      const responseText = await response.text()

      console.log('APIステータス:', response.status)
      console.log('API応答:', responseText)

      if (!responseText.trim()) {
        throw new Error(
          `サーバーから応答がありませんでした。（HTTP ${response.status}）`
        )
      }

      let data: {
        text?: string
        pages?: number
        fileName?: string
        error?: string
      }

      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error(
          `サーバーの応答がJSON形式ではありません。（HTTP ${response.status}）ConsoleでAPI応答を確認してください。`
        )
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            `PDFの読み取りに失敗しました。（HTTP ${response.status}）`
        )
      }

      const extractedText = data.text ?? ''

      // 抽出した文字列から科目情報の候補を作成する
      const extractedCourses = parseCourses(extractedText)

      setResult({
        text: extractedText,
        pages: data.pages ?? 0,
        fileName: data.fileName ?? file.name,
        courses: extractedCourses,
      })

      if (!extractedText.trim()) {
        setError(
          '文字列を抽出できませんでした。画像形式のPDFの場合はOCRが必要です。'
        )
      }
    } catch (error) {
      console.error('PDF抽出エラー:', error)

      setError(
        error instanceof Error
          ? error.message
          : '予期しないエラーが発生しました。'
      )
    } finally {
      setLoading(false)
    }
  }

  // 抽出結果をクリップボードにコピーする
  async function handleCopy() {
    if (!result?.text) return

    try {
      await navigator.clipboard.writeText(result.text)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setError(
        'コピーできませんでした。ブラウザの設定を確認してください。'
      )
    }
  }

  // 確認画面で編集された科目情報を更新する
  function updateCourse(
    id: number,
    changes: Partial<CourseRecord>
  ) {
    setResult((current) => {
      if (!current) return current

      return {
        ...current,
        courses: current.courses.map((course) =>
          course.id === id
            ? { ...course, ...changes }
            : course
        ),
      }
    })
  }

  // 修得単位数を計算する
  // ※修得状況が「修得済み」の科目だけ単位を加算する
  const totalEarnedCredits =
    result?.courses.reduce((total, course) => {
      return (
        total +
        (course.status === '修得済み' ? course.credits : 0)
      )
    }, 0) ?? 0

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          履修済み科目
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          成績表のPDFをアップロードして、科目名・単位数・成績・取得状況を抽出します。
        </p>
      </div>

      {/* ① PDF選択エリア */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Upload className="size-5" />
          ① PDFファイルを選択
        </h2>

        <label
          htmlFor="pdf-file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 transition hover:bg-muted/60"
        >
          <FileText className="mb-3 size-10 text-muted-foreground" />

          <span className="text-sm font-medium">
            クリックしてPDFを選択
          </span>

          <span className="mt-2 text-xs text-muted-foreground">
            PDF形式・10MB以下
          </span>

          <input
            id="pdf-file"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        {file && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-background p-3">
            <FileText className="size-5 shrink-0 text-primary" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {file.name}
              </p>

              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleExtract}
          disabled={!file || loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              科目情報を抽出しています...
            </>
          ) : (
            <>
              <FileText className="size-4" />
              PDFから科目情報を抽出
            </>
          )}
        </button>
      </section>

      {/* エラーメッセージ */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <p className="whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {/* ② 科目情報の確認・編集エリア */}
      {result && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <Check className="size-5" />
              ② 抽出した科目情報を確認
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {result.fileName} ・ {result.pages}ページ
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              科目候補：{result.courses.length}件
              {' / '}
              修得単位数（仮集計）：{totalEarnedCredits}単位
            </p>
          </div>

          {result.courses.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-3 font-semibold">科目名</th>
                    <th className="px-3 py-3 font-semibold">単位数</th>
                    <th className="px-3 py-3 font-semibold">成績</th>
                    <th className="px-3 py-3 font-semibold">取得状況</th>
                    <th className="px-3 py-3 font-semibold">修得単位数</th>
                  </tr>
                </thead>

                <tbody>
                  {result.courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-t border-border"
                    >
                      <td className="min-w-[260px] px-3 py-3">
                        <input
                          aria-label={`${course.courseName}の科目名`}
                          type="text"
                          value={course.courseName}
                          onChange={(event) =>
                            updateCourse(course.id, {
                              courseName: event.target.value,
                            })
                          }
                          className="w-full rounded-md border border-border bg-background px-2 py-2"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          aria-label={`${course.courseName}の単位数`}
                          type="number"
                          min={1}
                          max={8}
                          value={course.credits}
                          onChange={(event) => {
                            const value = Number(event.target.value)

                            updateCourse(course.id, {
                              credits: Number.isFinite(value)
                                ? Math.max(0, value)
                                : 0,
                            })
                          }}
                          className="w-20 rounded-md border border-border bg-background px-2 py-2"
                        />
                      </td>

                      <td className="px-3 py-3">
                        <select
                          aria-label={`${course.courseName}の成績`}
                          value={course.grade}
                          onChange={(event) => {
                            const grade = event.target.value as CourseGrade

                            updateCourse(course.id, {
                              grade,
                              status: getInitialStatus(grade),
                            })
                          }}
                          className="rounded-md border border-border bg-background px-2 py-2"
                        >
                          {GRADES.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-3">
                        <select
                          aria-label={`${course.courseName}の取得状況`}
                          value={course.status}
                          onChange={(event) =>
                            updateCourse(course.id, {
                              status: event.target.value as CourseStatus,
                            })
                          }
                          className="rounded-md border border-border bg-background px-2 py-2"
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-3 font-medium">
                        {course.status === '修得済み'
                          ? course.credits
                          : 0}
                        単位
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
              科目候補を抽出できませんでした。下の抽出文字列を確認してください。
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            ※ 自動抽出は候補の判定です。科目名や単位数が正しいか確認してください。
            現在は確認・編集まで対応しており、データベースへの保存はまだ行いません。
          </p>
        </section>
      )}

      {/* ③ 元の抽出文字列 */}
      {result && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <FileText className="size-5" />
                ③ 元の抽出文字列
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                科目情報が正しく読み取れていない場合は、元データと比較してください。
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!result.text}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="size-4" />
                  コピーしました
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  文字列をコピー
                </>
              )}
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border-2 border-blue-300 bg-white">
            <div className="border-b border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-semibold text-blue-900">
                ▼ PDFから抽出したデータ
              </p>
            </div>

            <div className="max-h-[600px] overflow-auto p-4">
              <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-gray-800">
                {result.text || '抽出できる文字列がありません。'}
              </pre>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
