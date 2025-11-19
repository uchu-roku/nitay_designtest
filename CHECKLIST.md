# デプロイ前チェックリスト

## ✅ 完了した修正

- [x] フロントエンドのAPI URLをハードコードから環境変数に変更
- [x] バックエンドのファイルパスを相対パスから絶対パスに変更
- [x] .gitignore作成
- [x] .gitattributes作成（Git LFS設定）
- [x] 環境変数の例ファイル作成（.env.example）
- [x] データファイルチェックスクリプト作成
- [x] デプロイドキュメント作成

## 📋 次にやること

### 1. ローカルで動作確認

```bash
# バックエンドを起動
cd backend
python main.py

# 別のターミナルでフロントエンドを起動
cd frontend
npm run dev
```

ブラウザで http://localhost:5173 にアクセスして:
- [ ] 地図が表示される
- [ ] 「行政区域 ON」で境界線が表示される
- [ ] 「河川 ON」で河川が表示される
- [ ] 「森林簿 ON」で林班・小班が表示される
- [ ] 範囲を指定して「解析」ボタンをクリックできる

### 2. GitHubにプッシュ

```bash
# Git LFSをインストール（まだの場合）
git lfs install

# データファイルをトラッキング
git lfs track "*.geojson"
git lfs track "*.gpkg"

# すべての変更をコミット
git add .
git commit -m "Fix deployment configuration and add documentation"

# GitHubにプッシュ
git push origin main
```

### 3. GitHubで確認

- [ ] リポジトリにアクセス
- [ ] `backend/data/administrative/admin_simple.geojson`を開く
- [ ] 「Stored with Git LFS」と表示されているか確認
- [ ] ファイルサイズが正しく表示されているか確認

### 4. バックエンドをデプロイ（Render）

1. https://render.com にサインアップ/ログイン
2. 「New +」→「Web Service」
3. GitHubリポジトリを接続
4. 設定を入力:
   ```
   Name: timber-volume-api（任意）
   Environment: Python 3
   Build Command: pip install -r backend/requirements.txt
   Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. 「Create Web Service」をクリック
6. デプロイ完了を待つ（5-10分）
7. URLをコピー（例: `https://timber-volume-api.onrender.com`）

**確認**:
- [ ] デプロイが成功した（緑色のチェックマーク）
- [ ] ログにエラーがない
- [ ] URLにアクセスして `{"message":"材積予測API","version":"0.1.0-MVP"}` が表示される
- [ ] `https://your-url.onrender.com/administrative/boundaries` にアクセスしてGeoJSONが返ってくる

### 5. フロントエンドをデプロイ（Vercel）

1. https://vercel.com にサインアップ/ログイン
2. 「New Project」→GitHubリポジトリを選択
3. 設定を入力:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
4. **環境変数を追加**:
   ```
   Name: VITE_API_URL
   Value: https://timber-volume-api.onrender.com
   ```
   ⚠️ 末尾のスラッシュ（/）は付けない
   
5. 「Deploy」をクリック
6. デプロイ完了を待つ（2-3分）

**確認**:
- [ ] デプロイが成功した
- [ ] URLにアクセスして地図が表示される
- [ ] ブラウザのコンソール（F12）を開いてエラーがないか確認

### 6. 本番環境で動作確認

VercelのURLにアクセスして:
- [ ] 地図が表示される
- [ ] 「行政区域 ON」で境界線が表示される
- [ ] 「河川 ON」で河川が表示される
- [ ] 「森林簿 ON」で林班・小班が表示される
- [ ] 範囲を指定して「解析」ボタンをクリックできる
- [ ] 結果が表示される

## 🐛 トラブルシューティング

### データが表示されない

**ブラウザのコンソールを確認**（F12キー）:

1. **404 Not Found エラー**
   ```
   GET https://your-backend.onrender.com/administrative/boundaries 404
   ```
   → データファイルがバックエンドに存在しない
   → Renderのログを確認
   → Git LFSが正しく設定されているか確認

2. **CORS エラー**
   ```
   Access to fetch at '...' from origin '...' has been blocked by CORS policy
   ```
   → バックエンドのCORS設定を確認
   → `backend/main.py`の`allow_origins`を確認

3. **Failed to fetch**
   ```
   TypeError: Failed to fetch
   ```
   → `VITE_API_URL`が正しく設定されているか確認
   → Vercelの環境変数を確認
   → バックエンドが起動しているか確認

### Renderのログを確認する方法

1. Renderダッシュボード → サービスを選択
2. 「Logs」タブをクリック
3. エラーメッセージを探す:
   ```
   行政区域データが見つかりません
   ```
   → データファイルが存在しない

### データファイルが見つからない場合

```bash
# ローカルで確認
python backend/download_data.py

# Git LFSファイルを確認
git lfs ls-files

# Git LFSファイルを再プル
git lfs pull

# 再度コミット＆プッシュ
git add backend/data/
git commit -m "Re-add data files with Git LFS"
git push
```

## 📞 サポート

問題が解決しない場合、以下の情報を確認:
1. ブラウザのコンソールのスクリーンショット（F12）
2. Renderのログのスクリーンショット
3. Vercelの環境変数の設定
4. GitHubのファイルが「Stored with Git LFS」と表示されているか
