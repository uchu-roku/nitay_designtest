import React, { useState } from 'react'

const AttributeTable = ({ data, isResizing, onResizeStart }) => {
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const handleRowSelect = (id) => {
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

  if (!data || data.length === 0) {
    return (
      <div className="attribute-table">
        <div className="table-header">
          <div className="resize-handle" onMouseDown={onResizeStart}></div>
          <h3 className="table-title">属性テーブル</h3>
        </div>
        <div className="table-empty-state">
          <div className="empty-icon">📊</div>
          <h4 className="empty-title">データがありません</h4>
          <p className="empty-description">
            地図上で地物を選択するか、解析を実行してください
          </p>
          <button className="empty-action">解析を開始</button>
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
          <span className="table-count">{data.length}件</span>
          <button className="table-action-btn">フィルタ</button>
          <button className="table-action-btn">ソート</button>
          <button className="table-action-btn">CSV出力</button>
        </div>
      </div>
      
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input type="checkbox" />
              </th>
              <th className="col-sortable" onClick={() => handleSort('id')}>
                ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="col-sortable" onClick={() => handleSort('type')}>
                種別 {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="col-sortable" onClick={() => handleSort('area')}>
                面積 {sortConfig.key === 'area' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="col-sortable" onClick={() => handleSort('volume')}>
                材積 {sortConfig.key === 'volume' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>樹種</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr 
                key={index} 
                className={selectedRows.has(index) ? 'selected' : ''}
                onClick={() => handleRowSelect(index)}
              >
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedRows.has(index)}
                    onChange={() => handleRowSelect(index)}
                  />
                </td>
                <td>{row.id || index + 1}</td>
                <td>{row.tree_type === 'coniferous' ? '針葉樹' : '広葉樹'}</td>
                <td>{row.area ? `${row.area}ha` : '-'}</td>
                <td>{row.volume ? `${row.volume}m³` : '-'}</td>
                <td>{row.species || 'スギ'}</td>
                <td>
                  <button className="row-action">詳細</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AttributeTable
