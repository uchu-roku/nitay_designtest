import React, { useState } from 'react'
import AppIcon from './AppIcon'
import Button from './ui/Button'
import Badge from './ui/Badge'
import Tooltip from './ui/Tooltip'

const AttributeTable = ({ 
  data, 
  isResizing, 
  onResizeStart,
  onRowSelect,
  onRowDetail,
  selectedRowId
}) => {
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [selectAll, setSelectAll] = useState(false)

  const handleRowSelect = (id, event) => {
    event?.stopPropagation()
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
    setSelectAll(newSelected.size === data.length)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map((_, idx) => idx)))
    }
    setSelectAll(!selectAll)
  }

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  const handleRowClick = (rowData, index) => {
    if (onRowSelect) {
      onRowSelect(rowData, index)
    }
  }

  const sortedData = data && data.length > 0 ? [...data].sort((a, b) => {
    if (!sortConfig.key) return 0
    const aVal = a[sortConfig.key]
    const bVal = b[sortConfig.key]
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  }) : []

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <Badge variant="success" size="sm">完了</Badge>
      case 'analyzing':
        return <Badge variant="info" size="sm">解析中</Badge>
      case 'error':
        return <Badge variant="error" size="sm">エラー</Badge>
      default:
        return <Badge variant="default" size="sm">未解析</Badge>
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="attribute-table">
        <div className="table-header">
          <div className="resize-handle" onMouseDown={onResizeStart}></div>
          <h3 className="table-title">属性テーブル</h3>
          <div className="table-actions">
            <Badge variant="neutral">0件</Badge>
          </div>
        </div>
        <div className="table-empty-state">
          <AppIcon name="table" size="lg" className="empty-icon" />
          <h4 className="empty-title">データがありません</h4>
          <p className="empty-description">
            地図上で地物を選択するか、解析を実行してください
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
          <Button variant="ghost" size="sm" icon="filter">
            フィルタ
          </Button>
          <Button variant="ghost" size="sm" icon="refresh">
            並替
          </Button>
          <Button variant="ghost" size="sm" icon="export">
            CSV出力
          </Button>
        </div>
      </div>
      
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input 
                  type="checkbox" 
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
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
              <th className="col-sortable col-code" onClick={() => handleSort('keycode')}>
                <div className="th-content">
                  KEYCODE
                  {sortConfig.key === 'keycode' && (
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
              <th className="col-sortable col-numeric" onClick={() => handleSort('volume')}>
                <div className="th-content">
                  材積
                  {sortConfig.key === 'volume' && (
                    <AppIcon name={sortConfig.direction === 'asc' ? 'chevronUp' : 'chevronDown'} size="sm" />
                  )}
                </div>
              </th>
              <th>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr 
                key={index} 
                className={`${selectedRows.has(index) ? 'row-selected' : ''} ${selectedRowId === index ? 'row-active' : ''}`}
                onClick={() => handleRowClick(row, index)}
              >
                <td className="col-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedRows.has(index)}
                    onChange={(e) => handleRowSelect(index, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="col-code">
                  <Tooltip content={row.rinban || '-'}>
                    <span className="truncate">{row.rinban || '-'}</span>
                  </Tooltip>
                </td>
                <td className="col-code">
                  <Tooltip content={row.shoban || '-'}>
                    <span className="truncate">{row.shoban || '-'}</span>
                  </Tooltip>
                </td>
                <td className="col-code">
                  <Tooltip content={row.keycode || '-'}>
                    <span className="truncate">{row.keycode || '-'}</span>
                  </Tooltip>
                </td>
                <td className="col-numeric">{row.area ? `${row.area}ha` : '-'}</td>
                <td>
                  <Tooltip content={row.species || '-'}>
                    <span className="truncate">{row.species || '-'}</span>
                  </Tooltip>
                </td>
                <td className="col-numeric">{row.age ? `${row.age}年` : '-'}</td>
                <td className="col-numeric">{row.volume ? `${row.volume}m³` : '—'}</td>
                <td>{getStatusBadge(row.status)}</td>
                <td>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon="info"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (onRowDetail) onRowDetail(row, index)
                    }}
                  >
                    詳細
                  </Button>
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
