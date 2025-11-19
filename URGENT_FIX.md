# 🚨 緊急対応：現在の問題と解決方法

## 現在の状況

❌ **GitHub Pagesではバックエンドが動作しません**

- GitHub Pages = 静的サイトのみ（HTML/CSS/JS）
- バックエンドAPI（Python/FastAPI）は動作しない
- そのため、行政区域・河川・森林簿データが取得できない

## 解決方法（3つの選択肢）

### 🎯 選択肢1: バックエンドをRenderにデプロイ（推奨・無料）

#### ステップ1: Renderでバックエンドをデプロイ

1. https://render.com にアクセス
2. GitHubアカウントでサインアップ
3. 「New +」→「Web Service」
4. リポジトリ `uchu-roku/zaisekiyosokuapp` を選択
5. 以下を設定:
   ```
   Name: timber-volume-api
   Environment: Python 3
   Build Command: pip install -r backend/requirements.txt
   Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
6. 「Create Web Service」をクリック
7. デプロイ完了後、URLをコピー（例: `https://timber-volume-api.onrender.com`）

#### ステップ2: GitHubにシークレットを設定

1. GitHubリポジトリ → Settings → Secrets and variables → Actions
2. 「New repository secret」をクリック
3. 設定:
   ```
   Name: VITE_API_URL
   Value: https://timber-volume-api.onrender.com
   ```
   ⚠️ 末尾のスラッシュ（/）は不要
4. 「Add secret」をクリック

#### ステップ3: 再デプロイ

```bash
git add .
git commit -m "Add Render deployment config"
git push
```

GitHub Actionsが自動的に実行され、新しいバックエンドURLでビルドされます。

---

### 🔧 選択肢2: すべてRenderにデプロイ（簡単）

GitHub Pagesを使わず、フロントエンドもRenderにデプロイ：

1. Renderで「Static Site」を作成
2. 設定:
   ```
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```
3. 環境変数を設定:
   ```
   VITE_API_URL: https://timber-volume-api.onrender.com
   ```

**メリット**: 設定が簡単、すべて1箇所で管理
**デメリット**: 無料プランでは2つのサービスが必要

---

### 💻 選択肢3: ローカルでバックエンドを起動（一時的）

デプロイせず、ローカルでテスト：

#### ステップ1: バックエンドを起動

```bash
cd backend
python main.py
```

別のターミナルで：

```bash
# ngrokをインストール（まだの場合）
# https://ngrok.com/download

# バックエンドを公開
ngrok http 8000
```

ngrokが表示するURL（例: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`）をコピー

#### ステップ2: GitHubシークレットを設定

1. GitHubリポジトリ → Settings → Secrets and variables → Actions
2. 「New repository secret」をクリック
3. 設定:
   ```
   Name: VITE_API_URL
   Value: https://xxxx-xx-xx-xx-xx.ngrok-free.app
   ```

#### ステップ3: 再デプロイ

```bash
git push
```

**注意**: ngrokのURLは一時的なので、バックエンドを再起動するたびに変わります。

---

## 📊 推奨フロー

```
┌─────────────────┐
│  GitHub Pages   │  ← フロントエンド（無料）
│  (静的サイト)    │
└────────┬────────┘
         │ API呼び出し
         ↓
┌─────────────────┐
│   Render.com    │  ← バックエンド（無料）
│  (Python/FastAPI)│
└─────────────────┘
```

## ⚡ 最速の解決方法

**今すぐ動かしたい場合**:

1. Renderでバックエンドをデプロイ（5分）
2. GitHubシークレットを設定（1分）
3. `git push`で再デプロイ（2分）

**合計: 約10分**

---

## 🔍 現在のエラーを確認する方法

1. ブラウザでサイトを開く: https://uchu-roku.github.io/zaisekiyosokuapp/
2. F12キーを押してコンソールを開く
3. 「行政区域 ON」ボタンをクリック
4. コンソールに表示されるエラーを確認:

```
Failed to fetch
GET http://localhost:8000/administrative/boundaries net::ERR_CONNECTION_REFUSED
```

これは、フロントエンドが`localhost:8000`に接続しようとしているが、
GitHub Pagesではlocalhostにアクセスできないためです。

---

## 📝 次のステップ

1. [ ] Renderでバックエンドをデプロイ
2. [ ] RenderのURLをコピー
3. [ ] GitHubシークレットに`VITE_API_URL`を設定
4. [ ] `git push`で再デプロイ
5. [ ] サイトにアクセスして動作確認

詳細な手順は`CHECKLIST.md`を参照してください。
