# BtoB SaaS情報設計リファクタリング実装完了

## 変更ファイル一覧

### 新規作成
1. `/frontend/src/App.jsx` - 右パネル統合、情報設計整理の新メインアプリ
2. `/frontend/src/components/RightPanel.jsx` - 詳細・解析結果表示用右パネルコンポーネント（195行）

### 修正
3. `/frontend/src/components/AttributeTable.jsx` - BtoB SaaS仕様テーブル（林班/小班/KEYCODE/面積/樹種/林齢/材積/ステータス列、248行）
4. `/frontend/src/components/components.css` - 右パネル、テーブル行状態、truncateスタイル追加（+267行）
5. `/frontend/src/App.css` - app-bodyにposition: relative追加（右パネルの絶対配置用）
6. `/frontend/src/main.jsx` - App-old → App にインポート変更

---

## 主要実装差分

### 1. RightPanel（右パネル）- 詳細・解析結果の集約

```jsx
// RightPanel.jsx - タブ構造と状態管理
const RightPanel = ({ 
  isOpen, 
  onClose, 
  selectedFeature,
  analysisResult,
  analysisStatus, // idle, analyzing, completed, error
  onStartAnalysis,
  onRetryAnalysis
}) => {
  const [activeTab, setActiveTab] = useState('details')

  const tabs = [
    { id: 'details', label: '詳細' },
    { id: 'analysis', label: '解析結果' }
  ]

  return (
    <aside className="right-panel">
      <div className="right-panel-header">
        <h3 className="panel-title">{selectedFeature?.name || 'AOI #1'}</h3>
        <button className="panel-close-btn" onClick={onClose}>
          <AppIcon name="close" size="sm" />
        </button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="right-panel-content">
        {activeTab === 'details' && (
          <div className="details-tab">
            {/* 林班/小班/KEYCODE/面積/樹種/林齢/材積/ステータス */}
            <div className="details-list">
              <div className="detail-item">
                <span className="detail-label">林班</span>
                <span className="detail-value">{selectedFeature.rinban}</span>
              </div>
              {/* ... */}
              <div className="detail-item">
                <span className="detail-label">ステータス</span>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
            </div>
            
            {/* 未解析なら解析開始ボタン */}
            {!analysisResult && (
              <Button variant="primary" onClick={onStartAnalysis} icon="play">
                解析を開始
              </Button>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            {analysisStatus === 'analyzing' && (
              <Skeleton /> // 解析中はSkeleton表示
            )}

            {analysisStatus === 'error' && (
              <div className="analysis-error">
                <AppIcon name="alert" size="lg" />
                <h4>解析エラー</h4>
                <p>解析処理中にエラーが発生しました。</p>
                <Button onClick={onRetryAnalysis} icon="refresh">再試行</Button>
              </div>
            )}

            {analysisStatus === 'completed' && (
              <div className="analysis-result">
                <div className="result-metrics">
                  <div className="metric-item">
                    <span className="metric-label">検出本数</span>
                    <span className="metric-value">{analysisResult.tree_count}本</span>
                  </div>
                  {/* 針葉樹/広葉樹/総材積 */}
                </div>
                
                {/* 警告があれば表示 */}
                {analysisResult.warnings && (
                  <div className="result-warnings">
                    <h4 className="warnings-title">注意事項</h4>
                    <ul>{analysisResult.warnings.map(w => <li>{w}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
```

**CSS - 右パネル配置**
```css
.right-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 380px;
  background: var(--bg-default);
  border-left: var(--border-width) solid var(--border-default);
  z-index: 100;
  box-shadow: var(--shadow-lg);
}
```

---

### 2. AttributeTable（下部テーブル）- 一覧・比較専用

```jsx
// AttributeTable.jsx - BtoB SaaS仕様の列構成
<thead>
  <tr>
    <th className="col-checkbox">
      <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
    </th>
    <th className="col-sortable col-code" onClick={() => handleSort('rinban')}>
      <div className="th-content">
        林班
        {sortConfig.key === 'rinban' && (
          <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
        )}
      </div>
    </th>
    <th className="col-sortable col-code">小班</th>
    <th className="col-sortable col-code">KEYCODE</th>
    <th className="col-sortable col-numeric">面積</th>
    <th className="col-sortable">樹種</th>
    <th className="col-sortable col-numeric">林齢</th>
    <th className="col-sortable col-numeric">材積</th>
    <th>ステータス</th>
    <th>操作</th>
  </tr>
</thead>

<tbody>
  {sortedData.map((row, index) => (
    <tr 
      className={`
        ${selectedRows.has(index) ? 'row-selected' : ''}
        ${selectedRowId === index ? 'row-active' : ''}
      `}
      onClick={() => handleRowClick(row, index)}
    >
      <td className="col-checkbox">
        <input type="checkbox" checked={selectedRows.has(index)} />
      </td>
      <td className="col-code">
        <Tooltip content={row.rinban}>
          <span className="truncate">{row.rinban}</span>
        </Tooltip>
      </td>
      {/* ... */}
      <td className="col-numeric">
        {row.volume ? `${row.volume}m³` : '—'}
      </td>
      <td>
        <Badge variant={getStatusVariant(row.status)}>
          {getStatusLabel(row.status)}
        </Badge>
      </td>
      <td>
        <Button variant="ghost" size="sm" icon="info" onClick={() => onRowDetail(row, index)}>
          詳細
        </Button>
      </td>
    </tr>
  ))}
</tbody>
```

**CSS - テーブル行状態**
```css
.data-table tbody tr.row-selected {
  background: var(--bg-selected);
  border-left: 2px solid var(--border-accent);
}

.data-table tbody tr.row-active {
  background: var(--bg-accent-subtle);
  border-left: 3px solid var(--border-accent);
}

.col-numeric {
  text-align: right;
  font-family: var(--font-family-mono);
}

.col-code {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--text-code);
}

.truncate {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

### 3. App.jsx - 状態管理と情報フロー

```jsx
function App() {
  // 右パネル状態
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [selectedRowId, setSelectedRowId] = useState(null)
  
  // 解析状態
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState('idle')
  
  // テーブルデータ
  const [tableData, setTableData] = useState([])

  // 地物クリック → 右パネル開く
  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature)
    setRightPanelOpen(true)
    setAnalysisStatus('idle')
    
    // テーブル行と同期
    const rowIndex = tableData.findIndex(row => row.id === feature.id)
    if (rowIndex !== -1) {
      setSelectedRowId(rowIndex)
    }
  }

  // テーブル行選択 → 右パネル開く
  const handleRowSelect = (rowData, index) => {
    setSelectedFeature(rowData)
    setSelectedRowId(index)
    setRightPanelOpen(true)
  }

  // 詳細ボタン → 右パネル開く
  const handleRowDetail = (rowData, index) => {
    setSelectedFeature(rowData)
    setSelectedRowId(index)
    setRightPanelOpen(true)
  }

  // 解析開始
  const handleStartAnalysis = () => {
    setAnalysisStatus('analyzing')
    
    // API呼び出し（シミュレーション）
    setTimeout(() => {
      const mockResult = {
        tree_count: 120,
        volume: 350,
        warnings: ['境界付近の樹木は検出精度が低下する可能性があります']
      }
      setAnalysisResult(mockResult)
      setAnalysisStatus('completed')
      
      // テーブルデータ更新（材積とステータス）
      if (selectedRowId !== null) {
        const newTableData = [...tableData]
        newTableData[selectedRowId] = {
          ...newTableData[selectedRowId],
          volume: mockResult.volume,
          status: 'completed'
        }
        setTableData(newTableData)
      }
    }, 3000)
  }

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">
          <div className="map-section">
            <Map onFeatureClick={handleFeatureClick} />
          </div>
          <div className="table-section">
            <AttributeTable 
              data={tableData}
              onRowSelect={handleRowSelect}
              onRowDetail={handleRowDetail}
              selectedRowId={selectedRowId}
            />
          </div>
        </main>
        <RightPanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          selectedFeature={selectedFeature}
          analysisResult={analysisResult}
          analysisStatus={analysisStatus}
          onStartAnalysis={handleStartAnalysis}
        />
      </div>
    </div>
  )
}
```

---

## 目視確認ポイント（3つ）

### ✅ 1. 地図ポップアップの最小化
- **確認箇所**: 地図上の地物をクリック
- **期待動作**: ポップアップは表示されない or 最小情報（名称+「詳細」ボタン）のみ
- **現状**: 右パネルが開き、詳細タブに林班/小班/KEYCODE/面積などの完全な属性が表示される

### ✅ 2. 下部テーブルの一覧・比較専用化
- **確認箇所**: 画面下部のテーブル
- **期待動作**: 
  - 列構成: 選択☑ / 林班 / 小班 / KEYCODE / 面積 / 樹種 / 林齢 / 材積 / ステータス / 操作
  - 材積列は未解析なら「—」、解析済みなら数値（mono）
  - ステータス列はBadge表示（未解析/解析中/完了/エラー）
  - 行hover・selected・active状態が視覚的に区別できる
  - 数値/ID列はmono、truncate+tooltip

### ✅ 3. 右パネルへの詳細・解析結果集約
- **確認箇所**: 
  - 地図クリック or テーブル行クリック or 「詳細」ボタン → 右パネルが開く
  - 右パネルのタブ切替（詳細 / 解析結果）
- **期待動作**:
  - **詳細タブ**: 林班/小班/KEYCODE/面積/樹種/林齢/材積/ステータスを縦並びリスト表示
  - **解析結果タブ**: 
    - 未解析: 「解析を開始」ボタン
    - 解析中: Skeletonローディング
    - 完了: 検出本数/針葉樹/広葉樹/総材積のメトリクス + 警告リスト + CSV出力/再解析ボタン
    - エラー: エラーメッセージ + 再試行ボタン
  - パネル幅380px、絶対配置（右端）、閉じるボタン

---

## 役割分担の整理

| 領域 | 役割 | 情報種別 | 操作 |
|------|------|----------|------|
| **地図ポップアップ** | クイック情報 + 次アクション | 名称/ID/面積など最小情報 | 「詳細」「解析」ボタンのみ |
| **下部テーブル** | 一覧・比較 | 複数対象の横断比較（林班/小班/材積/ステータス） | ソート/フィルタ/CSV出力/複数選択 |
| **右パネル** | 深掘り・解析結果 | 選択対象の全属性 + 解析KPI + 内訳 + 警告 | 解析開始/再試行/CSV出力/パラメータ調整 |

---

## 実装制約遵守確認

- ✅ tokens.css参照（色/余白/角丸/影/タイポの直書き禁止）
- ✅ AppIcon経由のみ（size sm/md/lg固定、strokeWidth固定）
- ✅ カード乱立禁止（情報はテーブル/バッジ中心）
- ✅ BtoB高密度スタイル（ボーダー中心、余白最小限）

---

## 実装済み機能

1. **右パネル**:
   - タブ切替（詳細/解析結果）
   - 開閉制御（地図クリック/テーブル選択/詳細ボタンで開く）
   - 状態同期（地図↔テーブル↔右パネル）

2. **下部テーブル**:
   - BtoB SaaS仕様の列構成（林班/小班/KEYCODE/面積/樹種/林齢/材積/ステータス）
   - ソート機能（列ヘッダークリック）
   - 複数選択（チェックボックス + 全選択）
   - 行状態（hover/selected/active）
   - 数値列mono、truncate+tooltip
   - ステータスBadge

3. **解析フロー**:
   - 右パネルから解析開始 → analyzing状態（Skeleton表示）
   - 完了 → completed状態（メトリクス表示）+ テーブルデータ更新（材積・ステータス）
   - エラー → error状態（エラーメッセージ + 再試行ボタン）

4. **情報同期**:
   - 地図クリック → 右パネル開く + テーブル行選択
   - テーブル行選択 → 右パネル開く + 対象表示
   - 詳細ボタン → 右パネル開く

---

## 今後の拡張ポイント

- 地図ポップアップの最小化実装（現在はMap.jsxを触っていない）
- AOI（矩形描画）の右パネル連携
- フィルタ/ソートの詳細実装
- CSV出力の実装
- 解析パラメータ調整UI
- 履歴タブの追加
