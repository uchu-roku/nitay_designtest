# GitHubへのアップロードとデプロイ手順

## ステップ1: Git LFSのセットアップ（推奨）

大きなデータファイル（47MB、25MB）をGitHubで管理するため、Git LFSを使用します。

### Windows
```powershell
# Git LFSをダウンロードしてインストール
# https://git-lfs.github.com/

# インストール後、PowerShellで実行
git lfs install
```

### Mac
```bash
brew install git-lfs
git lfs install
```

### Linux
```bash
sudo apt-get install git-lfs
git lfs install
```

## ステップ2: リポジトリの初期化

```bash
# Gitリポジトリを初期化（まだの場合）
git init

# Git LFSでトラッキングするファイルを設定
git lfs track "*.geojson"
git lfs track "*.gpkg"

# .gitattributesをコミット
git add .gitattributes
git commit -m "Add Git LFS configuration"

# すべてのファイルを追加
git add .
git commit -m "Initial commit with data files"
```

## ステップ3: GitHubにプッシュ

```bash
# GitHubでリポジトリを作成後
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## ステップ4: データファイルの確認

GitHubにプッシュ後、以下を確認：

1. リポジトリのファイルサイズを確認
2. `.geojson`ファイルが「Stored with Git LFS」と表示されているか確認
3. ファイルをクリックして内容が表示されるか確認

## ステップ5: デプロイ

### オプションA: Render（推奨）

1. [Render](https://render.com)にサインアップ
2. 「New +」→「Web Service」を選択
3. GitHubリポジトリを接続
4. 設定:
   - **Name**: `timber-volume-api`（任意）
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free（または有料プラン）

5. 環境変数を設定（必要に応じて）:
   - `PYTHON_VERSION`: `3.11`

6. 「Create Web Service」をクリック

7. デプロイ完了後、URLをコピー（例: `https://timber-volume-api.onrender.com`）

### オプションB: Railway

1. [Railway](https://railway.app)にサインアップ
2. 「New Project」→「Deploy from GitHub repo」
3. リポジトリを選択
4. 自動的にPythonプロジェクトを検出
5. 環境変数を設定:
   - `PORT`: `8000`
6. Start Commandを設定: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

### フロントエンドのデプロイ（Vercel）

1. [Vercel](https://vercel.com)にサインアップ
2. 「New Project」→GitHubリポジトリを選択
3. 設定:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **重要**: 環境変数を設定:
   - Variable Name: `VITE_API_URL`
   - Value: RenderのバックエンドURL（例: `https://timber-volume-api.onrender.com`）
   - ⚠️ 末尾のスラッシュ（/）は不要です

5. 「Deploy」をクリック

6. デプロイ後、ブラウザのコンソール（F12）でエラーを確認:
   - CORSエラーが出る場合 → バックエンドのCORS設定を確認
   - 404エラーが出る場合 → `VITE_API_URL`が正しく設定されているか確認

## トラブルシューティング

### データファイルが表示されない

```bash
# ローカルでデータファイルを確認
python backend/download_data.py

# Git LFSファイルを確認
git lfs ls-files

# Git LFSファイルを再プル
git lfs pull
```

### デプロイ先でファイルが見つからない

1. デプロイログを確認
2. ファイルパスが正しいか確認
3. Git LFSがサポートされているか確認

### メモリ不足エラー

大きなGeoJSONファイルでメモリ不足になる場合:

1. より小さいインスタンスタイプを選択
2. データファイルをさらに簡略化
3. または、外部ストレージを使用（DEPLOYMENT.mdを参照）

## 代替案: Git LFSを使わない方法

Git LFSを使いたくない場合:

1. データファイルを`.gitignore`に追加
2. 外部ストレージ（S3、GCS）にアップロード
3. `backend/download_data.py`を修正して起動時にダウンロード
4. 環境変数でURLを設定

詳細は`DEPLOYMENT.md`を参照してください。
