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
  const [result, setResult] = useState(null)
  const [tableData, setTableData] = useState([])
  const [tableHeight, setTableHeight] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const [municipalityNames, setMunicipalityNames] = useState({})
  
  // 右パネル
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState('idle') // idle, analyzing, completed, error
  const [analysisResult, setAnalysisResult] = useState(null)
  
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

  // 小班選択時のハンドラー
  const handleForestSelect = async (forestData) => {
    console.log('小班が選択されました:', forestData)
    
    // 属性テーブルに表示するデータを作成
    const tableRow = {
      id: forestData.keycode,
      rinban: forestData.rinban,
      shoban: forestData.syouhan,
      keycode: forestData.keycode,
      municipalityName: forestData.municipalityName,
      area: null,
      forestType: null,
      rinshu: null,
      species: null,
      age: null,
      layerCount: forestData.layers ? forestData.layers.length : 0,
      status: 'loading',
      forestData: forestData // 解析用に元データを保持
    }
    
    // 層データがある場合は最初の層の情報を使用
    if (forestData.layers && forestData.layers.length > 0) {
      const firstLayer = forestData.layers[0]
      tableRow.area = firstLayer['面積'] || null
      tableRow.forestType = firstLayer['森林の種類1名'] || firstLayer['森林の種類1コード'] || null
      tableRow.rinshu = firstLayer['林種名'] || firstLayer['林種コード'] || null
      tableRow.species = firstLayer['樹種1名'] || firstLayer['樹種1コード'] || null
      tableRow.age = firstLayer['林齢'] || null
      tableRow.status = 'idle'
    }
    
    // テーブルデータを更新（既存のデータに追加）
    setTableData(prevData => {
      // 同じkeycodeが既に存在する場合は更新、なければ追加
      const existingIndex = prevData.findIndex(row => row.keycode === forestData.keycode)
      if (existingIndex >= 0) {
        const newData = [...prevData]
        newData[existingIndex] = tableRow
        return newData
      } else {
        return [...prevData, tableRow]
      }
    })
  }

  // 解析開始ハンドラー（属性テーブルから呼ばれる）
  const handleAnalyzeFromTable = async (row) => {
    console.log('解析開始:', row)
    
    if (!row.forestData) {
      console.error('森林簿データがありません')
      return
    }
    
    // 右パネルを開く
    setRightPanelOpen(true)
    setSelectedFeature(row.forestData)
    setAnalysisStatus('analyzing')
    
    try {
      // 地図から小班の境界を取得
      const bounds = window.currentForestBounds
      const polygonCoords = window.currentForestPolygon
      
      if (!bounds) {
        throw new Error('小班の境界情報が取得できません')
      }
      
      console.log('小班の境界:', bounds)
      console.log('小班のポリゴン:', polygonCoords)
      
      // ポリゴン座標をAPIリクエスト用に変換
      const polygonCoordsForApi = polygonCoords ? 
        polygonCoords.map(latLng => ({
          lat: latLng.lat,
          lon: latLng.lng
        })) : null
      
      // バックエンドAPIに解析リクエストを送信
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'map',
          bbox: {
            min_lat: bounds.getSouth(),
            min_lon: bounds.getWest(),
            max_lat: bounds.getNorth(),
            max_lon: bounds.getEast()
          },
          polygon_coords: polygonCoordsForApi,
          forest_registry_id: row.keycode
        })
      })
      
      if (!response.ok) {
        throw new Error('解析に失敗しました')
      }
      
      const result = await response.json()
      console.log('解析結果:', result)
      
      // 針葉樹と広葉樹の本数を計算
      let coniferousCount = 0
      let broadleafCount = 0
      
      if (result.tree_points) {
        result.tree_points.forEach(point => {
          if (point.tree_type === 'coniferous') {
            coniferousCount++
          } else {
            broadleafCount++
          }
        })
      }
      
      setAnalysisResult({
        ...result,
        coniferous_count: coniferousCount,
        broadleaf_count: broadleafCount,
        polygon_coords: polygonCoords // フロントエンド用にポリゴン座標を保持
      })
      setAnalysisStatus('completed')
      
    } catch (error) {
      console.error('解析エラー:', error)
      setAnalysisStatus('error')
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
        
        <main className={`main-content ${rightPanelOpen ? 'with-right-panel' : ''}`}>
          <div className="map-section">
            <Map
              showAdminBoundaries={showAdminBoundaries}
              showForestRegistry={showForestRegistry}
              showRivers={showRivers}
              showSlope={showSlope}
              showContour={showContour}
              municipalityNames={municipalityNames}
              onAnalysisComplete={setResult}
              onForestSelect={handleForestSelect}
              treePoints={analysisResult?.tree_points || []}
              polygonCoords={analysisResult?.polygon_coords || null}
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
              onAnalyze={handleAnalyzeFromTable}
            />
          </div>
        </main>
        
        <RightPanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          analysisResult={analysisResult}
          analysisStatus={analysisStatus}
        />
      </div>
    </div>
  )
}

export default App
