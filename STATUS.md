# 現在の状況と対応方法

## ❌ 現在の問題

**症状**: 
- 地図は表示される
- 「行政区域 ON」「河川 ON」「森林簿 ON」を押してもデータが表示されない
- 「解析に失敗しました」エラーが出る

**原因**:
```
GitHub Pages（静的サイト）にフロントエンドのみデプロイされている
↓
バックエンドAPI（Python/FastAPI）が動作していない
↓
データが取得できない
```

---

## ✅ 解決方法（3ステップ）

### ステップ1: バックエンドをRenderにデプロイ（5分）

https://render.com にアクセスして:

1. GitHubでサインアップ
2. 「New +」→「Web Service」
3. リポジトリ `uchu-roku/zaisekiyosokuapp` を選択
4. 設定:
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. 「Create Web Service」をクリック
6. URLをコピー（例: `https://timber-volume-api.onrender.com`）

### ステップ2: GitHubシークレットを設定（1分）

https://github.com/uchu-roku/zaisekiyosokuapp/settings/secrets/actions にアクセスして:

1. 「New repository secret」をクリック
2. 入力:
   - Name: `VITE_API_URL`
   - Secret: `https://timber-volume-api.onrender.com`（ステップ1のURL）
3. 「Add secret」をクリック

### ステップ3: 再デプロイ（2分）

```bash
git add .
git commit -m "Configure backend URL"
git push
```

GitHub Actionsが自動実行され、約2分後に完了します。

---

## 📖 詳細ガイド

- **最速ガイド**: `URGENT_FIX.md`
- **画像付き手順**: `RENDER_DEPLOY_GUIDE.md`
- **チェックリスト**: `CHECKLIST.md`

---

## 🔍 動作確認

1. https://uchu-roku.github.io/zaisekiyosokuapp/ にアクセス
2. F12キーでコンソールを開く
3. 「行政区域 ON」をクリック
4. コンソールに「行政区域データを読み込みました」と表示される
5. 地図に境界線が表示される

---

## ⏱️ 所要時間

- バックエンドデプロイ: 5分
- シークレット設定: 1分
- 再デプロイ: 2分
- **合計: 約10分**

---

## 💡 なぜこうなったか

GitHub Pagesは**静的サイト専用**で、以下しか動作しません:
- HTML
- CSS
- JavaScript

以下は動作しません:
- Python（バックエンド）
- データベース
- サーバーサイド処理

そのため、バックエンドは別のサービス（Render）にデプロイする必要があります。

---

## 📊 アーキテクチャ

### 現在（動作しない）
```
GitHub Pages
├── フロントエンド ✅
└── バックエンド ❌（動作しない）
```

### 修正後（動作する）
```
GitHub Pages          Render.com
├── フロントエンド ✅ → バックエンド ✅
                      ├── データファイル
                      └── API
```

---

## 🚀 今すぐ始める

1. https://render.com を開く
2. `RENDER_DEPLOY_GUIDE.md`を見ながら進める
3. 10分後に完成！
