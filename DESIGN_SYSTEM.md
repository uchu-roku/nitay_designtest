# BtoB SaaS デザインシステム - 業務用森林分析プラットフォーム

## 設計方針

**目的:** BtoC寄りの優しい印象を排除し、業務用BtoB SaaSのスタイリッシュで高密度なUIに刷新

**核心原則:**
- 白〜薄グレー基調、アクセント1色（グリーン）は主要アクションのみ
- 角丸は最小限（2-4px）、影は控えめ、ボーダーで明確に区切る
- タイポグラフィ階層を4段階に明確化
- 情報密度を高める：カード乱立を避け、テーブル/フィルタ/バッジ中心
- UIアイコンは単色線画、サイズ16/20/24pxのみ
- 状態設計を6パターンで規約化

---

## 1. デザイントークン（実装直結）

### カラーパレット

```css
/* ===== ニュートラル（メイン） ===== */
--gray-950: #0a0a0a;    /* 使用禁止：重すぎる */
--gray-900: #18181b;    /* テキスト最重要 */
--gray-800: #27272a;    /* テキスト見出し */
--gray-700: #3f3f46;    /* テキスト標準 */
--gray-600: #52525b;    /* テキストセカンダリ */
--gray-500: #71717a;    /* テキスト補助 */
--gray-400: #a1a1aa;    /* プレースホルダ */
--gray-300: #d4d4d8;    /* ボーダー強調 */
--gray-200: #e4e4e7;    /* ボーダー標準 */
--gray-100: #f4f4f5;    /* ホバー背景 */
--gray-50:  #fafafa;    /* ページ背景 */
--white:    #ffffff;    /* カード背景 */

/* ===== アクセント（グリーン）- 使用箇所制限 ===== */
--green-600: #16a34a;   /* 主要アクション（ボタン、選択状態のみ） */
--green-700: #15803d;   /* ホバー */
--green-800: #166534;   /* アクティブ */
--green-50:  #f0fdf4;   /* 成功背景（極薄） */

/* ===== セマンティック ===== */
--color-error: #dc2626;
--color-error-bg: #fef2f2;
--color-warning: #ea580c;
--color-warning-bg: #fff7ed;
--color-info: #0284c7;
--color-info-bg: #f0f9ff;
```

### タイポグラフィ階層（4段階）

```css
/* フォントファミリー */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Courier New', monospace;

/* 見出し（Heading） */
--text-h1: 18px / 1.4 / 600;  /* ページタイトル */
--text-h2: 16px / 1.4 / 600;  /* セクション見出し */
--text-h3: 14px / 1.4 / 600;  /* サブセクション */

/* 本文（Body） */
--text-body: 13px / 1.5 / 400;      /* 標準テキスト */
--text-body-sm: 12px / 1.4 / 400;   /* 小さめテキスト */

/* 注釈（Caption） */
--text-caption: 11px / 1.3 / 400;   /* ヘルプテキスト、ラベル */

/* 数値・コード（Mono） */
--text-mono: 13px / 1.4 / 400;      /* 数値、ID、コード */
--text-mono-sm: 12px / 1.3 / 400;   /* 小数値 */

/* フォントウェイト（3段階のみ） */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
```

### スペーシング（4px基準、密度重視）

```css
--space-0: 0;
--space-1: 4px;    /* 最小 */
--space-2: 8px;    /* コンポーネント内 */
--space-3: 12px;   /* 標準 */
--space-4: 16px;   /* セクション内 */
--space-6: 24px;   /* セクション間 */
--space-8: 32px;   /* ブロック間 */
```

### 角丸（控えめ）

```css
--radius-none: 0;
--radius-sm: 2px;   /* テーブルセル、バッジ */
--radius-md: 4px;   /* ボタン、インプット、カード */
--radius-lg: 6px;   /* ダイアログ */
--radius-full: 9999px; /* アバターのみ */
```

### シャドウ（最小限）

```css
--shadow-none: none;
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);      /* カード */
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.08);      /* ドロップダウン */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.10);   /* ダイアログ */
```

### ボーダー

```css
--border-width: 1px;
--border-color: var(--gray-200);        /* 標準 */
--border-color-strong: var(--gray-300); /* 強調 */
--border-color-focus: var(--green-600); /* フォーカス */
```

---

## 2. 基本コンポーネント見本

### Button

```jsx
/* Primary（主要アクション専用） */
<button className="btn-primary">
  保存
</button>

/* Secondary（標準操作） */
<button className="btn-secondary">
  キャンセル
</button>

/* Ghost（補助操作） */
<button className="btn-ghost">
  詳細
</button>

/* Danger */
<button className="btn-danger">
  削除
</button>
```

```css
/* 共通ベース */
.btn {
  height: 32px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 150ms;
}

.btn-primary {
  background: var(--green-600);
  color: white;
  border-color: var(--green-600);
}
.btn-primary:hover { background: var(--green-700); }
.btn-primary:active { background: var(--green-800); }

.btn-secondary {
  background: white;
  color: var(--gray-700);
  border-color: var(--gray-200);
}
.btn-secondary:hover { background: var(--gray-100); }

.btn-ghost {
  background: transparent;
  color: var(--gray-600);
}
.btn-ghost:hover { background: var(--gray-100); }

.btn-danger {
  background: white;
  color: var(--color-error);
  border-color: var(--gray-200);
}
.btn-danger:hover { background: var(--color-error-bg); }

/* 状態 */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Input

```jsx
<div className="input-group">
  <label className="input-label">林班コード</label>
  <input 
    type="text" 
    className="input" 
    placeholder="123-456"
  />
  <span className="input-help">半角数字とハイフン</span>
</div>
```

```css
.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--gray-700);
}

.input {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--gray-200);
  border-radius: 4px;
  font-size: 13px;
  color: var(--gray-900);
  background: white;
}

.input:focus {
  outline: none;
  border-color: var(--green-600);
  box-shadow: inset 0 0 0 1px var(--green-600);
}

.input:disabled {
  background: var(--gray-50);
  color: var(--gray-400);
  cursor: not-allowed;
}

.input-help {
  font-size: 11px;
  color: var(--gray-500);
}

.input-error {
  border-color: var(--color-error);
}

.input-error-text {
  font-size: 11px;
  color: var(--color-error);
}
```

### Tabs

```jsx
<div className="tabs">
  <button className="tab tab-active">検索</button>
  <button className="tab">レイヤ</button>
  <button className="tab">帳票</button>
</div>
```

```css
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--gray-200);
}

.tab {
  height: 40px;
  padding: 0 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-600);
  cursor: pointer;
  transition: color 150ms;
}

.tab:hover {
  color: var(--gray-900);
}

.tab-active {
  color: var(--gray-900);
  border-bottom-color: var(--green-600);
}
```

### Card

```jsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">属性情報</h3>
  </div>
  <div className="card-body">
    内容
  </div>
</div>
```

```css
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 4px;
}

.card-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--gray-200);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.card-body {
  padding: 16px;
}
```

### Table

```jsx
<table className="table">
  <thead>
    <tr>
      <th>林班</th>
      <th>面積</th>
      <th>樹種</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>123</td>
      <td className="text-mono">1.23ha</td>
      <td>スギ</td>
    </tr>
  </tbody>
</table>
```

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table thead {
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
}

.table th {
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--gray-700);
  font-size: 12px;
}

.table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--gray-200);
  color: var(--gray-900);
}

.table tbody tr:hover {
  background: var(--gray-50);
}

.table tbody tr.selected {
  background: var(--green-50);
}

.text-mono {
  font-family: var(--font-mono);
  font-size: 12px;
}
```

### Badge

```jsx
<span className="badge">完了</span>
<span className="badge badge-warning">警告</span>
<span className="badge badge-error">エラー</span>
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  background: var(--gray-100);
  color: var(--gray-700);
  border-radius: 2px;
  font-size: 11px;
  font-weight: 500;
}

.badge-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.badge-error {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.badge-success {
  background: var(--green-50);
  color: var(--green-700);
}
```

### Dialog

```jsx
<div className="dialog-overlay">
  <div className="dialog">
    <div className="dialog-header">
      <h2 className="dialog-title">確認</h2>
      <button className="dialog-close">×</button>
    </div>
    <div className="dialog-body">
      内容
    </div>
    <div className="dialog-footer">
      <button className="btn-secondary">キャンセル</button>
      <button className="btn-primary">OK</button>
    </div>
  </div>
</div>
```

```css
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  width: 480px;
  max-width: 90vw;
  background: white;
  border-radius: 6px;
  box-shadow: var(--shadow-md);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-200);
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.dialog-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--gray-400);
  cursor: pointer;
}

.dialog-body {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--gray-200);
}
```

### Tooltip

```jsx
<span className="tooltip-trigger">
  ヘルプ
  <span className="tooltip">補足説明がここに表示されます</span>
</span>
```

```css
.tooltip-trigger {
  position: relative;
  cursor: help;
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 6px 12px;
  background: var(--gray-900);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms;
}

.tooltip-trigger:hover .tooltip {
  opacity: 1;
}
```

### Skeleton（ローディング）

```jsx
<div className="skeleton-line"></div>
<div className="skeleton-box"></div>
```

```css
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(
    90deg,
    var(--gray-100) 25%,
    var(--gray-200) 50%,
    var(--gray-100) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 2px;
}

.skeleton-box {
  height: 80px;
  background: linear-gradient(
    90deg,
    var(--gray-100) 25%,
    var(--gray-200) 50%,
    var(--gray-100) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 4px;
}
```

---

## 3. 状態設計（6パターン規約化）

### 1. 未選択（Default）
```css
background: white;
border: 1px solid var(--gray-200);
color: var(--gray-700);
```

### 2. ホバー（Hover）
```css
background: var(--gray-50);
border: 1px solid var(--gray-200);
color: var(--gray-900);
cursor: pointer;
```

### 3. 選択中（Selected/Active）
```css
background: var(--green-50);
border: 1px solid var(--green-600);
color: var(--gray-900);
```

### 4. フォーカス（Focus）
```css
border: 1px solid var(--green-600);
box-shadow: inset 0 0 0 1px var(--green-600);
outline: none;
```

### 5. 無効（Disabled）
```css
background: var(--gray-50);
border: 1px solid var(--gray-200);
color: var(--gray-400);
opacity: 0.5;
cursor: not-allowed;
```

### 6. エラー（Error）
```css
background: var(--color-error-bg);
border: 1px solid var(--color-error);
color: var(--color-error);
```

---

## 4. UIアイコン規約

### サイズ制限（3種のみ）
- 16px: インライン、バッジ内
- 20px: ボタン内、リスト項目
- 24px: ヘッダー、アクション

### スタイル統一
- 単色線画のみ（塗りつぶし禁止）
- Stroke width: 1.5px or 2px
- 推奨ライブラリ: Lucide Icons, Heroicons Outline

### 使用例
```jsx
{/* 良い例 */}
<Search size={20} strokeWidth={2} />
<ChevronRight size={16} />

{/* 悪い例 */}
<SearchFilled />  {/* 塗りつぶしNG */}
<Icon size={22} /> {/* 22pxは使用禁止 */}
```

---

## 5. Do / Don't（禁止事項）

### ✅ Do（推奨）

1. **ボーダーで区切る**
   - セクション境界は1px borderで明確化
   - カードは必ずborder付き

2. **テーブル中心の情報表示**
   - 一覧データはテーブルで表示
   - ソート・フィルタ機能を提供

3. **バッジで状態表示**
   - ステータスはバッジで簡潔に
   - 色は3種（グレー、警告、エラー）まで

4. **数値はモノスペース**
   - 面積、材積、IDなどはfont-mono

5. **空状態を明示**
   - データなし時は説明 + アクション提示

### ❌ Don't（禁止）

1. **カード乱立禁止**
   ```jsx
   {/* 悪い例 */}
   <div className="card">林班123</div>
   <div className="card">林班124</div>
   <div className="card">林班125</div>
   
   {/* 良い例 */}
   <table>
     <tr><td>123</td></tr>
     <tr><td>124</td></tr>
     <tr><td>125</td></tr>
   </table>
   ```

2. **角丸の乱用禁止**
   ```css
   /* 悪い例 */
   border-radius: 12px;
   border-radius: 16px;
   border-radius: 50%; /* アバター以外禁止 */
   
   /* 良い例 */
   border-radius: 4px;
   ```

3. **影の重ね使い禁止**
   ```css
   /* 悪い例 */
   box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
   
   /* 良い例 */
   box-shadow: 0 1px 2px rgba(0,0,0,0.05);
   ```

4. **アイコン混在禁止**
   ```jsx
   {/* 悪い例 */}
   <span>🔍</span> {/* 絵文字NG */}
   <img src="icon.png" /> {/* 画像アイコンNG */}
   
   {/* 良い例 */}
   <Search size={20} /> {/* 線画アイコン */}
   ```

5. **カラフル過ぎる禁止**
   ```css
   /* 悪い例 */
   --color-blue: #3b82f6;
   --color-purple: #a855f7;
   --color-pink: #ec4899;
   
   {/* アクセントは緑1色のみ */}
   --green-600: #16a34a;
   ```

6. **大きすぎるフォント禁止**
   ```css
   /* 悪い例 */
   font-size: 24px;
   font-size: 32px;
   
   {/* 最大18pxまで */}
   font-size: 18px;
   ```

7. **余白の不統一禁止**
   ```css
   /* 悪い例 */
   padding: 15px;
   margin: 9px;
   
   {/* 4の倍数のみ */}
   padding: 16px;
   margin: 8px;
   ```

8. **ボタンの色バリエーション禁止**
   ```jsx
   {/* 悪い例 */}
   <button className="btn-blue">青</button>
   <button className="btn-purple">紫</button>
   
   {/* 4種のみ */}
   <button className="btn-primary">主要</button>
   <button className="btn-secondary">標準</button>
   <button className="btn-ghost">補助</button>
   <button className="btn-danger">削除</button>
   ```

---

## 6. 実装チェックリスト

デプロイ前に以下を確認：

- [ ] カラーパレット：グレー + グリーン1色のみ
- [ ] 角丸：2-4px、ダイアログのみ6px
- [ ] 影：最大var(--shadow-sm)まで
- [ ] フォントサイズ：11-18px範囲内
- [ ] アイコンサイズ：16/20/24のみ
- [ ] スペーシング：4の倍数
- [ ] ボタン：4種（primary/secondary/ghost/danger）のみ
- [ ] 状態：6パターン（default/hover/selected/focus/disabled/error）で規約化
- [ ] テーブル優先：カード乱立なし
- [ ] 数値：モノスペースフォント適用

---

## 参考プロダクト

実装時の参考：
- **Linear**: ミニマルで高密度
- **GitHub**: テーブル中心、ボーダー明確
- **Vercel Dashboard**: 白基調、アクセント控えめ
- **Notion**: 階層明確、余白適切

---

## 結論

このデザインシステムは、**業務効率を最優先**したBtoB SaaS向けUIです。装飾を排除し、情報密度と操作性を高めることで、プロフェッショナルユーザーが長時間使用しても疲れにくい設計になっています。
