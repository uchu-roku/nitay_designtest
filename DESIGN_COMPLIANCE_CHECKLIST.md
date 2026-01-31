# デザインシステム準拠チェックリスト

実装が規約に準拠しているかを機械的に確認するためのチェック項目

---

## 1. CSSトークン準拠チェック

### ✅ 自動確認可能項目

**検索コマンド:**
```bash
# ハードコード色の検出（禁止）
grep -r "color:\s*#[0-9a-fA-F]" frontend/src --include="*.css" --include="*.jsx"
grep -r "background:\s*#[0-9a-fA-F]" frontend/src --include="*.css" --include="*.jsx"
grep -r "border.*#[0-9a-fA-F]" frontend/src --include="*.css" --include="*.jsx"

# ハードコードスペーシングの検出（禁止）
grep -r "padding:\s*[0-9]*px" frontend/src --include="*.css" | grep -v "var(--"
grep -r "margin:\s*[0-9]*px" frontend/src --include="*.css" | grep -v "var(--"

# 不正な角丸検出（9px以上は禁止）
grep -r "border-radius:\s*[1-9][0-9]px" frontend/src --include="*.css"

# トークン参照確認（推奨）
grep -r "var(--" frontend/src --include="*.css" --include="*.jsx" | wc -l
```

**期待結果:**
- ハードコード色: 0件
- ハードコードスペーシング: 0件
- 不正な角丸: 0件
- トークン参照: 100件以上

---

## 2. アイコン統一チェック

### ✅ 自動確認可能項目

**検索コマンド:**
```bash
# emoji使用検出（禁止）
grep -r "[😀-🙏🌀-🗿🚀-🛿]" frontend/src --include="*.jsx" --include="*.js"

# 直接SVG使用検出（AppIcon経由必須）
grep -r "<svg" frontend/src --include="*.jsx" | grep -v "AppIcon.jsx"

# AppIcon以外のアイコンコンポーネント検出
find frontend/src -name "*Icon*.jsx" | grep -v "AppIcon.jsx"

# AppIcon使用カウント
grep -r "<AppIcon" frontend/src --include="*.jsx" | wc -l
```

**期待結果:**
- emoji使用: 0件
- 直接SVG: 0件（AppIcon.jsx以外）
- 独自Iconコンポーネント: 0件
- AppIcon使用: 20件以上

---

## 3. コンポーネント使用チェック

### ✅ 自動確認可能項目

**検索コマンド:**
```bash
# 直接button要素（Buttonコンポーネント推奨）
grep -r "<button" frontend/src --include="*.jsx" | grep -v "className=\"btn" | wc -l

# 直接input要素（Inputコンポーネント推奨）
grep -r "<input" frontend/src --include="*.jsx" | grep -v "className=\"input" | wc -l

# 直接table要素（Tableコンポーネント推奨）
grep -r "<table" frontend/src --include="*.jsx" | grep -v "className=\"data-table" | wc -l

# カード乱立検出（5件以上は要確認）
grep -r "className=.*card" frontend/src --include="*.jsx" | wc -l
```

**期待結果:**
- 共通コンポーネント外のbutton: 10件以下
- 共通コンポーネント外のinput: 5件以下
- 共通コンポーネント外のtable: 3件以下
- カード使用: 5件以下

---

## 4. 状態実装チェック

### ✅ 自動確認可能項目

**検索コマンド:**
```bash
# disabled状態実装確認
grep -r "disabled" frontend/src/components/ui --include="*.jsx" | wc -l

# loading状態実装確認
grep -r "loading" frontend/src/components/ui --include="*.jsx" | wc -l

# error状態実装確認
grep -r "error" frontend/src/components/ui --include="*.jsx" | wc -l

# focus-visible実装確認
grep -r "focus-visible" frontend/src --include="*.css" | wc -l

# hover状態実装確認
grep -r ":hover" frontend/src --include="*.css" | wc -l
```

**期待結果:**
- disabled実装: 8件以上（全インタラクティブコンポーネント）
- loading実装: 2件以上（Button, Input等）
- error実装: 3件以上（フォーム系）
- focus-visible: 8件以上
- hover: 20件以上

---

## 5. タイポグラフィ準拠チェック

### ✅ 自動確認可能項目

**検索コマンド:**
```bash
# ハードコードフォントサイズ検出
grep -r "font-size:\s*[0-9]*px" frontend/src --include="*.css" | grep -v "var(--font-size"

# 不正なフォントウェイト（400/500/600以外）
grep -r "font-weight:\s*[137-9]00" frontend/src --include="*.css"

# font-familyハードコード検出
grep -r "font-family:\s*['\"]" frontend/src --include="*.css" | grep -v "var(--font-family"
```

**期待結果:**
- ハードコードフォントサイズ: 0件
- 不正なフォントウェイト: 0件
- ハードコードfont-family: 0件

---

## 6. レイアウト・スペーシングチェック

### ✅ 自動確認可能項目

**検索コマンド:**
```bash
# 奇数スペーシング検出（禁止）
grep -r ":\s*[1-9][13579]px" frontend/src --include="*.css" | grep -v "var(--"

# 4の倍数以外のスペーシング検出
grep -r "padding:\s*[0-9]+px" frontend/src --include="*.css" | grep -v "var(--spacing" | \
  awk -F'px' '{print $1}' | awk '{print $NF}' | while read num; do
    if [ $((num % 4)) -ne 0 ]; then echo "非準拠: ${num}px"; fi
  done
```

**期待結果:**
- 奇数スペーシング: 0件
- 4の倍数以外: 0件

---

## 7. シャドウ・ボーダーチェック

### ✅ 自動確認可能項目

**検索コマンド:**
```bash
# 過度なシャドウ検出（禁止）
grep -r "box-shadow:.*0\s*[2-9][0-9]px" frontend/src --include="*.css"

# ボーダー幅2px以上検出（1pxのみ許可）
grep -r "border.*[2-9]px" frontend/src --include="*.css" | grep -v "border-bottom: 2px"

# グラデーション検出（禁止）
grep -r "gradient" frontend/src --include="*.css" | grep -v "Skeleton"
```

**期待結果:**
- 過度なシャドウ: 0件
- 2px以上のボーダー: タブのborder-bottomのみ
- グラデーション: Skeletonのみ

---

## 8. ファイル構造チェック

### ✅ 自動確認可能項目

**検索コマンド:**
```bash
# tokens.css存在確認
ls frontend/src/styles/tokens.css

# UIコンポーネント存在確認
ls frontend/src/components/ui/Button.jsx
ls frontend/src/components/ui/Input.jsx
ls frontend/src/components/ui/Badge.jsx
ls frontend/src/components/ui/Skeleton.jsx
ls frontend/src/components/ui/Tabs.jsx
ls frontend/src/components/ui/Table.jsx
ls frontend/src/components/ui/Dialog.jsx
ls frontend/src/components/ui/Tooltip.jsx

# AppIcon存在確認
ls frontend/src/components/AppIcon.jsx

# 対応CSSファイル存在確認
find frontend/src/components/ui -name "*.jsx" | \
  while read file; do
    css_file="${file%.jsx}.css"
    if [ ! -f "$css_file" ]; then
      echo "CSSファイル不足: $css_file"
    fi
  done
```

**期待結果:**
- tokens.css: 存在
- 全UIコンポーネント: 存在
- AppIcon: 存在
- 各コンポーネントのCSS: すべて存在

---

## 9. インポート整合性チェック

### ✅ 自動確認可能項目

**検索コマンド:**
```bash
# tokens.cssインポート確認
grep -r "@import.*tokens.css" frontend/src --include="*.css" | wc -l

# 直接色値インポート検出（禁止）
grep -r "import.*colors" frontend/src --include="*.jsx" --include="*.js"

# UI component indexからのインポート確認
grep -r "from.*components/ui'" frontend/src --include="*.jsx" | wc -l
```

**期待結果:**
- tokens.cssインポート: 10件以上（全CSSファイル）
- 直接色値インポート: 0件
- UI indexインポート: 5件以上

---

## 10. アクセシビリティチェック

### ✅ 自動確認可能項目

**検索コマンド:**
```bash
# aria-label実装確認
grep -r "aria-label" frontend/src --include="*.jsx" | wc -l

# role属性確認
grep -r "role=" frontend/src --include="*.jsx" | wc -l

# alt属性確認（画像用）
grep -r "<img" frontend/src --include="*.jsx" | grep -v "alt=" | wc -l

# focus-visible実装確認
grep -r ":focus-visible" frontend/src --include="*.css" | wc -l
```

**期待結果:**
- aria-label: 10件以上
- role属性: 5件以上
- alt属性なし画像: 0件
- focus-visible: 8件以上

---

## 統合確認スクリプト

### 一括実行用シェルスクリプト

```bash
#!/bin/bash
# design-compliance-check.sh

echo "=== デザインシステム準拠チェック ==="
echo ""

# 1. ハードコード色
echo "1. ハードコード色チェック..."
COLOR_COUNT=$(grep -r "color:\s*#[0-9a-fA-F]" frontend/src --include="*.css" --include="*.jsx" 2>/dev/null | wc -l)
if [ $COLOR_COUNT -eq 0 ]; then
  echo "   ✅ ハードコード色: なし"
else
  echo "   ❌ ハードコード色: ${COLOR_COUNT}件検出"
fi

# 2. emoji使用
echo "2. Emoji使用チェック..."
EMOJI_COUNT=$(grep -rP "[😀-🙏🌀-🗿🚀-🛿]" frontend/src --include="*.jsx" 2>/dev/null | wc -l)
if [ $EMOJI_COUNT -eq 0 ]; then
  echo "   ✅ Emoji使用: なし"
else
  echo "   ❌ Emoji使用: ${EMOJI_COUNT}件検出"
fi

# 3. AppIcon使用
echo "3. AppIconコンポーネント使用チェック..."
APPICON_COUNT=$(grep -r "<AppIcon" frontend/src --include="*.jsx" 2>/dev/null | wc -l)
if [ $APPICON_COUNT -gt 15 ]; then
  echo "   ✅ AppIcon使用: ${APPICON_COUNT}件"
else
  echo "   ⚠️  AppIcon使用: ${APPICON_COUNT}件（推奨: 20件以上）"
fi

# 4. トークン参照
echo "4. CSSトークン参照チェック..."
TOKEN_COUNT=$(grep -r "var(--" frontend/src --include="*.css" 2>/dev/null | wc -l)
if [ $TOKEN_COUNT -gt 80 ]; then
  echo "   ✅ トークン参照: ${TOKEN_COUNT}件"
else
  echo "   ⚠️  トークン参照: ${TOKEN_COUNT}件（推奨: 100件以上）"
fi

# 5. focus-visible実装
echo "5. focus-visible実装チェック..."
FOCUS_COUNT=$(grep -r ":focus-visible" frontend/src --include="*.css" 2>/dev/null | wc -l)
if [ $FOCUS_COUNT -gt 6 ]; then
  echo "   ✅ focus-visible: ${FOCUS_COUNT}件"
else
  echo "   ❌ focus-visible: ${FOCUS_COUNT}件（必須: 8件以上）"
fi

# 6. コンポーネント存在確認
echo "6. UIコンポーネント存在確認..."
MISSING=0
for component in Button Input Badge Skeleton Tabs Table Dialog Tooltip; do
  if [ ! -f "frontend/src/components/ui/${component}.jsx" ]; then
    echo "   ❌ ${component}.jsx が存在しません"
    MISSING=$((MISSING + 1))
  fi
done
if [ $MISSING -eq 0 ]; then
  echo "   ✅ 全UIコンポーネント: 存在"
else
  echo "   ❌ 不足コンポーネント: ${MISSING}件"
fi

# 7. tokens.css存在確認
echo "7. tokens.css存在確認..."
if [ -f "frontend/src/styles/tokens.css" ]; then
  echo "   ✅ tokens.css: 存在"
else
  echo "   ❌ tokens.css: 存在しません"
fi

echo ""
echo "=== チェック完了 ==="
```

**実行方法:**
```bash
chmod +x design-compliance-check.sh
./design-compliance-check.sh
```

---

## 手動確認項目

以下は目視確認が必要な項目：

### デザイン品質
- [ ] カード乱立していないか（テーブル優先）
- [ ] 情報密度が適切か（余白過多でない）
- [ ] アクセント色（緑）が主要アクションのみに使用されているか
- [ ] 角丸が控えめか（最大6px）
- [ ] シャドウが弱いか（ボーダー優先）

### UX品質
- [ ] 全ボタンに適切なラベルがあるか
- [ ] エラー状態が視覚的に明確か
- [ ] ローディング状態が実装されているか
- [ ] 空状態（Empty state）が実装されているか
- [ ] キーボード操作が可能か

### コード品質
- [ ] コンポーネントが適切に分割されているか
- [ ] propsが適切に型定義されているか
- [ ] 不要なコメントやconsole.logがないか
- [ ] ファイル名がPascalCaseで統一されているか

---

## 合格基準

実装が以下の基準を満たすこと：

1. **自動チェック:** 上記スクリプトで❌が0件
2. **手動チェック:** 10項目中8項目以上が✅
3. **パフォーマンス:** Lighthouse Accessibilityスコア90以上

---

## チェック頻度

- **プルリクエスト時:** 必須
- **リリース前:** 必須
- **定期レビュー:** 月1回
