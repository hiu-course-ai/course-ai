export default function Home() {
  return (
    <div className="space-y-6">

      {/* ページタイトル */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          ホーム
        </h1>

        <p className="mt-2 text-muted-foreground">
          Kurikuruへようこそ。
        </p>
      </div>

      {/* メニュー */}
      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">
            履修済み科目
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            これまでに履修した科目を確認できます。
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">
            AI履修提案
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            あなたに合った授業をAIが提案します。
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">
            時間割
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            現在の時間割を確認できます。
          </p>
        </div>

      </div>

    </div>
  )
}