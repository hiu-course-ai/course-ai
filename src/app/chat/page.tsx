"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "こんにちは！履修について気になることがあれば、気軽に相談してください。",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setInput("");
    setIsLoading(true);

    // 現時点ではAI API未接続のため仮の返信
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "ご相談ありがとうございます。現在はチャットUIのテスト中です。AIとの接続は後ほど実装します。",
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <div className="border-b bg-white px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">履修相談AI</h1>
        <p className="mt-1 text-sm text-gray-500">
          履修科目・卒業要件について相談できます
        </p>
      </div>

      {/* チャット欄 */}
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-4 py-6">
        <div className="flex-1 space-y-5 overflow-y-auto rounded-2xl border bg-white p-6 shadow-sm">
          {messages.map((message, index) => {
            const isUser = message.role === "user";

            return (
              <div
                key={index}
                className={`flex items-end gap-3 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {/* AIアイコン */}
                {!isUser && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    AI
                  </div>
                )}

                {/* メッセージ */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? "rounded-br-md bg-blue-600 text-white"
                      : "rounded-bl-md bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

          {/* ローディング */}
          {isLoading && (
            <div className="flex items-end gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                AI
              </div>

              <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 text-sm text-gray-500">
                回答を生成中…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 入力欄 */}
      <div className="sticky bottom-0 border-t bg-white px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-4xl gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="履修について相談してください"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            送信
          </button>
        </form>
      </div>
    </main>
  );
}