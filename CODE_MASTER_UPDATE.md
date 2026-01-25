# コードマスタ統合アップデート

## 変更内容

森林調査簿コード.xlsx のコードマスタを使って、コード値を日本語名に変換して表示するようにしました。

## 追加された機能

### バックエンド

**convert_forest_registry_to_geojson.py**:
- `load_code_master()`: コードマスタExcelを読み込んで辞書化
- `enrich_layer_data()`: 層データにコードマスタから取得した日本語名を追加

**読み込まれるコードマスタ**:
- 森林の種類: 23件（普通林、水源かん養保安林、など）
- 林種: 6件（人工林、天然林、など）
- 樹種: 30件（トドマツ、エゾマツ、など）

**追加されるフィールド**:
- `森林の種類1名`: 森林の種類1コードに対応する日本語名
- `林種名`: 林種コードに対応する日本語名
- `樹種1名`: 樹種1コードに対応する日本語名

### フロントエンド

**Map.jsx**:
- ポップアップ表示を修正して、コード + 日本語名を表示
- 例: `15 (防風保安林)` のように表示

## 表示例

### 変更前
```
層1 (複層区分: 1)
森林種類: 15, 林齢: 71
面積: 1.91 ha
```

### 変更後
```
層1 (複層区分: 1)
森林種類: 15 (防風保安林)
林種: 1 (人工林)
樹種: 4 (トドマツ)
林齢: 71年
面積: 1.91 ha
```

## 確認手順

### 1. データ再変換

```bash
cd backend
python convert_forest_registry_to_geojson.py
```

**期待される出力**:
```
コードマスタを読み込み中...
  森林の種類コードを読み込み中...
  林種コードを読み込み中...
  樹種コードを読み込み中...
  ✓ 森林の種類: 23 件
  ✓ 林種: 6 件
  ✓ 樹種: 30 件
[1/5] Shapefile読み込み: ...
...
✅ 変換完了
```

### 2. ブラウザで確認

1. ブラウザをリロード（Ctrl+F5）
2. 森林簿ボタンをON
3. 小班をクリック
4. ポップアップに日本語名が表示されることを確認

## コードマスタの構造

### 森林の種類（23件）

| コード | 名前 |
|--------|------|
| 01 | 普通林 |
| 11 | 水源かん養保安林 |
| 12 | 土砂流出防備保安林 |
| 13 | 土砂崩壊防備保安林 |
| 14 | 飛砂防備保安林 |
| 15 | 防風保安林 |
| ... | ... |

### 林種（6件）

| コード | 名前 |
|--------|------|
| 1 | 人工林 |
| 2 | 天然林 |
| 3 | 天然生ぼう芽林 |
| 4 | 天然林伐採跡地 |
| 5 | 人工林伐採跡地 |
| 6 | 未立木地 |

### 樹種（30件）

| コード | 名前 |
|--------|------|
| 1 | カラマツ |
| 2 | グイマツ |
| 3 | グイマツ雑種F1 |
| 4 | トドマツ |
| 5 | エゾマツ |
| 6 | アカエゾマツ |
| ... | ... |

## 技術的な詳細

### コードマスタの読み込み

Excelファイルの「コード一覧」シートから、特定の行範囲を読み込んで辞書化します。

```python
# 森林の種類（行16-38）
for i in range(16, 39):
    code = df.iloc[i, 0]  # A列
    name = df.iloc[i, 5]  # F列
    code_masters['森林の種類'][code] = name

# 林種（行43-48）
for i in range(43, 49):
    code = df.iloc[i, 0]
    name = df.iloc[i, 5]
    code_masters['林種'][code] = name

# 樹種（行52-83）
for i in range(52, 84):
    code = df.iloc[i, 0]
    name = df.iloc[i, 5]
    code_masters['樹種'][code] = name
```

### 層データへの追加

各層データに対して、コードマスタから日本語名を検索して追加します。

```python
def enrich_layer_data(layer_dict, code_masters):
    # 森林の種類1コード
    if '森林の種類1コード' in layer_dict:
        code = str(layer_dict['森林の種類1コード']).strip()
        if code in code_masters['森林の種類']:
            layer_dict['森林の種類1名'] = code_masters['森林の種類'][code]
    
    # 林種コード
    if '林種コード' in layer_dict:
        code = str(layer_dict['林種コード']).strip()
        if code in code_masters['林種']:
            layer_dict['林種名'] = code_masters['林種'][code]
    
    # 樹種1コード
    if '樹種1コード' in layer_dict:
        code = str(layer_dict['樹種1コード']).strip()
        if code in code_masters['樹種']:
            layer_dict['樹種1名'] = code_masters['樹種'][code]
    
    return layer_dict
```

### フロントエンドでの表示

コード + 日本語名を組み合わせて表示します。

```javascript
// 森林の種類（コード + 名前）
const shinrinCode = layer['森林の種類1コード'] || 'N/A'
const shinrinName = layer['森林の種類1名'] || ''
const shinrin = shinrinName ? `${shinrinCode} (${shinrinName})` : shinrinCode

// 林種（コード + 名前）
const rinshuCode = layer['林種コード'] || 'N/A'
const rinshuName = layer['林種名'] || ''
const rinshu = rinshuName ? `${rinshuCode} (${rinshuName})` : rinshuCode

// 樹種（コード + 名前）
const jushuCode = layer['樹種1コード'] || 'N/A'
const jushuName = layer['樹種1名'] || ''
const jushu = jushuName ? `${jushuCode} (${jushuName})` : jushuCode
```

## トラブルシューティング

### コードマスタが読み込まれない

**症状**: 「警告: コードマスタが見つかりません」と表示される

**確認**:
- `backend/data/administrative/rinsyousigen/森林調査簿コード.xlsx` が存在するか確認

**解決策**:
- ファイルを正しい場所に配置する

### 日本語名が表示されない

**症状**: コードのみ表示される（例: `15` のみ）

**確認**:
- データ変換時に「✓ 森林の種類: 23 件」などと表示されたか確認
- ブラウザのコンソールでAPIレスポンスを確認

**解決策**:
- データを再変換する
- ブラウザをリロード（Ctrl+F5）

### 文字化けしている

**症状**: PowerShellで文字化けする

**原因**: Windows PowerShellの表示の問題（実際のデータは正しいUTF-8）

**確認**:
- ブラウザで表示すると正しく表示される

## 今後の拡張

### 追加可能なコードマスタ

- 複層区分コード
- 混植サイン
- 疎密度コード
- 立地距離コード

### 表示の改善

- ツールチップでコードの詳細説明を表示
- コードマスタの一覧表示機能
- コードでの検索・フィルタ機能

## 関連ファイル

- `backend/convert_forest_registry_to_geojson.py` - データ変換スクリプト
- `backend/data/administrative/rinsyousigen/森林調査簿コード.xlsx` - コードマスタ
- `frontend/src/Map.jsx` - 地図表示ロジック
