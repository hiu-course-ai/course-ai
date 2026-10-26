import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { GoogleGenAI } from '@google/genai'

// PostgreSQL 接続プール (Direct Connection)
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

export async function POST(request: Request) {
  try {
    const { queryText } = await request.json()

    if (!queryText || typeof queryText !== 'string') {
      return NextResponse.json(
        { error: '検索テキスト (queryText) が指定されていません。' },
        { status: 400 },
      )
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY が環境変数に設定されていません。' },
        { status: 500 },
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    // 1. 入力文を models/gemini-embedding-001 で 768次元ベクトルに変換
    const embedResponse = await ai.models.embedContent({
      model: 'models/gemini-embedding-001',
      contents: queryText,
      config: {
        outputDimensionality: 768, // 次元数を 768 に固定
      },
    })

    // SDKのレスポンス構造に合わせて安全に抽出 (単数形または配列構造に対応)
    const embedding =
      embedResponse.embedding?.values ||
      embedResponse.embeddings?.[0]?.values

    console.log('Embedding vector length:', embedding ? embedding.length : 'NULL/UNDEFINED')

    if (!embedding || embedding.length === 0) {
      throw new Error('Embedding のベクトル抽出に失敗しました (undefined または 0件)。')
    }

    // 2. pgvector コサイン類似度検索を実行
    const vectorString = JSON.stringify(embedding)
    const limit = 5

    const sql = `
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
        summary,
        1 - (embedding <=> $1::vector) AS similarity
      FROM public.syllabus_documents
      ORDER BY embedding <=> $1::vector ASC
      LIMIT $2;
    `

    const { rows } = await pool.query(sql, [vectorString, limit])

    console.log('Raw similarities from DB:', rows.map(r => r.similarity))

    // 3. UI (Course 型) に合わせたフォーマット変換
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
        reason: 'No reason', // 現段階では固定。次ステップで Gemini 理由生成に置き換え
        similarity: typeof row.similarity === 'number' ? row.similarity : parseFloat(row.similarity),
      }
    })

    return NextResponse.json({ courses })
  } catch (err: any) {
    console.error('Vector Search Error:', err)
    return NextResponse.json(
      { error: err.message || 'ベクトル類似度検索に失敗しました。' },
      { status: 500 },
    )
  }
}