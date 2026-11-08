import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// 環境変数 DATABASE_URL を使用してコネクションプールを作成
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// 評価割合テキストを { name, percentage } 配列にパースする補助関数
function parseEvaluation(evalText: string | null): { name: string; percentage: number }[] {
  if (!evalText) return [{ name: '総合評価', percentage: 100 }]

  const matches = Array.from(evalText.matchAll(/■?\s*([^：:\d%]+)[：:]\s*(\d+)\s*%/g))

  if (matches.length === 0) {
    return [{ name: '評価割合', percentage: 100 }]
  }

  return matches.map((m) => ({
    name: m[1].trim(),
    percentage: parseInt(m[2], 10),
  }))
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL が .env に設定されていません。' },
      { status: 500 },
    )
  }

  try {
    // syllabus_documents テーブルから一覧を直接取得 (vector カラムは除外)
    const query = `
      SELECT
        id,
        course_id,
        title,
        instructor,
        course_type,
        category_type,
        credits,
        year_level,
        academic_year,
        semester,
        evaluation,
        has_textbook,
        url,
        summary
      FROM public.syllabus_documents
      ORDER BY created_at ASC
      LIMIT 5;
    `

    const { rows } = await pool.query(query)

    // DB構造から ChatInterface の Course 型へマッピング
    const courses = rows.map((row) => {
      const year = parseInt(row.year_level?.replace(/[^0-9]/g, '') || '1', 10)
      const credits = parseInt(row.credits || '2', 10)
      const openingYear = parseInt(row.academic_year || '2026', 10)

      return {
        id: row.course_id || row.id,
        name: row.title,
        teacher: row.instructor || '未定',
        laboratory: undefined,
        courseType: row.course_type || '講義',
        requirement: row.category_type || '卒業要件内',
        credits: isNaN(credits) ? 2 : credits,
        year: isNaN(year) ? 1 : year,
        openingYear: isNaN(openingYear) ? 2026 : openingYear,
        semester: row.semester || '前期',
        evaluation: parseEvaluation(row.evaluation),
        textbook: Boolean(row.has_textbook),
        syllabusUrl: row.url,
        reason: 'No reason',
      }
    })

    return NextResponse.json({ courses })
  } catch (err: any) {
    console.error('Direct Connection Error:', err)
    return NextResponse.json(
      { error: err.message || 'データベース直接接続によるデータ取得に失敗しました。' },
      { status: 500 },
    )
  }
}