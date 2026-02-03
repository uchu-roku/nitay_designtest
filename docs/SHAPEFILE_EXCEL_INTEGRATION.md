# Shapefile + Excel 統合システム

## 概要

Shapefile（小班ポリゴン）と Excel（調査簿：層データ）を KEYCODE（14桁）で紐付けし、地図上で小班をクリックすると「小班基本情報＋複層区分（層）の全行一覧」を表示するシステムです。

## データ仕様

### 入力データ

**場所**: `backend/data/administrative/rinsyousigen/`

1. **Shapefile**: `01_渡島_小班.shp`
   - 属性に KEYCODE（14桁文字列）あり
   - ポリゴン数が多い（約10万規模）
   - CRS: JGD2011 / UTM zone 54N (EPSG:6690) → WGS84に自動変換

2. **Excel**: `01渡島_調査簿データ.xlsx`
   - KEYCODE（数値で先頭ゼロ欠落の可能性）
   - 複層区分コード（NULL or 1..4）
   - 面積、森林種類コード、林齢など
   - 同一KEYCODEに複数行（層）が存在

### KEYCODE正規化

Excel の KEYCODE は数値型で先頭ゼロが欠落している可能性があるため、必ず **14桁文字列** に正規化します。

```python
def normalize_keycode(val):
    if pd.isna(val):
        return None
    s = str(int(float(val))).strip()  # 指数表記回避
    return s.zfill(14)  # 14桁にゼロ埋め
```

### 出力データ

1. **shouhan.geojson**: 小班ポリゴン（KEYCODE含む）
2. **layers_index.json**: `{keycode14: [層行配列]}` の辞書
   - 層は複層区分コード昇順でソート
   - NULL は 0 扱い

## セットアップ手順

### 1. データ配置

```
backend/data/administrative/rinsyousigen/
├── 01_渡島_小班.shp
├── 01_渡島_小班.shx
├── 01_渡島_小班.dbf
├── 01_渡島_小班.prj
└── 01渡島_調査簿データ.xlsx
```

### 2. Python環境準備

```bash
cd backend
pip install geopandas pandas openpyxl
```

### 3. データ変換実行

```bash
cd backend
python convert_forest_registry_to_geojson.py
```

**出力**:
- `backend/data/administrative/rinsyousigen/shouhan.geojson`
- `backend/data/administrative/rinsyousigen/layers_index.json`

### 4. バックエンド起動

```bash
cd backend
python main.py
```

### 5. フロントエンド起動

```bash
cd frontend
npm install
npm run dev
```

## API仕様

### 1. 小班ポリゴン取得

```
GET /forest-registry/boundaries
```

**レスポンス**: GeoJSON（小班ポリゴン）

### 2. 層データ取得

```
GET /api/layers/{keycode14}
```

**パラメータ**:
- `keycode14`: 14桁のKEYCODE文字列

**レスポンス**:
```json
{
  "keycode": "01234567890123",
  "layer_count": 2,
  "layers": [
    {
      "KEYCODE": "01234567890123",
      "複層区分コード": "1",
      "面積": "10.5",
      "森林種類コード": "101",
      "林齢": "45"
    },
    {
      "KEYCODE": "01234567890123",
      "複層区分コード": "2",
      "面積": "10.5",
      "森林種類コード": "201",
      "林齢": "30"
    }
  ]
}
```

## 使い方

1. ブラウザで `http://localhost:5173` を開く
2. 左側のパネルで「📋 森林簿」ボタンをON
3. 地図上に小班ポリゴンが表示される
4. 小班をクリック
5. ポップアップに以下が表示される：
   - KEYCODE
   - 層データ一覧（複層区分コード順）
   - 各層の詳細（森林種類、林齢、面積）
   - 「まるごと解析」「範囲を指定」ボタン

## 技術スタック

- **バックエンド**: Python, FastAPI, geopandas, pandas
- **フロントエンド**: React, Leaflet
- **データ形式**: GeoJSON, JSON

## QGISとの違い

- QGISは一切使用しない
- すべてWebアプリ内で完結
- Vector Tiles（PMTiles）は今回未使用（将来的に10万ポリゴン対応時に導入）

## トラブルシューティング

### エラー: 小班GeoJSONが見つかりません

→ `python convert_forest_registry_to_geojson.py` を実行してください

### エラー: 層データ取得失敗

→ バックエンドAPIが起動しているか確認してください

### 小班が表示されない

→ ブラウザのコンソールでエラーを確認してください
→ CORS設定を確認してください

## 今後の拡張

- Vector Tiles（PMTiles）対応（10万ポリゴン高速化）
- tippecanoe による Vector Tiles 生成
- MapLibre GL JS への移行
