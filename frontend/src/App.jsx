import React, { useState, useEffect, useRef } from 'react'
import Map from './Map'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import AttributeTable from './components/AttributeTable'
import RightPanel from './components/RightPanel'
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
  
  // 右パネル
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [selectedRowId, setSelectedRowId] = useState(null)
  
  // 解析
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState('idle') // idle, analyzing, completed, error
  
  // テーブル
  const [tableData, setTableData] = useState([])
  const [tableHeight, setTableHeight] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  
  const tableRef = useRef(null)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)

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

  // 地図上の地物クリック
  const handleFeatureClick = (feature) => {
    console.log('[v0] 地物クリック:', feature)
    setSelectedFeature(feature)
    setRightPanelOpen(true)
    setAnalysisStatus('idle')
    
    // テーブルから該当行を探して選択状態にする
    const rowIndex = tableData.findIndex(row => row.id === feature.id)
    if (rowIndex !== -1) {
      setSelectedRowId(rowIndex)
    }
  }

  // テーブル行選択
  const handleRowSelect = (rowData, index) => {
    console.log('[v0] テーブル行選択:', rowData, index)
    setSelectedFeature(rowData)
    setSelectedRowId(index)
    setRightPanelOpen(true)
  }

  // テーブル行詳細ボタン
  const handleRowDetail = (rowData, index) => {
    console.log('[v0] 詳細ボタン:', rowData, index)
    setSelectedFeature(rowData)
    setSelectedRowId(index)
    setRightPanelOpen(true)
  }

  // 解析開始
  const handleStartAnalysis = () => {
    console.log('[v0] 解析開始:', selectedFeature)
    setAnalysisStatus('analyzing')
    
    // シミュレーション：3秒後に結果を返す
    setTimeout(() => {
      const mockResult = {
        tree_count: 120,
        coniferous_count: 80,
        broadleaf_count: 40,
        total_volume: 350,
        volume: 350,
        warnings: ['境界付近の樹木は検出精度が低下する可能性があります']
      }
      setAnalysisResult(mockResult)
      setAnalysisStatus('completed')
      
      // テーブルデータを更新（材積とステータス）
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

  // 解析再試行
  const handleRetryAnalysis = () => {
    setAnalysisStatus('idle')
    setAnalysisResult(null)
    handleStartAnalysis()
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

  // デモデータ初期化
  useEffect(() => {
    // デモ用のテーブルデータを生成
    const demoData = [
      {
        id: '001',
        rinban: '123',
        shoban: '4',
        keycode: 'KEY-123-4-001',
        area: 1.2,
        species: 'スギ',
        age: 45,
        volume: null,
        status: 'idle'
      },
      {
        id: '002',
        rinban: '123',
        shoban: '5',
        keycode: 'KEY-123-5-002',
        area: 0.8,
        species: 'ヒノキ',
        age: 38,
        volume: 180,
        status: 'completed'
      },
      {
        id: '003',
        rinban: '124',
        shoban: '1',
        keycode: 'KEY-124-1-003',
        area: 2.3,
        species: 'カラマツ',
        age: 52,
        volume: null,
        status: 'idle'
      }
    ]
    setTableData(demoData)
  }, [])

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
              onFeatureClick={handleFeatureClick}
            />
          </div>
          
          <div className="table-section" style={{ height: `${tableHeight}px` }}>
            <AttributeTable 
              data={tableData}
              isResizing={isResizing}
              onResizeStart={handleResizeStart}
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
          onRetryAnalysis={handleRetryAnalysis}
        />
      </div>
    </div>
  )
}

export default App
