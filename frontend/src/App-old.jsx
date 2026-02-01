import React, { useState, useEffect, useRef } from 'react'
import Map from './Map'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import AttributeTable from './components/AttributeTable'
import './App.css'
import './components/components.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  // State管理
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('layers')
  const [showAdminBoundaries, setShowAdminBoundaries] = useState(false)
  const [showForestRegistry, setShowForestRegistry] = useState(false)
  const [showRivers, setShowRivers] = useState(false)
  const [showSlope, setShowSlope] = useState(false)
  const [showContour, setShowContour] = useState(false)
  const [result, setResult] = useState(null)
  const [tableData, setTableData] = useState([])
  const [tableHeight, setTableHeight] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const [municipalityNames, setMunicipalityNames] = useState({})
  
  const tableRef = useRef(null)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)

  // 市町村コードマスターを取得
  useEffect(() => {
    fetch(`${API_URL}/api/municipality-codes`)
      .then(res => res.json())
      .then(data => {
        console.log('市町村コードマスター取得:', data)
        setMunicipalityNames(data)
      })
      .catch(err => {
        console.error('市町村コードマスター取得エラー:', err)
        // デフォルト値を設定（2桁の市町村コード）
        setMunicipalityNames({
          '01': '松前町',
          '02': '福島町',
          '03': '知内町',
          '04': '木古内町',
          '05': '北斗市',
          '07': '七飯町',
          '13': '鹿部町',
          '15': '森町',
          '16': '八雲町',
          '17': '長万部町',
          '19': '函館市'
        })
      })
  }, [])

  // 検索実行
  const handleSearch = () => {
    if (!searchQuery.trim()) return
    console.log('[v0] 検索実行:', searchQuery)
    // TODO: 実際の検索ロジックを実装
  }

  // レイヤートグル
  const handleToggleLayer = (layerType) => {
    switch(layerType) {
      case 'admin':
        setShowAdminBoundaries(!showAdminBoundaries)
        break
      case 'forest':
        setShowForestRegistry(!showForestRegistry)
        break
      case 'rivers':
        setShowRivers(!showRivers)
        break
      case 'slope':
        setShowSlope(!showSlope)
        break
      case 'contour':
        setShowContour(!showContour)
        break
    }
  }

  // テーブルリサイズ開始
  const handleResizeStart = (e) => {
    e.preventDefault()
    setIsResizing(true)
    startYRef.current = e.clientY
    startHeightRef.current = tableHeight
  }

  // テーブルリサイズ中
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      const deltaY = startYRef.current - e.clientY
      const newHeight = Math.max(150, Math.min(window.innerHeight * 0.6, startHeightRef.current + deltaY))
      setTableHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // 解析結果が更新されたらテーブルデータも更新
  useEffect(() => {
    if (result && result.tree_points) {
      setTableData(result.tree_points.slice(0, 100)) // 最大100件表示
    }
  }, [result])

  return (
    <div className="app">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
      />
      
      <div className="app-body">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showAdminBoundaries={showAdminBoundaries}
          showForestRegistry={showForestRegistry}
          showRivers={showRivers}
          showSlope={showSlope}
          showContour={showContour}
          onToggleLayer={handleToggleLayer}
        />
        
        <main className="main-content">
          <div className="map-section">
            <Map
              showAdminBoundaries={showAdminBoundaries}
              showForestRegistry={showForestRegistry}
              showRivers={showRivers}
              showSlope={showSlope}
              showContour={showContour}
              municipalityNames={municipalityNames}
              onAnalysisComplete={setResult}
            />
          </div>
          
          <div 
            className="table-section" 
            style={{ height: `${tableHeight}px` }}
            ref={tableRef}
          >
            <AttributeTable
              data={tableData}
              isResizing={isResizing}
              onResizeStart={handleResizeStart}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
