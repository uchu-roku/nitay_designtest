# BtoB SaaS デザイン規約 実装強制 - 検収ドキュメント

## 実施日時
2026-02-01

## 目的
BtoB SaaS デザイン規約を実装レベルで物理的に強制し、規約違反を不可能にする。

---

## 修正ファイル一覧

### 1. `frontend/src/main.jsx`
**状態**: ✅ 既に正しい順序で実装済み
- tokens.css → index.css の順序で import 済み
- 変更なし

### 2. `frontend/src/index.css`
**変更内容**: フォーム要素に tokens 継承を追加
```css
/* 追加 */
button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}
```
**効果**: 全フォーム要素が body の tokens 設定を自動継承

### 3. `frontend/src/styles/tokens.css`
**変更内容**: 規約準拠への修正

#### 3-1. フォントサイズ（最大18px）
```css
/* 削除 */
--font-size-2xl: 20px;

/* 追加コメント */
/* --font-size-2xl: REMOVED - 規約違反（最大18px） */
```

#### 3-2. 角丸（2-4px中心、ダイアログ6px）
```css
/* 変更前 */
--radius-sm: 3px;
--radius-lg: 8px;

/* 変更後 */
--radius-sm: 2px;
--radius-lg: 6px; /* Alias for backward compatibility */
```

#### 3-3. 影（単一影のみ、多重影禁止）
```css
/* 変更前 */
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);

/* 変更後 */
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
```

### 4. `frontend/src/components/AppIcon.jsx`
**変更内容**: 規約違反を物理的に不可能にする制約強化

#### 4-1. サイズ制限
```javascript
// 許可されたサイズの列挙型
const ALLOWED_SIZES = ['sm', 'md', 'lg'];

// 実行時バリデーション
if (!ALLOWED_SIZES.includes(size)) {
  console.error(`[AppIcon] Invalid size "${size}". Allowed: ${ALLOWED_SIZES.join(', ')}`);
  return null;
}
```
**効果**: 数値指定は実行時エラーで拒否

#### 4-2. アイコン名制限
```javascript
// 許可されたアイコン名の列挙型
const ALLOWED_ICON_NAMES = [
  'search', 'user', 'settings', 'layer', 'upload', 'download',
  'close', 'check', 'chevronDown', 'chevronUp', 'chevronLeft', 'chevronRight',
  'plus', 'minus', 'eye', 'eyeOff', 'filter', 'refresh', 'menu', 'dots',
  'info', 'warning', 'error', 'trash', 'edit', 'export',
  'file', 'folder', 'map', 'table', 'chart', 'calendar', 'clock'
];

// 実行時バリデーション
if (!ALLOWED_ICON_NAMES.includes(name)) {
  console.error(`[AppIcon] Invalid icon name "${name}". Allowed icons: ${ALLOWED_ICON_NAMES.join(', ')}`);
  return null;
}
```
**効果**: 未登録アイコンは実行時エラーで拒否

#### 4-3. strokeWidth 固定
```javascript
// 固定 strokeWidth（規約強制：呼び出し側から変更不可）
const STROKE_WIDTH = 2;

// JSX内で固定値を使用
strokeWidth={STROKE_WIDTH}
```
**効果**: 呼び出し側から strokeWidth を変更不可

#### 4-4. デフォルトサイズ変更
```javascript
// 変更前: size = 'base'
// 変更後: size = 'md'
```

### 5. `frontend/src/components/AppIcon.css`
**変更内容**: サイズ名を統一
```css
/* 追加 */
.app-icon--md {
  width: var(--icon-size-base);  /* 20px */
  height: var(--icon-size-base);
}

/* 後方互換性のため base を md のエイリアスとして残す */
.app-icon--base {
  width: var(--icon-size-base);
  height: var(--icon-size-base);
}
```

### 6. `frontend/src/components/ui/Dialog.jsx`
**変更内容**: size 名を統一
```jsx
/* 変更前 */
<AppIcon name="close" size="base" />

/* 変更後 */
<AppIcon name="close" size="md" />
```

---

## 検収手順

### 1. DevTools での確認

#### 1-1. body の background が tokens 参照になっていること
```bash
# 開発サーバー起動
cd frontend
npm run dev
```

1. ブラウザで http://localhost:5173 を開く
2. DevTools を開く（F12）
3. Elements タブで `<body>` を選択
4. Computed スタイルで以下を確認：
   - `background-color`: `rgb(249, 250, 251)` (--bg-page = --color-gray-50)
   - `font-family`: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif`
   - `font-size`: `13px` (--font-size-base)
   - `line-height`: `1.5` (--line-height-normal)

#### 1-2. AppIcon のサイズが固定されていること
1. Console タブを開く
2. 以下を実行して数値指定がエラーになることを確認：
```javascript
// これはエラーになるべき（実際のコンポーネントで試す場合）
// <AppIcon name="search" size={20} />
// → Console に "[AppIcon] Invalid size "20". Allowed: sm, md, lg" が表示される
```

3. Elements タブで AppIcon の実際のサイズを確認：
   - `app-icon--sm`: 16px × 16px
   - `app-icon--md`: 20px × 20px
   - `app-icon--lg`: 24px × 24px

### 2. コード検索での確認

#### 2-1. tokens.css が main.jsx から import されているか
```bash
cd frontend/src
grep -n "tokens.css" main.jsx
```
**期待結果**:
```
4:import './styles/tokens.css'
```

#### 2-2. react-icons の直接 import が AppIcon 以外で 0 件か
```bash
cd frontend/src
grep -r "from ['\"]react-icons" --include="*.jsx" --include="*.js" .
```
**期待結果**: 0 件（何も表示されない）

#### 2-3. font-size-2xl の使用が 0 件か
```bash
cd frontend/src
grep -r "font-size-2xl" --include="*.css" --include="*.jsx" .
```
**期待結果**: tokens.css のコメント行のみ

#### 2-4. 多重影の使用が 0 件か
```bash
cd frontend/src
grep -r "rgba.*,.*rgba" --include="*.css" .
```
**期待結果**: 0 件（tokens.css 内も単一影のみ）

### 3. 実行時エラーテスト

開発環境で以下のテストコードを一時的に追加して確認：

```jsx
// テスト用コンポーネント（一時的に App.jsx などに追加）
function DesignEnforcementTest() {
  return (
    <div>
      {/* 正常系 */}
      <AppIcon name="search" size="sm" />
      <AppIcon name="user" size="md" />
      <AppIcon name="settings" size="lg" />
      
      {/* エラー系（Console にエラーが出るべき） */}
      <AppIcon name="search" size={20} />
      <AppIcon name="invalid-icon" size="md" />
    </div>
  );
}
```

**期待結果**:
- Console に以下のエラーが表示される：
  - `[AppIcon] Invalid size "20". Allowed: sm, md, lg`
  - `[AppIcon] Invalid icon name "invalid-icon". Allowed icons: ...`

---

## 規約強制の確認項目

### ✅ タスクA：tokens を全UIに確実に適用
- [x] main.jsx で tokens.css を index.css より先に import
- [x] index.css で body に tokens 参照を設定
- [x] button/input/select/textarea に font: inherit; color: inherit; を設定

### ✅ タスクB：tokens.css を規約に完全一致
- [x] font-size-2xl (20px) を削除（最大18px）
- [x] radius-sm を 2px に変更
- [x] radius-lg を 6px に変更（8px を撤去）
- [x] shadow-base / shadow-md を単一影に変更（多重影禁止）
- [x] 後方互換性のためエイリアスを残す

### ✅ タスクC：AppIcon を規約違反が物理的に不可能な設計に
- [x] size は "sm" | "md" | "lg" のみ（数値指定は実行時エラー）
- [x] strokeWidth は固定（呼び出し側から変更不可）
- [x] サイズは tokens から取得（16/20/24px に固定）
- [x] name は列挙型で制限（未登録アイコンは実行時エラー）
- [x] react-icons の直接 import が AppIcon 以外で 0 件

---

## 追加の規約強制メカニズム

### 型安全性の向上（今後の改善案）
TypeScript を導入する場合、以下の型定義で完全な型安全性を実現可能：

```typescript
type IconSize = 'sm' | 'md' | 'lg';
type IconName = 'search' | 'user' | 'settings' | ... ; // 全アイコン名を列挙

interface AppIconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  color?: string;
}
```

### ESLint ルール（今後の改善案）
```javascript
// .eslintrc.js
rules: {
  'no-restricted-imports': ['error', {
    patterns: ['react-icons/*']
  }],
  'no-restricted-syntax': ['error', {
    selector: 'Literal[value=/^(19|[2-9][0-9]|[1-9][0-9]{2,})px$/]',
    message: 'Font size must not exceed 18px per BtoB SaaS規約'
  }]
}
```

---

## まとめ

### 実装完了項目
1. ✅ tokens.css の確実な適用（main.jsx → index.css の順序）
2. ✅ フォーム要素への tokens 継承
3. ✅ 規約準拠への tokens 修正（最大18px、角丸2-6px、単一影）
4. ✅ AppIcon の制約強化（サイズ/アイコン名/strokeWidth の固定）
5. ✅ react-icons の直接 import 禁止（0件維持）

### 規約強制レベル
- **実行時**: AppIcon の不正な使用は実行時エラーで拒否
- **開発時**: Console エラーで即座に検知可能
- **レビュー時**: 検索コマンドで機械的に検証可能

### 次のステップ（オプション）
- TypeScript 導入で型レベルの強制
- ESLint ルールで静的解析レベルの強制
- Storybook でデザイントークンのビジュアル確認
