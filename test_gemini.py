import os
from dotenv import load_dotenv
from google.genai import types
from google import genai

#config
skiptest1 = True # テスト1をスキップ
skiptest2 = True # テスト2をスキップ
verbose = True # テストの詳細を表示

# .env から環境変数を読み込み
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("エラー: .env に GEMINI_API_KEY が設定されていません。")
    exit(1)

# クライアントの初期化
client = genai.Client(api_key=GEMINI_API_KEY)

print("--- [ AI-01: Gemini API 接続テスト開始 (google-genai) ] ---")

try:
    # 1. テキスト生成テスト
    if skiptest1 != True:
        print("1. テキスト生成テスト中...")
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite", # ユーザー対話用モデルを指定
            contents="「Gemini APIの接続テストに成功しました。」と1文で返答してください。"
        )
        if verbose == True:
            print(response)
            print()
        print(f"   => 応答内容: {response.text.strip()}")
    else:
        print("テスト1をスキップしました。")

    # 2. Embedding (ベクトル化) テスト
    if skiptest2 != True:
        print("\n2. Embedding (ベクトル化) テスト中...")
        embed_result = client.models.embed_content(
            model="models/gemini-embedding-001", # embed model
            contents="ここにベクトル化したいテキストを入力します。",
            config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY",output_dimensionality=768),
        )
        if verbose == True:
            print(embed_result)
            print()
        dimensions = len(embed_result.embeddings[0].values)
        print(f"   => ベクトル化成功: {dimensions}次元の配列を取得しました。")
    else:
        print("テスト2をスキップしました。")

    print("\n【結果】 すべての接続テストに成功しました！")

except Exception as e:
    print(f"\n【エラー発生】: {e}")