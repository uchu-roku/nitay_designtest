# 古いデータの削除

## 削除対象

### kitamirinsyou フォルダ

`backend/data/administrative/kitamirinsyou/` フォルダは、初期のテスト用データ（北見林業のデータ）で、現在は使用されていません。

**削除して問題ありません。**

### 現在使用中のデータ

- `backend/data/administrative/rinsyousigen/` - **渡島のデータ（現在使用中）**
  - `01_渡島_小班.shp` - Shapefile
  - `01渡島_調査簿データ.xlsx` - Excel調査簿
  - `森林調査簿コード.xlsx` - コードマスタ
  - `shouhan.geojson` - 変換後のGeoJSON
  - `layers_index.json` - 層索引JSON

## 削除手順

### 1. kitamirinsyou フォルダを削除

```bash
# Windows
rmdir /s /q backend\data\administrative\kitamirinsyou

# または、エクスプローラーで削除
```

### 2. 古いスクリプトの処理（オプション）

以下のスクリプトも古いテスト用で、現在は使用されていません：

- `backend/analyze_forest_data.py` - kitamirinsyouデータの分析スクリプト
- `backend/download_data.py` - データダウンロードスクリプト

**削除するか、コメントアウトすることをお勧めします。**

## 参照箇所の確認

### analyze_forest_data.py

```python
# 古いテスト用スクリプト
with open('backend/data/administrative/kitamirinsyou/forest_registry.geojson', encoding='utf-8') as f:
    data = json.load(f)
```

→ **使用されていません。削除可能。**

### download_data.py

```python
required_files = {
    "forest_registry.geojson": base_dir / "kitamirinsyou" / "forest_registry.geojson",
}
```

→ **使用されていません。削除可能。**

## 現在のシステム構成

### データフロー

```
Shapefile + Excel (rinsyousigen/)
  ↓
convert_forest_registry_to_geojson.py
  ↓
shouhan.geojson + layers_index.json (rinsyousigen/)
  ↓
FastAPI (main.py)
  ↓
フロントエンド (Map.jsx)
```

### 使用中のファイル

**バックエンド**:
- `backend/convert_forest_registry_to_geojson.py` - データ変換スクリプト
- `backend/main.py` - FastAPI サーバー
- `backend/services/` - サービスクラス

**フロントエンド**:
- `frontend/src/Map.jsx` - 地図表示
- `frontend/src/App.jsx` - アプリケーション

**データ**:
- `backend/data/administrative/rinsyousigen/` - 渡島のデータ（使用中）
- `backend/data/administrative/admin_simple.geojson` - 行政区域
- `backend/data/administrative/kasen/` - 河川データ

## 削除後の確認

### 1. アプリケーションが正常に動作するか確認

```bash
# バックエンド起動
cd backend
python main.py

# フロントエンド起動
cd frontend
npm run dev
```

### 2. ブラウザで確認

- 森林簿ボタンをON
- 小班をクリック
- 層データが表示される

## まとめ

- ✅ `kitamirinsyou` フォルダは削除可能
- ✅ `analyze_forest_data.py` は削除可能
- ✅ `download_data.py` は削除可能
- ✅ 現在のシステムは `rinsyousigen` フォルダのみ使用

削除しても、現在のシステムには影響ありません。
