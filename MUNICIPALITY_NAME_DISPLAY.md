# 市町村名の表示追加

## 変更内容

森林簿レイヤーの選択情報ポップアップに市町村名を表示するように改善しました。

## 修正箇所

### 1. Map.jsx

#### propsに市町村名マッピングを追加
```javascript
function Map({ 
  // ... 既存のprops
  municipalityNames // 市町村名マッピングを受け取る
}) {
```

#### 選択情報表示関数の修正
`window.showSelectedForestInfo` 関数内で：

1. **KEYCODEから市町村コードを抽出**:
   ```javascript
   // KEYCODEの3-4桁目が市町村コード
   const municipalityCode = keycode && keycode.length >= 4 ? keycode.substring(2, 4) : 'N/A'
   const municipalityName = municipalityNames[municipalityCode] || municipalityCode
   ```

2. **ポップアップ表示に市町村名を追加**:
   ```javascript
   ${idx + 1}. ${info.municipalityName} - 林班: ${info.rinban} / 小班: ${info.syouhan}
   ```
   
   表示例: `1. 森町 - 林班: 0053 / 小班: 0049`

3. **市町村コードも表示**:
   ```javascript
   市町村コード: ${info.municipalityCode} | KEYCODE: ${info.keycode}
   ```
   
   表示例: `市町村コード: 15 | KEYCODE: 01150053004900`

### 2. App.jsx

#### MapコンポーネントにmunicpalityNamesを渡す
```javascript
<Map 
  // ... 既存のprops
  municipalityNames={municipalityNames}
/>
```

## 表示例

### 修正前
```
1. 林班: 0053 / 小班: 0049
KEYCODE: 01150053004900
```

### 修正後
```
1. 森町 - 林班: 0053 / 小班: 0049
市町村コード: 15 | KEYCODE: 01150053004900
```

## 表示される情報

選択情報ポップアップには以下の情報が表示されます：

1. **市町村名**: 「森町」「函館市」など
2. **林班**: 4桁の林班番号
3. **小班**: 4桁の小班番号
4. **市町村コード**: 2桁のコード（例: 15）
5. **KEYCODE**: 14桁の完全なコード
6. **層データ**: 森林種類、林種、樹種、林齢、面積など

## メリット

✅ **わかりやすい**: 数字だけでなく市町村名が表示される
✅ **確認しやすい**: どの市町村の小班か一目でわかる
✅ **詳細情報**: 市町村コードとKEYCODEの両方を確認できる
✅ **一貫性**: プルダウンと同じ市町村名が表示される

## テスト方法

1. 森林簿レイヤーをONにする
2. 地図上で小班をクリックして選択
3. 「📋 選択情報を表示」ボタンをクリック
4. ポップアップに市町村名が表示されることを確認

例:
- 「森町 - 林班: 0053 / 小班: 0049」
- 「函館市 - 林班: 0066 / 小班: 0002」

## ファイル変更履歴

- `frontend/src/Map.jsx` (修正)
  - propsに `municipalityNames` を追加
  - `window.showSelectedForestInfo` 関数で市町村名を表示
- `frontend/src/App.jsx` (修正)
  - Mapコンポーネントに `municipalityNames` を渡す
