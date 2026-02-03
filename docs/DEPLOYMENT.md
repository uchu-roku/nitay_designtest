# デプロイガイド

## 問題: 行政区域・河川・森林簿データが表示されない

### 原因
1. **大きなファイルサイズ**: データファイルが大きすぎてGitHubに正しくアップロードされていない
   - `N03-20250101_01.geojson`: 47MB
   - `rivers_simple.geojson`: 25MB
   - `forest_registry.geojson`: 7.6MB

2. **相対パスの問題**: デプロイ環境でファイルパスが正しく解決されない

### 解決方法

#### オプション1: Git LFS（推奨）

Git LFS（Large File Storage）を使用して大きなファイルを管理します。

```bash
# Git LFSをインストール
# Windows: https://git-lfs.github.com/ からダウンロード
# Mac: brew install git-lfs
# Linux: sudo apt-get install git-lfs

# Git LFSを初期化
git lfs install

# 既存のファイルをLFSに移行
git lfs migrate import --include="*.geojson,*.gpkg"

# コミットしてプッシュ
git add .
git commit -m "Add data files with Git LFS"
git push
```

**注意**: デプロイ先のサービスがGit LFSをサポートしているか確認してください。
- Render: サポート
- Railway: サポート
- Vercel: 制限あり
- Netlify: 制限あり

#### オプション2: 外部ストレージ（本番環境推奨）

大きなデータファイルを外部ストレージに配置し、起動時にダウンロードします。

1. **データファイルをクラウドストレージにアップロード**
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage
   - または公開可能なURL

2. **起動スクリプトを作成**

```python
# backend/download_data.py
import os
import requests
from pathlib import Path

DATA_URLS = {
    "admin_simple.geojson": "https://your-storage.com/admin_simple.geojson",
    "rivers_simple.geojson": "https://your-storage.com/rivers_simple.geojson",
    "forest_registry.geojson": "https://your-storage.com/forest_registry.geojson",
}

def download_data():
    base_dir = Path(__file__).parent / "data" / "administrative"
    
    for filename, url in DATA_URLS.items():
        filepath = base_dir / filename
        if not filepath.exists():
            print(f"Downloading {filename}...")
            response = requests.get(url)
            filepath.parent.mkdir(parents=True, exist_ok=True)
            filepath.write_bytes(response.content)
            print(f"Downloaded {filename}")

if __name__ == "__main__":
    download_data()
```

3. **.gitignoreに追加**
```
backend/data/administrative/*.geojson
backend/data/administrative/**/*.geojson
backend/data/administrative/**/*.gpkg
```

4. **起動時に実行**
```bash
python backend/download_data.py
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

#### オプション3: データファイルを簡略化

データファイルをさらに簡略化してサイズを削減します。

```bash
# backend/simplify_admin.py を実行
python backend/simplify_admin.py
```

### デプロイ先別の設定

#### Render
1. Git LFSをサポート
2. 環境変数でデータパスを設定可能
3. Build Command: `pip install -r backend/requirements.txt`
4. Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Railway
1. Git LFSをサポート
2. 自動的にPythonプロジェクトを検出
3. Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Vercel（フロントエンドのみ推奨）
- バックエンドは別サービスにデプロイ
- フロントエンドのみVercelにデプロイ
- 環境変数で`VITE_API_URL`を設定

### トラブルシューティング

#### データファイルが見つからない
```bash
# サーバーログを確認
# "行政区域データが見つかりません" などのエラーメッセージを確認

# ファイルパスを確認
ls -la backend/data/administrative/
```

#### CORS エラー
- `backend/main.py`のCORS設定を確認
- デプロイ先のドメインを`allow_origins`に追加

#### メモリ不足
- 大きなGeoJSONファイルの読み込みでメモリ不足になる場合
- データファイルをさらに簡略化
- または、タイルサーバー（Mapbox、MapTiler）を使用
