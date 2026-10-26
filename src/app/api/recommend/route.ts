import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { GoogleGenAI } from '@google/genai'

// DB 接続プール
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// Gemini クライアントの初期化
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

export async function POST(request: Request) {
  try {
    const { queryText } = await request.json()

    if (!queryText || typeof queryText !== 'string') {
      return NextResponse.json(
        { error: '検索テキスト (queryText) が指定されていません。' },
        { status: 400 },
      )
    }

    // 1. 入力文を models/gemini-embedding-001 で 768次元ベクトルに変換
    const embedResponse = await ai.models.embedContent({
      model: 'models/gemini-embedding-001',
      contents: [queryText],
    })

    const embedding = embedResponse.embedding?.values
    if (!embedding) {
      throw new Error('Embedding の生成に失敗しました。')
    }

    // 2. pgvector コサイン類似度検索を実行
    // pg パッケージへは vector 配列を文字列 '[0.1, 0.2, ...]' 形式で渡します
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

    // 3. UI (Course 型) に合わせたフォーマット変換
    const courses = rows.map((row) => ({
      id: row.course_id || row.id,
      name: row.title,
      teacher: row.instructor || '未定',
      laboratory: undefined,
      courseType: row.course_type || '講義',
      requirement: row.category_type || '卒業要件内',
      credits: parseInt(row.credits || '2', 10),
      year: parseInt(row.year_level?.replace(/[^0-9]/g, '') || '1', 10),
      openingYear: parseInt(row.academic_year || '2026', 10),
      semester: row.semester || '前期',
      evaluation: row.evaluation ? [{ name: '評価割合', percentage: 100 }] : [],
      textbook: Boolean(row.has_textbook),
      syllabusUrl: row.url,
      reason: 'No reason', // 現フェーズでは固定、次フェーズで Gemini 生成に置き換え
      similarity: row.similarity, // デバッグ確認用類似度
    }))

    return NextResponse.json({ courses })
  } catch (err: any) {
    console.error('Vector Search Error:', err)
    return NextResponse.json(
      { error: err.message || 'ベクトル類似度検索に失敗しました。' },
      { status: 500 },
    )
  }
}