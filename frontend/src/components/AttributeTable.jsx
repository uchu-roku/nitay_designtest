import React, { useState, useEffect } from 'react'
import AppIcon from './AppIcon'
import Button from './ui/Button'
import Badge from './ui/Badge'

const AttributeTable = ({ data, isResizing, onResizeStart, onAnalyzeSelected }) => {
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  // データが変更されたら、複層区分が1以下の行のみを自動的に選択
  useEffect(() => {
    if (data && data.length > 0) {
      const selectableIndices = new Set(
        data
          .map((row, index) => {
            // 複層区分が2以上（下層）の場合は選択しない
            if (row.fukusouKubun && parseInt(row.fukusouKubun) >= 2) {
              return null
            }
            return index
          })
          .filter(index => index !== null)
      )
      setSelectedRows(selectableIndices)
    } else {
      setSelectedRows(new Set())
    }
  }, [data])

  const handleRowSelect = (id) => {
    const row = data[id]
    // 複層区分が2以上（下層）の場合は選択不可
    if (row && row.fukusouKubun && parseInt(row.fukusouKubun) >= 2) {
      return
    }
    
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  const sortedData = data && data.length > 0 ? [...data].sort((a, b) => {
    if (!sortConfig.key) return 0
    const aVal = a[sortConfig.key]
    const bVal = b[sortConfig.key]
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  }) : []

  // 選択された行の合計面積を計算
  const calculateTotalArea = () => {
    if (selectedRows.size === 0) return 0
    const selectedData = Array.from(selectedRows).map(index => data[index]).filter(Boolean)
    const total = selectedData.reduce((sum, row) => {
      const area = parseFloat(row.area) || 0
      return sum + area
    }, 0)
    return total.toFixed(2)
  }

  const totalArea = calculateTotalArea()

  if (!data || data.length === 0) {
    return (
      <div className="attribute-table">
        <div className="table-header">
          <div className="resize-handle" onMouseDown={onResizeStart}></div>
          <h3 className="table-title">属性テーブル</h3>
        </div>
        <div className="table-empty-state">
          <AppIcon name="table" size="lg" className="empty-icon" />
          <h4 className="empty-title">データがありません</h4>
          <p className="empty-description">
            森林簿レイヤをオンにして、区域を選択してください
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="attribute-table">
      <div className="table-header">
        <div className="resize-handle" onMouseDown={onResizeStart}></div>
        <h3 className="table-title">属性テーブル</h3>
        <div className="table-actions">
          <Badge variant="neutral">{data.length}件</Badge>
          {selectedRows.size > 0 && (
            <Badge variant="primary">合計面積: {totalArea}ha</Badge>
          )}
          {data.length > 0 && (
            <button
              style={{
                padding: '8px 16px',
                background: '#2c5f2d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                position: 'relative',
                zIndex: 9999
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('[AttributeTable] ========== ボタンクリック ==========')
                console.log('[AttributeTable] selectedRows:', selectedRows)
                console.log('[AttributeTable] selectedRows.size:', selectedRows.size)
                console.log('[AttributeTable] data:', data)
                console.log('[AttributeTable] onAnalyzeSelected:', onAnalyzeSelected)
                
                // チェックされた行のデータを取得
                const selectedData = Array.from(selectedRows).map(index => data[index]).filter(Boolean)
                console.log('[AttributeTable] チェックされた行:', selectedData)
                console.log('[AttributeTable] チェックされた行の数:', selectedData.length)
                
                if (selectedData.length === 0) {
                  console.log('[AttributeTable] 選択なし - アラート表示')
                  alert('小班を選択してください。')
                  return
                }
                
                if (onAnalyzeSelected) {
                  console.log('[AttributeTable] onAnalyzeSelected を呼び出します')
                  onAnalyzeSelected(selectedData)
                } else {
                  console.error('[AttributeTable] onAnalyzeSelected が定義されていません')
                }
              }}
            >
              ✓ 選択した小班を解析 ({selectedRows.size}件)
            </button>
          )}
          <Button variant="ghost" size="sm" icon="filter">フィルタ</Button>
          <Button variant="ghost" size="sm" icon="refresh">並替</Button>
          <Button variant="ghost" size="sm" icon="export">CSV出力</Button>
        </div>
      </div>
      
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input type="checkbox" />
              </th>
              <th className="col-sortable col-code" onClick={() => handleSort('rinban')}>
                <div className="th-content">
                  林班
                  {sortConfig.key === 'rinban' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
              <th className="col-sortable col-code" onClick={() => handleSort('shoban')}>
                <div className="th-content">
                  小班
                  {sortConfig.key === 'shoban' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
              <th className="col-sortable" onClick={() => handleSort('municipalityName')}>
                <div className="th-content">
                  市町村
                  {sortConfig.key === 'municipalityName' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
              <th className="col-sortable col-numeric" onClick={() => handleSort('area')}>
                <div className="th-content">
                  面積
                  {sortConfig.key === 'area' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
              <th className="col-sortable" onClick={() => handleSort('forestType')}>
                <div className="th-content">
                  森林種類
                  {sortConfig.key === 'forestType' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
              <th className="col-sortable" onClick={() => handleSort('rinshu')}>
                <div className="th-content">
                  林種
                  {sortConfig.key === 'rinshu' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
              <th className="col-sortable" onClick={() => handleSort('species')}>
                <div className="th-content">
                  樹種
                  {sortConfig.key === 'species' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
              <th className="col-sortable col-numeric" onClick={() => handleSort('age')}>
                <div className="th-content">
                  林齢
                  {sortConfig.key === 'age' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
              <th className="col-sortable" onClick={() => handleSort('fukusouKubun')}>
                <div className="th-content">
                  複層区分
                  {sortConfig.key === 'fukusouKubun' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              // デバッグ: 複層区分の値を確認
              if (index === 0) {
                console.log('[AttributeTable] 最初の行の複層区分:', row.fukusouKubun)
              }
              
              return (
              <tr 
                key={row.keycode || index} 
                className={selectedRows.has(index) ? 'selected' : ''}
                onClick={() => handleRowSelect(index)}
              >
                <td className="col-checkbox">
                  {/* 複層区分が2以上（下層）の場合はチェックボックスを無効化 */}
                  {row.fukusouKubun && parseInt(row.fukusouKubun) >= 2 ? (
                    <input 
                      type="checkbox" 
                      disabled
                      style={{ opacity: 0.3, cursor: 'not-allowed' }}
                      title="下層は選択できません（上層で選択してください）"
                    />
                  ) : (
                    <input 
                      type="checkbox" 
                      checked={selectedRows.has(index)}
                      onChange={() => handleRowSelect(index)}
                    />
                  )}
                </td>
                <td className="col-code">{row.rinban || '-'}</td>
                <td className="col-code">{row.shoban || '-'}</td>
                <td>{row.municipalityName || '-'}</td>
                <td className="col-numeric">{row.area ? `${row.area}ha` : '-'}</td>
                <td>{row.forestType || '-'}</td>
                <td>{row.rinshu || '-'}</td>
                <td>{row.species || '-'}</td>
                <td className="col-numeric">{row.age ? `${row.age}年` : '-'}</td>
                <td>{row.fukusouKubun || '-'}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AttributeTable
