import React, { useState } from 'react'
import AppIcon from './AppIcon'
import Button from './ui/Button'
import Badge from './ui/Badge'

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
          <AppIcon name="table" size="lg" className="empty-icon" />
          <h4 className="empty-title">データがありません</h4>
          <p className="empty-description">
            地図上で地物を選択するか、解析を実行してください
          </p>
          <Button variant="primary" size="base">解析を開始</Button>
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
              <th className="col-sortable" onClick={() => handleSort('id')}>
                <div className="th-content">
                  ID 
                  {sortConfig.key === 'id' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
              <th className="col-sortable" onClick={() => handleSort('type')}>
                <div className="th-content">
                  種別
                  {sortConfig.key === 'type' && (
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
              <th className="col-sortable col-numeric" onClick={() => handleSort('volume')}>
                <div className="th-content">
                  材積
                  {sortConfig.key === 'volume' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
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
                <td className="col-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedRows.has(index)}
                    onChange={() => handleRowSelect(index)}
                  />
                </td>
                <td className="col-code">{row.id || index + 1}</td>
                <td>
                  <Badge variant={row.tree_type === 'coniferous' ? 'success' : 'warning'} size="sm">
                    {row.tree_type === 'coniferous' ? '針葉樹' : '広葉樹'}
                  </Badge>
                </td>
                <td className="col-numeric">{row.area ? `${row.area}ha` : '-'}</td>
                <td className="col-numeric">{row.volume ? `${row.volume}m³` : '-'}</td>
                <td>{row.species || 'スギ'}</td>
                <td>
                  <Button variant="ghost" size="sm" icon="info">詳細</Button>
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
