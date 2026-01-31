# デザイントークン反映確認手順

## インポート順序確認

`/frontend/src/main.jsx` で正しい順序でインポートされているか確認：

```jsx
import './styles/tokens.css'  // ← 先にトークン定義
import './index.css'           // ← 次にベーススタイル
```

## ブラウザでの反映確認

### 1. 開発サーバー起動
```bash
cd frontend
npm run dev
```

### 2. ブラウザ開発者ツールで確認

#### 背景色の確認
1. 開発者ツール（F12）を開く
2. Elements タブで `<body>` 要素を選択
3. Styles パネルで以下を確認：

```css
body {
  background: var(--bg-page);  /* #f8f9fa が反映されているか */
  color: var(--text-primary);   /* #18181b が反映されているか */
  font-family: var(--font-family-sans);
}
```

4. Computed タブで実際の値を確認：
   - background-color: `rgb(248, 249, 250)` = #f8f9fa
   - color: `rgb(24, 24, 27)` = #18181b

#### プライマリボタン色の確認

1. サイドバーにボタンがある場合、要素を選択
2. Styles パネルで以下を確認：

```css
.button-primary {
  background: var(--accent-primary);  /* #16a34a が反映 */
  color: var(--text-inverse);         /* #ffffff が反映 */
}
```

3. Computed タブで実際の値：
   - background-color: `rgb(22, 163, 74)` = #16a34a
   - color: `rgb(255, 255, 255)` = #ffffff

### 3. トークン値の直接確認

開発者ツールのConsoleで実行：

```javascript
// 全トークン値を確認
const styles = getComputedStyle(document.documentElement);
console.log({
  bgPage: styles.getPropertyValue('--bg-page'),
  textPrimary: styles.getPropertyValue('--text-primary'),
  accentPrimary: styles.getPropertyValue('--accent-primary'),
  fontFamily: styles.getPropertyValue('--font-family-sans')
});
```

期待される出力：
```javascript
{
  bgPage: " #f8f9fa",
  textPrimary: " #18181b",
  accentPrimary: " #16a34a",
  fontFamily: " -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
}
```

## トラブルシューティング

### トークンが反映されない場合

1. **キャッシュクリア**
   ```bash
   # 開発サーバー再起動
   npm run dev -- --force
   ```

2. **ブラウザキャッシュクリア**
   - Chrome: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
   - ハードリロード

3. **tokens.css の読み込み確認**
   - Network タブで `tokens.css` が200ステータスで読み込まれているか
   - Sources タブで `/src/styles/tokens.css` の内容が見えるか

4. **CSS変数のスコープ確認**
   ```javascript
   // Consoleで実行
   document.documentElement.style.getPropertyValue('--bg-page')
   // 値が返ってくればOK、空文字列なら未定義
   ```

### よくある問題

#### 問題: 背景が白のまま
**原因**: tokens.cssがインポートされていない
**解決**: main.jsx のインポート順序を確認

#### 問題: 一部のコンポーネントで色が反映されない
**原因**: インラインスタイルで直接色指定している
**解決**: `style={{ background: '#fff' }}` を `className` に変更

#### 問題: トークン値が `var(--xxx)` のまま
**原因**: CSS変数が定義されていない箇所で参照している
**解決**: tokens.css で該当変数が定義されているか確認

## 成功の確認チェックリスト

- [ ] body の背景色が薄グレー (#f8f9fa)
- [ ] body のテキスト色が濃いグレー (#18181b)
- [ ] プライマリボタンが緑色 (#16a34a)
- [ ] フォントがシステムフォント
- [ ] 開発者ツールで CSS変数が解決されている
- [ ] Console にトークン値エラーがない

## 次のステップ

トークンが正しく反映されたら、既存コンポーネントを順次更新：

1. `/frontend/src/components/Header.jsx` - ハードコードされた色をトークンに
2. `/frontend/src/components/Sidebar.jsx` - 同上
3. `/frontend/src/components/AttributeTable.jsx` - 同上
4. `/frontend/src/App.css` - CSS変数参照に変更

詳細は `DESIGN_SYSTEM_IMPLEMENTATION.md` 参照。
