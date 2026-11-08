import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { GoogleGenAI, Type } from '@google/genai'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

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
        outputDimensionality: 768,
      },
    })

    const resAny = embedResponse as any
    const embedding: number[] | undefined =
      resAny.embedding?.values || embedResponse.embeddings?.[0]?.values

    if (!embedding || embedding.length === 0) {
      throw new Error('Embedding のベクトル抽出に失敗しました。')
    }

    // 2. pgvector コサイン類似度検索 (DBに存在するカラムのみSELECT)
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

    if (rows.length === 0) {
      return NextResponse.json({ courses: [] })
    }

    // 3. gemini-3.5-flash-lite による推薦理由の一括動的生成
    const courseSummaries = rows.map((r) => ({
      id: r.course_id || r.id,
      title: r.title,
      summary: r.summary || '概要なし',
    }))

    const prompt = `
あなたは大学の履修アドバイザーAIです。
学生の相談内容と、抽出された科目の概要をもとに、なぜその科目が学生の要望や関心に適しているのか、各科目につき100文字程度で分かりやすく具体的なおすすめ理由を作成してください。

【学生の相談内容】
${queryText}

【対象科目データ】
${JSON.stringify(courseSummaries, null, 2)}
`

    let reasonsMap: Record<string, string> = {}

    try {
      const reasonResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ['id', 'reason'],
            },
          },
        },
      })

      const reasonJsonText = reasonResponse.text
      if (reasonJsonText) {
        const parsedArray = JSON.parse(reasonJsonText) as { id: string; reason: string }[]
        parsedArray.forEach((item) => {
          reasonsMap[item.id] = item.reason
          //console.log("Reason for " + item.id + ": " + item.reason + "\n")
        })
      }
    } catch (genErr) {
      console.error('Failed to generate recommendation reasons:', genErr)
    }

    // 4. UI (Course 型) へのマッピング & 生成した理由の結合
    const courses = rows.map((row) => {
      const courseId = row.course_id || row.id
      const year = parseInt(row.year_level?.replace(/[^0-9]/g, '') || '1', 10)
      const credits = parseInt(row.credits || '2', 10)
      const openingYear = parseInt(row.academic_year || '2026', 10)

      return {
        id: courseId,
        name: row.title,
        teacher: row.instructor || '未定',
        laboratory: undefined,
        courseType: row.course_type || '講義',
        category: '', // DB上に category カラムが無いため空文字（必要に応じて '教養' 等に調整可能）
        requirement: row.category_type || '',
        credits: isNaN(credits) ? 2 : credits,
        year: isNaN(year) ? 1 : year,
        openingYear: isNaN(openingYear) ? 2026 : openingYear,
        semester: row.semester || '前期',
        evaluation: parseEvaluation(row.evaluation),
        textbook: Boolean(row.has_textbook),
        syllabusUrl: row.url,
        reason:
          reasonsMap[courseId] ||
          'あなたの相談文のテーマや意図とシラバス内容の関連度が高いため、おすすめ科目として算出されました。',
        similarity: typeof row.similarity === 'number' ? row.similarity : parseFloat(row.similarity),
      }
    })

    return NextResponse.json({ courses })
  } catch (err: any) {
    console.error('Vector Search or Reason Gen Error:', err)
    return NextResponse.json(
      { error: err.message || '処理に失敗しました。' },
      { status: 500 },
    )
  }
}