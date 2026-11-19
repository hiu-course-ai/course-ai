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

// 成績の種類
type CourseGrade = '秀' | '優' | '良' | '可' | '不可' | '履修'

// 取得状況
type CourseStatus = '修得済み' | '未修得' | '履修中' | '要確認'

// 科目情報
type CourseRecord = {
  id: number
  courseName: string
  credits: number | null
  grade: CourseGrade | null
  status: CourseStatus
  note?: string
}

// PDFからの抽出結果
type ExtractResult = {
  text: string
  pages: number
  fileName: string
  courses: CourseRecord[]
}

const GRADES: CourseGrade[] = [
  '秀',
  '優',
  '良',
  '可',
  '不可',
  '履修',
]

const STATUSES: CourseStatus[] = [
  '修得済み',
  '未修得',
  '履修中',
  '要確認',
]

// 科目名ではない集計行・見出し文字列を除外するためのキーワード
const IGNORE_KEYWORDS = [
  '小計',
  '合計',
  '科目名',
  '単位',
  '評価',
  '教養教育',
  '専門教育',
  '専門選択',
  '専門必修',
  '卒業要件',
  '学籍番号',
  'GPA',
  '年度',
  '氏名',
  '所属',
  '専攻',
]

// 全角英数字・記号を半角に統一する（改行や列区切りの空白は残す）
function normalizeLineText(value: string): string {
  return value.normalize('NFKC')
}

// 切り出した科目名から、前後の年度や余分な空白・数字表記ゆれを整える
function cleanCourseName(rawName: string): string {
  let name = rawName.trim()

  // 左右2列が1行に並んでいる場合、2つ以上の連続空白で区切られた最後の塊を科目名とする
  // 例: "前26前    Javaプログラミング" -> "Javaプログラミング"
  // 例: "後      修得単位合計4360    物理学" -> "物理学"
  const segments = name.split(/\s{2,}/)
  name = segments[segments.length - 1].trim()

  // 先頭にくっついている年度(24前など)や評価文字を除去
  name = name
    .replace(/^(?:\d{2}[前後]|[前後]|履修|不可|[秀優良可])+\s*/, '')
    .trim()

  // 科目名末尾の算用数字 1, 2, 3 をローマ数字 I, II, III に統一
  // 例: 離散数学1 -> 離散数学I
  name = name.replace(
    /([^\d\s*])([123])$/,
    (_, prefix: string, num: string) => {
      const roman = num === '3' ? 'III' : num === '2' ? 'II' : 'I'
      return `${prefix}${roman}`
    }
  )

  return name
}

// 科目名として不適切なラベル（小計・見出し等）かどうかを判定する
function isIgnoredLabel(name: string): boolean {
  if (!name || name.length < 2) {
    return true
  }

  if (/^[\d\s*./-]+$/.test(name)) {
    return true
  }

  return IGNORE_KEYWORDS.some((keyword) => name.includes(keyword))
}

// 成績と単位数から取得状況を判定する
function getInitialStatus(
  grade: CourseGrade | null,
  credits: number | null
): CourseStatus {
  if (grade === '履修') {
    return '履修中'
  }

  if (grade === '不可') {
    return '未修得'
  }

  if (
    grade === '秀' ||
    grade === '優' ||
    grade === '良' ||
    grade === '可'
  ) {
    return credits !== null && credits > 0
      ? '修得済み'
      : '要確認'
  }

  return '要確認'
}

// 事前登録リストに頼らず、PDFの文字列パターンから動的に科目一覧を作成する
function parseCourses(text: string): CourseRecord[] {
  const normalizedText = normalizeLineText(text)
  const lines = normalizedText.split(/\r?\n/)

  const records: CourseRecord[] = []
  const seenNames = new Set<string>()

  // 1行内の標準パターン:
  // [科目名] [*]?[単位数1〜8][単位(任意)][不可|履修|秀|優|良|可][GP(0-4,任意)][年度(24前等,任意)]
  const inlineCourseRegex =
    /([^\n*]+?)\s*[*]?([1-8])\s*(?:単位\s*)?(不可|履修|秀|優|良|可)(?:\s*([0-4]))?(?:\s*(\d{2}[前後]))?/g

  const addRecord = (
    rawName: string,
    credits: number | null,
    grade: CourseGrade | null,
    note?: string
  ) => {
    const courseName = cleanCourseName(rawName)

    if (isIgnoredLabel(courseName)) {
      return
    }

    // 同じ科目の重複登録を防止
    if (seenNames.has(courseName)) {
      return
    }

    seenNames.add(courseName)
    records.push({
      id: records.length + 1,
      courseName,
      credits,
      grade,
      status: getInitialStatus(grade, credits),
      note,
    })
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let lastMatchEnd = 0
    inlineCourseRegex.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = inlineCourseRegex.exec(line)) !== null) {
      lastMatchEnd = match.index + match[0].length

      const rawName = match[1]
      const credits = Number(match[2])
      const grade = match[3] as CourseGrade

      addRecord(rawName, credits, grade)
    }

    // 行の後半に、改行で分断された科目や評価欠損の科目が残っていないか確認
    const tail = line.slice(lastMatchEnd).trim()
    if (!tail) {
      continue
    }

    // 行頭から一度も標準パターンに一致しなかった行は「24前 科目名」の形式のみ対象にする
    const candidateTail =
      lastMatchEnd === 0
        ? tail.replace(/^(?:\d{2}[前後])\s+/, '').trim()
        : tail

    if (lastMatchEnd === 0 && candidateTail === tail) {
      continue
    }

    // パターンA: 行末が「科目名 ＋ 単位数1桁」のみで評価がない場合（例: "データベース4"）
    const creditOnlyMatch = candidateTail.match(
      /^([^\d\s*][^\n*]{1,40}?)\s*([1-8])$/
    )
    if (creditOnlyMatch) {
      addRecord(
        creditOnlyMatch[1],
        Number(creditOnlyMatch[2]),
        null,
        '評価が記載されていないか、読み取れませんでした'
      )
      continue
    }

    // パターンB: 行末が「科目名のみ」で、単位数や成績が次の行に回り込んでいる場合
    const wrappedNameMatch = candidateTail.match(
      /^([^\d\s*][^\n*]{1,40})$/
    )
    if (wrappedNameMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim()

      // 次の行の先頭に「[*]?[単位数][成績]」がある場合（例: "2可126前"）
      const nextFullMatch = nextLine.match(
        /^[*]?([1-8])\s*(?:単位\s*)?(不可|履修|秀|優|良|可)/
      )
      if (nextFullMatch) {
        addRecord(
          wrappedNameMatch[1],
          Number(nextFullMatch[1]),
          nextFullMatch[2] as CourseGrade
        )
        continue
      }

      // 次の行の表見出しと重なり、成績のみ残っている場合（例: "科目名単位評価良226前"）
      const nextHeaderGradeMatch = nextLine.match(
        /^(?:科目名|単位|評価)+\s*(不可|履修|秀|優|良|可)/
      )
      if (nextHeaderGradeMatch) {
        addRecord(
          wrappedNameMatch[1],
          null,
          nextHeaderGradeMatch[1] as CourseGrade,
          '表見出しと重なったため単位数が読み取れませんでした'
        )
        continue
      }
    }
  }

  return records
}

// 整理済みの科目一覧を1行1科目のテキストに整形する
function formatOrganizedCoursesText(
  courses: CourseRecord[],
  totalEarnedCredits: number
): string {
  const header = [
    `抽出科目数: ${courses.length}科目 / 修得単位数合計: ${totalEarnedCredits}単位`,
    'No. | 科目名 | 単位数 | 成績 | 取得状況 | 修得単位数',
    '------------------------------------------------------------',
  ]

  const rows = courses.map((course, index) => {
    const no = String(index + 1).padStart(2, '0')
    const creditsText =
      course.credits !== null ? `${course.credits}単位` : '未読取'
    const gradeText = course.grade ?? '未読取'
    const earnedText =
      course.status === '修得済み' && course.credits !== null
        ? `${course.credits}単位`
        : '0単位'

    return `${no}. ${course.courseName} | ${creditsText} | ${gradeText} | ${course.status} | ${earnedText}`
  })

  return [...header, ...rows].join('\n')
}

export function PdfTextExtractor() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ExtractResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedOrganized, setCopiedOrganized] = useState(false)

  // PDFを選択したときの処理
  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0]

    setResult(null)
    setError('')
    setCopied(false)
    setCopiedOrganized(false)

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

  // PDFを送信して科目情報を抽出する
  async function handleExtract() {
    if (!file) {
      setError('先にPDFファイルを選択してください。')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setCopied(false)
    setCopiedOrganized(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // APIにPDFを送信
      const response = await fetch('/api/pdf-extract', {
        method: 'POST',
        body: formData,
      })

      // サーバーからの応答を取得
      const responseText = await response.text()

      if (!responseText.trim()) {
        throw new Error(
          `サーバーから応答がありませんでした。（HTTP ${response.status}）`
        )
      }

      // JSON形式に変換
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
          `サーバーの応答がJSON形式ではありません。（HTTP ${response.status}）`
        )
      }

      // API側でエラーが発生した場合
      if (!response.ok) {
        throw new Error(
          data.error ??
            `PDFの読み取りに失敗しました。（HTTP ${response.status}）`
        )
      }

      const extractedText = data.text ?? ''

      // 事前リストを使わず、PDF内の文字列パターンから動的に科目を抽出
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

  // 元の抽出文字列をコピーする
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

  // 整理済みの科目一覧テキストをコピーする
  async function handleCopyOrganized(totalEarnedCredits: number) {
    if (!result?.courses.length) return

    try {
      const organizedText = formatOrganizedCoursesText(
        result.courses,
        totalEarnedCredits
      )
      await navigator.clipboard.writeText(organizedText)
      setCopiedOrganized(true)

      setTimeout(() => {
        setCopiedOrganized(false)
      }, 2000)
    } catch {
      setError(
        'コピーできませんでした。ブラウザの設定を確認してください。'
      )
    }
  }

  // 科目情報を更新する
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

  // 単位数を変更する
  function handleCreditsChange(
    course: CourseRecord,
    value: string
  ) {
    const credits =
      value.trim() === '' ? null : Number(value)

    if (
      credits !== null &&
      (!Number.isFinite(credits) || credits < 0)
    ) {
      return
    }

    const nextStatus = getInitialStatus(course.grade, credits)

    updateCourse(course.id, {
      credits,
      status: nextStatus,
      note: nextStatus === '要確認' ? course.note : undefined,
    })
  }

  // 成績を変更する
  function handleGradeChange(
    course: CourseRecord,
    value: string
  ) {
    const grade = value ? (value as CourseGrade) : null
    const nextStatus = getInitialStatus(grade, course.credits)

    updateCourse(course.id, {
      grade,
      status: nextStatus,
      note: nextStatus === '要確認' ? course.note : undefined,
    })
  }

  // 要確認の科目数
  const needsReviewCount =
    result?.courses.filter((course) => course.status === '要確認')
      .length ?? 0

  // 修得単位数を集計する
  const totalEarnedCredits =
    result?.courses.reduce((total, course) => {
      if (
        course.status === '修得済み' &&
        course.credits !== null
      ) {
        return total + course.credits
      }

      return total
    }, 0) ?? 0

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* ページタイトル */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          履修済み科目
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          成績表のPDFをアップロードして、科目名・単位数・成績・取得状況を自動抽出・整理します。
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

        {/* 選択したファイル */}
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

        {/* 抽出ボタン */}
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

      {/* ② 科目情報の確認 */}
      {result && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <Check className="size-5" />
                ② 抽出した科目情報
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {result.fileName} ・ {result.pages}ページ
              </p>
            </div>

            {/* 整理済みデータのコピーボタン */}
            <button
              type="button"
              onClick={() => handleCopyOrganized(totalEarnedCredits)}
              disabled={result.courses.length === 0}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:opacity-50"
            >
              {copiedOrganized ? (
                <>
                  <Check className="size-4" />
                  整理済み一覧をコピーしました
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  整理済み一覧をコピー
                </>
              )}
            </button>
          </div>

          {/* 抽出状況 */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">
                抽出した科目数
              </p>

              <p className="mt-1 text-xl font-bold">
                {result.courses.length} 件
              </p>
            </div>

            <div className="rounded-lg bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">
                要確認の科目
              </p>

              <p className="mt-1 text-xl font-bold">
                {needsReviewCount} 件
              </p>
            </div>

            <div className="rounded-lg bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">
                修得単位数（集計）
              </p>

              <p className="mt-1 text-xl font-bold">
                {totalEarnedCredits} 単位
              </p>
            </div>
          </div>

          {/* 科目一覧 */}
          {result.courses.length > 0 ? (
            <div className="mt-5 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-3 font-semibold">
                      No.
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      科目名
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      単位数
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      成績
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      取得状況
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      修得単位数
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {result.courses.map((course, index) => (
                    <tr
                      key={course.id}
                      className={`border-t border-border ${
                        course.status === '要確認' ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      {/* 連番 */}
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {index + 1}
                      </td>

                      {/* 科目名 */}
                      <td className="min-w-[260px] px-3 py-3">
                        <input
                          type="text"
                          value={course.courseName}
                          aria-label={`${course.courseName}の科目名`}
                          onChange={(event) =>
                            updateCourse(course.id, {
                              courseName: event.target.value,
                            })
                          }
                          className="w-full rounded-md border border-border bg-background px-2 py-2"
                        />

                        {course.note && (
                          <p className="mt-1 text-xs text-amber-700">
                            {course.note}
                          </p>
                        )}
                      </td>

                      {/* 単位数 */}
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={course.credits ?? ''}
                          aria-label={`${course.courseName}の単位数`}
                          onChange={(event) =>
                            handleCreditsChange(
                              course,
                              event.target.value
                            )
                          }
                          className="w-20 rounded-md border border-border bg-background px-2 py-2"
                        />
                      </td>

                      {/* 成績 */}
                      <td className="px-3 py-3">
                        <select
                          value={course.grade ?? ''}
                          aria-label={`${course.courseName}の成績`}
                          onChange={(event) =>
                            handleGradeChange(
                              course,
                              event.target.value
                            )
                          }
                          className="rounded-md border border-border bg-background px-2 py-2"
                        >
                          <option value="">
                            未読取
                          </option>

                          {GRADES.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 取得状況 */}
                      <td className="px-3 py-3">
                        <select
                          value={course.status}
                          aria-label={`${course.courseName}の取得状況`}
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

                      {/* 修得単位数 */}
                      <td className="px-3 py-3 font-medium">
                        {course.status === '修得済み' &&
                        course.credits !== null
                          ? `${course.credits} 単位`
                          : '0 単位'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
              科目情報を特定できませんでした。元の抽出文字列を確認してください。
            </p>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            ※ 事前の科目マスターやデータベースを使わず、PDF内の文字列パターンから自動で科目を抽出しています。
            読み取れなかった項目（要確認）は表内で直接修正できます。
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
                科目情報が正しく読み取れていない場合は、こちらを確認してください。
              </p>
            </div>

            {/* コピー機能 */}
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

          {/* 元の抽出文字列を表示 */}
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