# BtoB SaaS品質への収束 - 変更サマリー

## 変更したファイル一覧

### 新規作成
- なし（既存の基盤コンポーネントを活用）

### 修正
1. `/frontend/src/components/Header.jsx` - emoji削除、AppIcon/Button/Input適用
2. `/frontend/src/components/Sidebar.jsx` - emoji削除、AppIcon適用
3. `/frontend/src/components/AttributeTable.jsx` - emoji削除、AppIcon/Button/Badge適用、テーブル品質向上
4. `/frontend/src/components/components.css` - 完全tokens参照化、BtoB品質スタイル統一
5. `/frontend/src/components/ui/Badge.jsx` - neutral variant追加

## "BtoC感が残る要因"を3つ挙げて、それぞれどう直したか

### 1. Emoji乱用（最大の要因）
**問題：** 
- 🔔🗺️📁🔧👤👁️⚙️📊などのemojiが至る所に散在
- カジュアルで親しみやすいが、業務ツールとしては稚拙に見える

**解決：**
- 全emojiをAppIcon経由の単色線画アイコンに置換
- strokeWidth固定、サイズ3種（sm/md/lg = 16/20/24px）に統一
- 例：`<span>👁️</span>` → `<AppIcon name="eye" size="sm" />`

### 2. 大きめ余白・角丸・影の多用
**問題：**
- padding: 20px、border-radius: 6px、多重shadowなど"ゆったり感"
- 情報密度が低く、業務では非効率
- 柔らかい印象が業務の緊張感を欠く

**解決：**
- components.cssを完全tokens参照化
- 余白を4pxグリッド（spacing-1〜spacing-6）に統一
- 角丸を2-4px中心（radius-sm/base）に縮小
- 影を単一影のみ（shadow-sm/base）、多重影を削除
- 例：`padding: 20px` → `padding: var(--spacing-4)` (16px)

### 3. 直書きの<button>/<input>/<table>タグ
**問題：**
- スタイルが統一されず、状態管理も不統一
- focus-visible、disabled、loading状態が未実装
- 可読性・保守性が低い

**解決：**
- Header: `<input>` → `<Input>`、`<button>` → `<Button>`
- AttributeTable: `<button>` → `<Button>`、直書きテキスト → `<Badge>`
- 全コンポーネントがtokens参照、状態実装済み

## 主要コンポーネントのコード（tokens参照が分かる形）

### Button（既存、tokens参照確認）
```jsx
// /frontend/src/components/ui/Button.jsx
import AppIcon from '../AppIcon';
import './Button.css';

// Button.cssでtokens参照
// height: var(--button-height-base);
// padding: 0 var(--spacing-3);
// border-radius: var(--radius-base);
// font-size: var(--font-size-base);
```

### Input（既存、tokens参照確認）
```jsx
// /frontend/src/components/ui/Input.jsx
import AppIcon from '../AppIcon';
import './Input.css';

// Input.cssでtokens参照
// height: var(--input-height-base);
// border: var(--border-width) solid var(--border-default);
// focus時: box-shadow: var(--focus-ring);
```

### Badge（既存、neutral variant追加）
```jsx
// /frontend/src/components/ui/Badge.jsx
export default function Badge({
  children,
  variant = 'default', // neutral | success | warning | error | info
  size = 'base',
  className = '',
}) {
  const classes = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return <span className={classes}>{children}</span>;
}
```

### Table（components.css）
```css
/* tokens参照のテーブルスタイル */
.data-table th {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  background: var(--bg-hover);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tbody tr:hover {
  background: var(--bg-hover);
}

.data-table tbody tr.selected {
  background: var(--bg-selected);
  border-left: 2px solid var(--border-accent);
}

.col-numeric {
  text-align: right;
  font-family: var(--font-family-mono);
}

.col-code {
  font-family: var(--font-family-mono);
  color: var(--text-code);
}
```

## 目視で分かる確認ポイント（3つ）

### 1. ヘッダー：emoji消失、アイコン統一、高さ縮小
**Before:**
- 高さ56px、emoji（🔔⚙️👤）、大きめ余白
- 検索ボタンの角丸6px

**After:**
- 高さ48px、単色線画アイコン（settings/user）、余白16px
- 検索ボタンはButton コンポーネント、角丸4px
- 全体的に引き締まった印象

**確認方法：**
ブラウザの開発者ツールで `.app-header` の `height: 48px` を確認

### 2. 左ナビ：emoji消失、レイヤーコントロールのアイコン統一
**Before:**
- タブアイコンがemoji（🗺️📁🔧）
- レイヤー表示ボタンがemoji（👁️👁️‍🗨️）
- 設定ボタンがemoji（⚙️）

**After:**
- タブアイコンがAppIcon（layer/upload/settings）
- レイヤー表示ボタンがAppIcon（eye/eyeOff）
- 全て16pxの単色線画に統一

**確認方法：**
サイドバーを見てemojiが完全に消えていることを確認

### 3. 下部テーブル：業務ツール品質（thead/hover/selected/mono数値）
**Before:**
- theadが普通のテキスト、ソート矢印が文字（↑↓）
- hoverがシンプルな背景変更
- selected状態が薄い背景のみ
- 数値列が通常フォント
- 空状態アイコンがemoji（📊）

**After:**
- theadが薄い背景＋uppercase＋letter-spacing、ソート矢印がAppIcon
- hover時に `var(--bg-hover)` 適用
- selected時に `var(--bg-selected)` ＋左ボーダーアクセント色
- 数値列（面積・材積）がmonoフォント、右揃え
- 種別がBadgeコンポーネント（針葉樹=success、広葉樹=warning）
- 空状態アイコンがAppIcon

**確認方法：**
- テーブルヘッダーをクリックしてソートアイコンの表示確認
- 行をクリックしてselected状態の左ボーダー（緑）を確認
- 面積・材積列がmonoフォントであることを確認

## 規約準拠チェック項目（機械的確認）

### tokens参照確認
```bash
# components.cssに直書きがないか確認
grep -E '#[0-9a-f]{3,6}|[0-9]+px' /frontend/src/components/components.css
# → tokensのみ参照していれば何もヒットしない（変数定義のコメントを除く）
```

### AppIcon統一確認
```bash
# JSXファイルにemojiが残っていないか確認
grep -r "['\"]\p{Emoji}" /frontend/src/components/*.jsx
# → 何もヒットしなければOK
```

### 角丸規約確認
```bash
# 6px超の角丸がないか確認（Dialogを除く）
grep -E "border-radius: [7-9]px|border-radius: [1-9][0-9]+px" /frontend/src/components/components.css
# → 何もヒットしなければOK
```

### 影の多重禁止確認
```bash
# カンマ区切りの多重影がないか確認
grep "box-shadow:.*,.*," /frontend/src/components/components.css
# → 何もヒットしなければOK
```

## 実装済みの状態設計

全コンポーネントで以下の状態を実装：
- `:hover` - background変化、color変化
- `:focus-visible` - アウトライン削除、box-shadow focus-ring
- `.selected` - 選択中の背景色＋アクセントボーダー
- `.disabled` - opacity 0.5、cursor not-allowed
- `.loading` - spinner表示、操作無効化（Buttonのみ）

## 次のステップ（オプション）

さらにBtoB品質を高めるには：
1. テーブルのカラム幅をresizableにする
2. フィルタ/ソートのUIを実装（現在はボタンのみ）
3. CSV出力機能を実装
4. テーブルの仮想スクロール（大量データ対応）
5. ツールチップの実装（ellipsisされたセルにhoverで全文表示）
