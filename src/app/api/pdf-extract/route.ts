import { NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'PDFファイルを選択してください。' },
        { status: 400 }
      )
    }

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      return NextResponse.json(
        { error: 'PDFファイルを選択してください。' },
        { status: 400 }
      )
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズは10MB以下にしてください。' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await pdfParse(buffer)

    return NextResponse.json({
      text: result.text,
      pages: result.numpages,
      fileName: file.name,
    })
  } catch (error) {
    console.error('PDF解析エラー:', error)

    return NextResponse.json(
      {
        error:
          'PDFの読み取りに失敗しました。ファイルが破損していないか確認してください。',
      },
      { status: 500 }
    )
  }
}