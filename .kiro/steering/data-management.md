---
inclusion: always
---

# データ管理とGit LFSに関する重要な注意事項

## データファイルの管理方針

このプロジェクトでは**Git LFSを使用しません**。

### 理由
- Git LFSの管理が煩雑
- 大容量ファイルの取り扱いが複雑
- デプロイ時の問題を避けるため

### 現在の運用方法

1. **データファイルの分割**
   - 大きなGeoJSONファイルは分割して保存
   - 分割ファイルは `backend/data/administrative/rinsyousigen/split/` に配置
   - 例: `layers_01010.json`, `layers_01020.json` など

2. **起動時の統合**
   - バックエンドAPIが起動時に分割ファイルを読み込む
   - 必要に応じてメモリ上で統合
   - クライアントには統合されたデータを返す

3. **データファイルの配置**
   ```
   backend/data/administrative/
   ├── admin_simple.geojson          # 行政区域（簡略版）
   ├── kasen/
   │   └── rivers_simple.geojson     # 河川データ（簡略版）
   ├── keisya/
   │   └── slope_simple.geojson      # 傾斜図（簡略版）
   └── rinsyousigen/
       ├── shouhan_simple.geojson    # 小班ポリゴン（簡略版）
       └── split/
           ├── index.json            # 分割ファイルのインデックス
           ├── layers_01010.json     # 市町村コード別の層データ
           ├── layers_01020.json
           └── ...
   ```

## v0でコード修正する際の注意点

### 絶対にやってはいけないこと

❌ **Git LFSを導入するコードを書かない**
- `.gitattributes` にLFS設定を追加しない
- `git lfs track` コマンドを使用しない
- LFSポインタファイルを参照するコードを書かない

❌ **大きなファイルを直接GitHubにプッシュしようとしない**
- 100MB以上のファイルはGitHubの制限に引っかかる
- 分割されたファイルを使用する

### 推奨される実装パターン

✅ **分割ファイルからの読み込み**
```python
# backend/main.py の例
@app.get("/api/layers/{keycode14}")
async def get_layers(keycode14: str):
    base_dir = Path(__file__).parent
    split_dir = base_dir / "data" / "administrative" / "rinsyousigen" / "split"
    
    # 市町村コードから分割ファイルを特定
    muni_code = keycode14[:5]
    part_file = split_dir / f"layers_{muni_code}.json"
    
    if part_file.exists():
        with open(part_file, 'r', encoding='utf-8') as f:
            layers_index = json.load(f)
        
        if keycode14 in layers_index:
            return JSONResponse(content=layers_index[keycode14])
    
    raise HTTPException(status_code=404, detail="データが見つかりません")
```

✅ **簡略版ファイルの使用**
```python
# 大きなGeoJSONの代わりに簡略版を使用
geojson_path = base_dir / "data" / "administrative" / "shouhan_simple.geojson"
```

✅ **ストリーミング配信**
```python
# 大きなファイルはFileResponseで直接配信
from fastapi.responses import FileResponse

@app.get("/forest-registry/boundaries")
async def get_forest_registry():
    geojson_path = Path(__file__).parent / "data" / "administrative" / "rinsyousigen" / "shouhan_simple.geojson"
    
    return FileResponse(
        str(geojson_path),
        media_type="application/json",
        headers={"Cache-Control": "public, max-age=86400"}
    )
```

## デプロイ時の注意

### Render.com へのデプロイ
- データファイルはリポジトリに含める（分割済み）
- ビルド時に統合処理は不要
- 環境変数でAPIのURLを設定

### Vercel へのデプロイ
- フロントエンドのみ
- バックエンドAPIのURLを環境変数で設定
- `VITE_API_URL=https://your-backend.onrender.com`

## トラブルシューティング

### 「Object does not exist on the server」エラー
これはGit LFSのエラーです。以下を確認：
1. ファイルがLFSポインタになっていないか確認
   ```bash
   head -n 3 backend/data/administrative/rinsyousigen/shouhan_simple.geojson
   ```
2. もし `version https://git-lfs.github.com/spec/v1` と表示されたら、実データに置き換える

### ファイルサイズの確認
```bash
# PowerShell
Get-Item "backend/data/administrative/rinsyousigen/shouhan_simple.geojson" | Select-Object Name, Length

# 実データなら100MB以上のサイズが表示される
# LFSポインタなら数百バイト程度
```

## まとめ

- **Git LFSは使わない**
- **データは分割して管理**
- **バックエンドAPIで統合処理**
- **v0でコード修正時はこのルールを守る**
