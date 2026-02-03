# クイックスタート - デプロイ手順

## 現在の問題
「解析に失敗しました」エラーが出る原因：
1. ✅ フロントエンドが`localhost:8000`にハードコードされていた → **修正済み**
2. ⚠️ バックエンドAPIのURLが環境変数で設定されていない
3. ⚠️ データファイルがGitHubにアップロードされていない可能性

## 解決手順

### ステップ1: コードをGitHubにプッシュ

```bash
# 変更をコミット
git add .
git commit -m "Fix API URL configuration for deployment"
git push
```

### ステップ2: バックエンドをデプロイ（Render）

1. https://render.com にアクセス
2. 「New +」→「Web Service」
3. GitHubリポジトリを接続
4. 設定:
   ```
   Name: timber-volume-api
   Environment: Python 3
   Build Command: pip install -r backend/requirements.txt
   Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. 「Create Web Service」をクリック
6. デプロイ完了後、URLをコピー（例: `https://timber-volume-api.onrender.com`）

### ステップ3: フロントエンドをデプロイ（Vercel）

1. https://vercel.com にアクセス
2. 「New Project」→GitHubリポジトリを選択
3. 設定:
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

### ステップ4: 動作確認

1. Vercelのデプロイ完了後、URLにアクセス
2. ブラウザのコンソール（F12）を開く
3. 地図が表示されるか確認
4. 「行政区域 ON」ボタンをクリック
5. コンソールに以下のようなログが出るか確認:
   ```
   行政区域データを読み込みます
   行政区域データを読み込みました: XXX件
   ```

### トラブルシューティング

#### エラー: "行政区域データが見つかりません"

**原因**: データファイルがGitHubにアップロードされていない

**解決方法**:
```bash
# データファイルのサイズを確認
ls -lh backend/data/administrative/

# Git LFSをインストール
git lfs install

# データファイルをトラッキング
git lfs track "*.geojson"
git lfs track "*.gpkg"

# コミットしてプッシュ
git add .gitattributes
git add backend/data/
git commit -m "Add data files with Git LFS"
git push

# Renderで再デプロイ（自動的に実行される）
```

#### エラー: "Failed to fetch" または CORS エラー

**原因**: バックエンドURLが間違っているか、CORSが設定されていない

**解決方法**:
1. Vercelの環境変数を確認:
   - `VITE_API_URL`が正しく設定されているか
   - 末尾にスラッシュ（/）がないか確認
   
2. ブラウザのコンソールでAPIのURLを確認:
   ```javascript
   console.log(import.meta.env.VITE_API_URL)
   ```

3. バックエンドのCORS設定を確認（backend/main.py）:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # 本番環境では具体的なドメインを指定
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

#### エラー: "解析に失敗しました"

**原因**: バックエンドAPIにリクエストが届いていない

**解決方法**:
1. ブラウザのコンソール（F12）→「Network」タブを開く
2. 「解析」ボタンをクリック
3. `/analyze`リクエストを確認:
   - Status Code: 200 → 成功
   - Status Code: 404 → URLが間違っている
   - Status Code: 500 → バックエンドエラー
   - Failed → ネットワークエラー

4. Renderのログを確認:
   - Renderダッシュボード → サービス → 「Logs」タブ
   - エラーメッセージを確認

#### データファイルが大きすぎる（Git LFSなし）

**代替案**: 外部ストレージを使用

1. データファイルをGoogle Drive/Dropbox/S3にアップロード
2. 公開URLを取得
3. `backend/download_data.py`を修正:
   ```python
   DATA_URLS = {
       "admin_simple.geojson": "https://your-storage-url/admin_simple.geojson",
       "rivers_simple.geojson": "https://your-storage-url/rivers_simple.geojson",
       "forest_registry.geojson": "https://your-storage-url/forest_registry.geojson",
   }
   ```
4. Renderの「Build Command」を変更:
   ```
   pip install -r backend/requirements.txt && python backend/download_data.py
   ```

## 確認チェックリスト

- [ ] Git LFSをインストールした
- [ ] データファイルをGitにコミットした
- [ ] GitHubにプッシュした
- [ ] Renderでバックエンドをデプロイした
- [ ] バックエンドのURLをコピーした
- [ ] Vercelでフロントエンドをデプロイした
- [ ] `VITE_API_URL`環境変数を設定した
- [ ] ブラウザで動作確認した
- [ ] ブラウザのコンソールでエラーを確認した

## サポート

問題が解決しない場合:
1. ブラウザのコンソールのスクリーンショット
2. Renderのログのスクリーンショット
3. 設定した環境変数の値

を確認してください。
