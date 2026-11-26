'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const callbackError = searchParams.get('error')

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setErrorMessage(`ログインの開始に失敗しました: ${error.message}`)
        setIsLoading(false)
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '予期せぬエラーが発生しました。'
      setErrorMessage(message)
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* 左側：ロゴ・キャッチコピー */}
        <section className="flex flex-col items-center justify-center text-center">
          {/* ロゴアイコン */}
          <div className="mb-5">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M60 10L105 35L60 60L15 35L60 10Z"
                stroke="#17365D"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <path
                d="M15 50L60 75L105 50"
                stroke="#17365D"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 70L60 95L105 70"
                stroke="#17365D"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* サービス名 */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#17365D]">
            HIU course <span className="text-[#2674D9]">AI</span>
          </h1>

          {/* 装飾 */}
          <div className="flex items-center gap-5 mt-8 mb-5">
            <div className="w-20 h-px bg-gray-300" />

            <svg
              width="38"
              height="38"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 4L37 13L20 22L3 13L20 4Z"
                stroke="#334155"
                strokeWidth="2.5"
              />
              <path
                d="M9 17V26L20 33L31 26V17"
                stroke="#334155"
                strokeWidth="2.5"
              />
            </svg>

            <div className="w-20 h-px bg-gray-300" />
          </div>

          {/* キャッチコピー */}
          <p className="text-lg md:text-2xl text-gray-600 font-medium">
            あなたの履修を、もっとスマートに。
          </p>
        </section>

        {/* 右側：ログインカード */}
        <section className="w-full max-w-xl mx-auto">
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-[0_8px_35px_rgba(30,64,120,0.12)] px-7 py-10 md:px-12 md:py-12">
            {/* タイトル */}
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ログイン
            </h2>

            {/* 説明 */}
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10">
              HIU course AIにログインして、
              <br />
              あなたの履修を始めましょう。
            </p>

            {/* エラー表示（認証失敗時・コールバックエラー時） */}
            {(errorMessage || callbackError) && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage ||
                  '認証処理中にエラーが発生しました。時間をおいて再度お試しください。'}
              </div>
            )}

            {/* Googleログインボタン */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-4
                border border-gray-300 rounded-xl
                py-4 px-5
                text-gray-800 font-semibold text-lg
                hover:bg-gray-50 hover:border-gray-400
                active:scale-[0.99]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white
                transition-all duration-200
              "
            >
              {/* Googleロゴ */}
              <svg
                width="25"
                height="25"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.2 13.22l7.98 6.19C13.07 13.72 18.13 9.5 24 9.5Z"
                  transform="translate(0 4)"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.24 5.48-4.7 7.17l7.27 5.64c4.25-3.92 7.47-9.7 7.47-17.28Z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.18 28.59c-.48-1.44-.76-2.98-.76-4.59s.28-3.15.76-4.59L2.2 13.22C.8 16.48 0 20.13 0 24s.8 7.52 2.2 10.78l7.98-6.19Z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.91-5.78l-7.27-5.64c-2.02 1.36-4.6 2.17-8.64 2.17-5.87 0-10.93-4.22-12.82-9.91L3.2 35.03C6.51 42.62 14.62 48 24 48Z"
                />
              </svg>

              <span>
                {isLoading
                  ? 'Google認証画面へ移動中...'
                  : 'Googleアカウントでログイン'}
              </span>
            </button>

            {/* 補足説明 */}
            <div className="mt-7 text-center">
              <p className="text-sm text-gray-500">
                Googleアカウントを使用してログインします。
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-sm text-gray-500">読み込み中...</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  )
}