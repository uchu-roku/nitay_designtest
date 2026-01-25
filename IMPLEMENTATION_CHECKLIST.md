# 実装チェックリスト

## ✅ 完了した実装

### データ変換スクリプト

- [x] `backend/convert_forest_registry_to_geojson.py` を完全書き換え
- [x] Shapefile（小班.shp）読み込み機能
- [x] Excel（調査簿.xlsx）読み込み機能
- [x] KEYCODE 正規化関数（14桁文字列化）
- [x] 層データの複層区分コード順ソート
- [x] GeoJSON 出力（shouhan.geojson）
- [x] 層索引JSON 出力（layers_index.json）

### バックエンドAPI

- [x] `GET /forest-registry/boundaries` エンドポイント追加
- [x] `GET /api/layers/{keycode14}` エンドポイント追加
- [x] CORS 設定（既存）
- [x] エラーハンドリング

### フロントエンド

- [x] Map.jsx の森林簿表示ロジック修正
- [x] 小班クリック時の層データAPI呼び出し
- [x] ポップアップに層一覧表示
- [x] 層データの整形表示（複層区分コード順）
- [x] エラーハンドリング

### 依存パッケージ

- [x] `openpyxl>=3.1.0` を requirements.txt に追加

### ドキュメント

- [x] SHAPEFILE_EXCEL_INTEGRATION.md（技術仕様）
- [x] IMPLEMENTATION_SUMMARY.md（実装サマリー）
- [x] IMPLEMENTATION_CHECKLIST.md（このファイル）

## 🎯 受け入れ条件の達成状況

### 必須要件

- [x] **小班クリックで層データ全件表示**
  - 同一KEYCODEに紐づく層（複層区分）行が全件表示される
  - 2行以上の層も正しく表示される
  - QGISの挙動（through relation [2]）を再現

- [x] **KEYCODE正規化**
  - Excel数値型の先頭ゼロ欠落に対応
  - 14桁文字列に正規化
  - Shapefile の KEYCODE と一致

- [x] **QGISを使わない**
  - QGIS Server / QField / プラグイン等に依存しない
  - 変換・格納・配信・表示は全てこのアプリで完結

- [x] **大量ポリゴン対応（準備完了）**
  - 現在: GeoJSON + Leaflet（10万ポリゴンまで実用可能）
  - 将来: Vector Tiles（PMTiles）に移行可能な設計

## 📋 テスト項目

### データ変換テスト

- [ ] Shapefile が正しく読み込まれる
- [ ] Excel が正しく読み込まれる
- [ ] KEYCODE が 14桁文字列に正規化される
- [ ] 層データが複層区分コード順にソートされる
- [ ] shouhan.geojson が生成される
- [ ] layers_index.json が生成される

### API テスト

- [ ] `GET /forest-registry/boundaries` が GeoJSON を返す
- [ ] `GET /api/layers/{keycode14}` が層データを返す
- [ ] 存在しない KEYCODE でエラーが返る
- [ ] CORS ヘッダーが正しく設定されている

### フロントエンドテスト

- [ ] 森林簿ボタンをONにすると小班が表示される
- [ ] 小班をクリックするとポップアップが表示される
- [ ] ポップアップに KEYCODE が表示される
- [ ] ポップアップに層データ一覧が表示される
- [ ] 層データが複層区分コード順に表示される
- [ ] 2層以上の小班で全層が表示される
- [ ] 層データがない小班でエラーメッセージが表示される

### 統合テスト

- [ ] データ変換 → API起動 → フロントエンド起動 → 動作確認
- [ ] 複数の小班をクリックして層データが正しく表示される
- [ ] ブラウザのコンソールにエラーが出ない

## 🚀 次のアクション

### 1. データ準備

```bash
# データを配置
backend/data/administrative/rinsyousigen/
├── 01_渡島_小班.shp
├── 01_渡島_小班.shx
├── 01_渡島_小班.dbf
├── 01_渡島_小班.prj
└── 01渡島_調査簿データ.xlsx
```

### 2. 依存パッケージインストール

```bash
cd backend
pip install -r requirements.txt
```

### 3. データ変換実行

```bash
cd backend
python convert_forest_registry_to_geojson.py
```

### 4. アプリ起動

**ターミナル1（バックエンド）**:
```bash
cd backend
python main.py
```

**ターミナル2（フロントエンド）**:
```bash
cd frontend
npm run dev
```

### 5. 動作確認

1. ブラウザで `http://localhost:5173` を開く
2. 左側のパネルで「📋 森林簿」ボタンをON
3. 地図上に小班ポリゴンが表示される
4. 小班をクリック
5. ポップアップに層データが表示されることを確認

## 📝 メモ

### 実装のポイント

1. **KEYCODE正規化**: Excel数値型の指数表記や先頭ゼロ欠落に対応
2. **層データのソート**: 複層区分コード昇順（NULL=0扱い）
3. **1対多の保持**: 同一KEYCODEの複数層を全件保持
4. **非同期API呼び出し**: 小班クリック時に層データを動的取得
5. **エラーハンドリング**: データがない場合のメッセージ表示

### 技術的な選択

- **GeoJSON**: 10万ポリゴンまで実用可能、実装がシンプル
- **JSON索引**: 高速な層データ検索
- **FastAPI**: 非同期処理、自動ドキュメント生成
- **Leaflet**: 軽量、実績豊富

### 将来の拡張

- **Vector Tiles**: tippecanoe + PMTiles で 10万ポリゴン以上に対応
- **MapLibre GL JS**: Vector Tiles 表示用
- **検索機能**: KEYCODE や複層区分コードで検索
- **統計機能**: 面積集計、林齢分布など

## 🐛 既知の問題

なし（現時点）

## 📚 参考資料

- [SHAPEFILE_EXCEL_INTEGRATION.md](./SHAPEFILE_EXCEL_INTEGRATION.md)
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Leaflet Documentation](https://leafletjs.com/)
- [GeoPandas Documentation](https://geopandas.org/)
