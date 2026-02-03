import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
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
  const [theme, setTheme] = useState(() => {
    // ローカルストレージからテーマを読み込む
    return localStorage.getItem('theme') || 'light'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMunicipality, setSelectedMunicipality] = useState([]) // 市町村フィルタ（複数選択）
  const [activeTab, setActiveTab] = useState('layers')
  const [showAdminBoundaries, setShowAdminBoundaries] = useState(false)
  const [showForestRegistry, setShowForestRegistry] = useState(false)
  const [showRivers, setShowRivers] = useState(false)
  const [showSlope, setShowSlope] = useState(false)
  const [showContour, setShowContour] = useState(false)
  const [slopeOpacity, setSlopeOpacity] = useState(0.7) // 傾斜図の透明度
  const [contourOpacity, setContourOpacity] = useState(0.7) // 等高線の透明度
  
  // 描画モード
  const [drawMode, setDrawMode] = useState(false)
  const [drawType, setDrawType] = useState(null) // 'rectangle' or 'polygon'
  
  // チャットボット
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isChatProcessing, setIsChatProcessing] = useState(false)
  
  // 右パネル
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [selectedRowId, setSelectedRowId] = useState(null)
  
  // 解析
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisStatus, setAnalysisStatus] = useState('idle') // idle, analyzing, completed, error
  const [treePoints, setTreePoints] = useState([]) // メッシュ表示用の樹木位置データ
  
  // 画像アップロード
  const [presetImages, setPresetImages] = useState([])
  const [selectedImageId, setSelectedImageId] = useState(null)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [imageMetadata, setImageMetadata] = useState(null)
  const [imageBounds, setImageBounds] = useState(null)
  
  // テーブル
  const [tableData, setTableData] = useState([])
  const [tableHeight, setTableHeight] = useState(150)  // 初期高さを300→150に変更
  const [isResizing, setIsResizing] = useState(false)
  const [municipalityNames, setMunicipalityNames] = useState({})
  
  const tableRef = useRef(null)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)

  // テーマをドキュメントに適用
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // テーマ切り替え
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  // 市町村コードマスターを取得
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const municipalityCodesUrl = `${baseUrl}data/administrative/kitamirinsyou/municipality_codes.json`
    
    fetch(municipalityCodesUrl)
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
          '05': '七飯町',
          '07': '鹿部町',
          '13': '森町',
          '15': '八雲町',
          '16': '長万部町',
          '17': '江差町',
          '19': '上ノ国町'
        })
      })
  }, [])

  // プリセット画像リストを取得
  useEffect(() => {
    // MVP版: バックエンドAPIを使わず、静的な画像リストを使用
    const staticImages = [{
      id: '02_GE_modified',
      filename: '02_GE_modified.png',
      path: 'sample-images/02_GE_modified.png'
    }]
    
    console.log('[App.jsx] プリセット画像リスト（静的）:', staticImages)
    setPresetImages(staticImages)
  }, [])

  // 検索実行
  const handleSearch = () => {
    if (!searchQuery.trim()) return
    console.log('[App.jsx] 検索実行:', searchQuery, '市町村:', selectedMunicipality)
    
    // Map.jsxのグローバル検索関数を呼び出す
    if (window.handleForestSearch) {
      // 森林簿レイヤーが表示されていない場合は表示する
      if (!showForestRegistry) {
        setShowForestRegistry(true)
        // レイヤーが読み込まれるまで少し待つ
        setTimeout(() => {
          window.handleForestSearch(searchQuery, selectedMunicipality) // 配列として渡す
        }, 500)
      } else {
        window.handleForestSearch(searchQuery, selectedMunicipality) // 配列として渡す
      }
    } else {
      console.error('[App.jsx] window.handleForestSearch が定義されていません')
      alert('地図が読み込まれていません。少し待ってから再度お試しください。')
    }
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

  // 描画モード変更
  const handleDrawModeChange = (enabled, type) => {
    console.log('[App.jsx] 描画モード変更:', enabled, type)
    setDrawMode(enabled)
    setDrawType(type)
  }

  // 地図からの解析（描画図形から）
  const handleMapAnalyze = (bounds, polygonCoords = null) => {
    console.log('[App.jsx] 地図からの解析開始')
    console.log('[App.jsx] bounds:', bounds)
    console.log('[App.jsx] polygonCoords:', polygonCoords)
    
    setRightPanelOpen(true)
    setAnalysisStatus('analyzing')
    
    // 境界から座標を取得
    const minLat = bounds.getSouth()
    const maxLat = bounds.getNorth()
    const minLon = bounds.getWest()
    const maxLon = bounds.getEast()
    
    console.log('[App.jsx] 解析範囲:', { minLat, maxLat, minLon, maxLon })
    
    // シミュレーション：3秒後に結果を返す
    setTimeout(() => {
      // メッシュ表示用の樹木位置データを生成
      const mockTreePoints = []
      
      // メッシュサイズを計算（50m x 50m）
      const meshSizeM = 50
      const avgLat = (minLat + maxLat) / 2
      const latStep = meshSizeM / 111000
      const lonStep = meshSizeM / (111000 * Math.cos(avgLat * Math.PI / 180))
      
      console.log('[App.jsx] メッシュサイズ:', meshSizeM, 'm x', meshSizeM, 'm')
      console.log('[App.jsx] 解析範囲:', { minLat, maxLat, minLon, maxLon })
      console.log('[App.jsx] ステップ:', { latStep, lonStep })
      
      // グリッド状に樹木位置を生成（図形全体を埋め尽くす）
      let treeIndex = 0
      
      for (let lat = minLat; lat < maxLat; lat += latStep) {
        for (let lon = minLon; lon < maxLon; lon += lonStep) {
          // グリッドの中心に配置
          const centerLat = lat + latStep / 2
          const centerLon = lon + lonStep / 2
          
          // 境界チェック
          if (centerLat <= maxLat && centerLon <= maxLon) {
            // 針葉樹と広葉樹をランダムに配置（針葉樹67%）
            const isConiferous = Math.random() < 0.67
            
            mockTreePoints.push({
              lat: centerLat,
              lon: centerLon,
              tree_type: isConiferous ? 'coniferous' : 'broadleaf',
              dbh: 20 + Math.random() * 40, // 胸高直径 20-60cm
              volume: 0.5 + Math.random() * 3 // 材積 0.5-3.5m³
            })
            
            treeIndex++
          }
        }
      }
      
      // 実際に生成された樹木数でカウントを更新
      const actualConiferousCount = mockTreePoints.filter(p => p.tree_type === 'coniferous').length
      const actualBroadleafCount = mockTreePoints.filter(p => p.tree_type === 'broadleaf').length
      const totalVolume = mockTreePoints.reduce((sum, p) => sum + p.volume, 0)
      
      console.log('[App.jsx] 生成されたメッシュ数:', mockTreePoints.length, '個')
      console.log('[App.jsx] 針葉樹:', actualConiferousCount, '本、広葉樹:', actualBroadleafCount, '本')
      
      const mockResult = {
        tree_count: mockTreePoints.length,
        coniferous_count: actualConiferousCount,
        broadleaf_count: actualBroadleafCount,
        total_volume: Math.round(totalVolume),
        volume: Math.round(totalVolume),
        volume_m3: Math.round(totalVolume),
        tree_points: mockTreePoints, // メッシュ表示用
        polygon_coords: polygonCoords, // ポリゴン座標を保存
        warnings: ['境界付近の樹木は検出精度が低下する可能性があります', 'MVP版：簡易シミュレーションです']
      }
      
      setAnalysisResult(mockResult)
      setAnalysisStatus('completed')
      setTreePoints(mockTreePoints) // メッシュ表示用データをセット
      
      console.log('[App.jsx] 解析完了、樹木位置データ:', mockTreePoints.length, '本（グリッド配置）')
      console.log('[App.jsx] メッシュサイズ:', meshSizeM, 'm x', meshSizeM, 'm')
    }, 3000)
  }

  // 地図上の地物クリック（森林簿選択）
  const handleFeatureClick = (feature) => {
    console.log('[App.jsx] ========== handleFeatureClick 開始 ==========')
    console.log('[App.jsx] feature:', feature)
    console.log('[App.jsx] 層データ:', feature.layers)
    console.log('[App.jsx] 選択解除フラグ:', feature.isDeselect)
    
    // 選択解除の場合
    if (feature.isDeselect) {
      console.log('[App.jsx] 選択解除処理')
      setTableData(prevTableData => {
        const newTableData = prevTableData.filter(row => row.keycode !== feature.keycode)
        console.log('[App.jsx] 選択解除後のtableData:', newTableData)
        return newTableData
      })
      return
    }
    
    // テーブルに追加（重複チェックはsetTableData内で行う）
    setTableData(prevTableData => {
      console.log('[App.jsx] 現在のtableData:', prevTableData)
      console.log('[App.jsx] tableData.length:', prevTableData.length)
      
      // テーブルから該当行を探す
      const existingIndex = prevTableData.findIndex(row => row.keycode === feature.keycode)
      console.log('[App.jsx] existingIndex:', existingIndex)
      
      if (existingIndex !== -1) {
        // 既にテーブルにある場合はスキップ（重複追加を防ぐ）
        console.log('[App.jsx] 既にテーブルに存在します:', existingIndex)
        console.log('[App.jsx] スキップします')
        return prevTableData // 変更なし
      }
      
      console.log('[App.jsx] 新規追加処理を開始')
      
      // 層データから詳細情報を抽出（第1層の情報を使用）
      const firstLayer = feature.layers && feature.layers.length > 0 ? feature.layers[0] : null
      console.log('[App.jsx] 第1層データ:', firstLayer)
      
      // 面積を計算（層データから）
      let totalArea = '—'
      if (firstLayer && firstLayer['面積']) {
        const areaValue = parseFloat(firstLayer['面積'])
        if (!isNaN(areaValue)) {
          totalArea = areaValue.toFixed(2)
        }
      }
      
      // 森林種類を取得（コードまたは名前）
      const forestType = firstLayer ? (
        firstLayer['森林の種類1名'] || 
        firstLayer['森林の種類1コード'] ||
        '—'
      ) : '—'
      
      // 林種を取得（名前またはコード）
      const rinshu = firstLayer ? (
        firstLayer['林種名'] ||
        firstLayer['林種コード'] ||
        '—'
      ) : '—'
      
      // 樹種を取得（名前またはコード）
      const speciesCode = firstLayer ? (
        firstLayer['樹種1名'] ||
        firstLayer['樹種1コード'] ||
        '—'
      ) : '—'
      
      // 林齢を取得
      const age = firstLayer ? (
        firstLayer['林齢'] ||
        '—'
      ) : '—'
      
      // 複層区分を取得（複数層がある場合は両方表示）
      let fukusouKubun = '—'
      if (feature.layers && feature.layers.length > 0) {
        console.log('[App.jsx] 複層区分を抽出:', feature.layers)
        
        const kubunValues = feature.layers
          .map((layer, idx) => {
            console.log(`[App.jsx] 層${idx + 1}:`, layer)
            
            // 複数のフィールド名を試す
            const kubun = layer['複層区分名'] || 
                         layer['複層区分コード'] || 
                         layer['複層区分'] ||
                         layer['fukusou_kubun'] ||
                         layer['fukusouKubun']
            
            console.log(`[App.jsx] 複層区分 (層${idx + 1}):`, kubun)
            return kubun
          })
          .filter(val => val !== undefined && val !== null && val !== '—' && val !== 'NULL' && val !== '')
          .map(val => String(val)) // 数値の場合も文字列に変換
        
        console.log('[App.jsx] 抽出された複層区分:', kubunValues)
        
        if (kubunValues.length > 0) {
          fukusouKubun = kubunValues.join(' / ')
          console.log('[App.jsx] 結合後の複層区分:', fukusouKubun)
        }
      }
      
      // 複数層がある場合は、各層を別々の行として追加
      const newRows = []
      
      if (feature.layers && feature.layers.length > 1) {
        // 複層の場合：各層を別々の行として作成
        feature.layers.forEach((layer, layerIndex) => {
          // 面積を計算
          let layerArea = '—'
          if (layer['面積']) {
            const areaValue = parseFloat(layer['面積'])
            if (!isNaN(areaValue)) {
              layerArea = areaValue.toFixed(2)
            }
          }
          
          // 森林種類を取得
          const layerForestType = layer['森林の種類1名'] || 
                                  layer['森林の種類1コード'] ||
                                  '—'
          
          // 林種を取得
          const layerRinshu = layer['林種名'] ||
                             layer['林種コード'] ||
                             '—'
          
          // 樹種を取得
          const layerSpecies = layer['樹種1名'] ||
                              layer['樹種1コード'] ||
                              '—'
          
          // 林齢を取得
          const layerAge = layer['林齢'] || '—'
          
          // 複層区分を取得
          const layerFukusouKubun = layer['複層区分名'] || 
                                   layer['複層区分コード'] || 
                                   layer['複層区分'] ||
                                   '—'
          
          newRows.push({
            id: `${feature.keycode}_layer${layerIndex + 1}`,
            keycode: feature.keycode,
            rinban: feature.rinban || '—',
            shoban: feature.syouhan || '—',
            municipalityName: feature.municipalityName || '—',
            area: layerArea,
            forestType: layerForestType,
            rinshu: layerRinshu,
            species: layerSpecies,
            age: layerAge,
            layerCount: feature.layers.length,
            layerIndex: layerIndex + 1, // 第何層か
            fukusouKubun: String(layerFukusouKubun),
            layers: feature.layers || [],
            isMultiLayer: true
          })
        })
      } else {
        // 単層の場合：1行のみ
        newRows.push({
          id: feature.keycode,
          keycode: feature.keycode,
          rinban: feature.rinban || '—',
          shoban: feature.syouhan || '—',
          municipalityName: feature.municipalityName || '—',
          area: totalArea,
          forestType: forestType,
          rinshu: rinshu,
          species: speciesCode,
          age: age,
          layerCount: feature.layers?.length || 1,
          layerIndex: null,
          fukusouKubun: fukusouKubun,
          layers: feature.layers || [],
          isMultiLayer: false
        })
      }
      
      console.log('[App.jsx] 新しい行:', newRows)
      console.log('[App.jsx] 新しい行の複層区分:', newRows.map(r => r.fukusouKubun))
      const newTableData = [...prevTableData, ...newRows]
      console.log('[App.jsx] 追加後のtableData:', newTableData)
      console.log('[App.jsx] 追加後のtableData.length:', newTableData.length)
      console.log('[App.jsx] ========== handleFeatureClick 終了 ==========')
      
      return newTableData
    })
    
    // 選択行IDを更新
    setSelectedRowId(prev => {
      // 最新のtableDataの長さを取得するため、少し遅延させる
      setTimeout(() => {
        setSelectedRowId(tableData.length)
      }, 0)
      return prev
    })
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

  // 解析開始（テーブルの解析ボタンから呼ばれる）
  const handleAnalyze = (rowData) => {
    console.log('[App.jsx] 解析開始:', rowData)
    console.log('[App.jsx] isMultiple:', rowData.isMultiple)
    console.log('[App.jsx] bounds:', rowData.bounds)
    console.log('[App.jsx] polygons:', rowData.polygons?.length)
    
    setSelectedFeature(rowData)
    setRightPanelOpen(true)
    setAnalysisStatus('analyzing')
    
    // 選択された小班の位置情報を取得
    let forestBounds
    
    // 複数小班の場合は渡されたboundsを使用
    if (rowData.isMultiple && rowData.bounds) {
      forestBounds = rowData.bounds
      console.log('[App.jsx] 複数小班の解析:', rowData.polygons?.length, '個のポリゴン')
    } else {
      // 単一小班の場合はグローバル変数から取得
      forestBounds = window.currentForestBounds
    }
    
    // シミュレーション：3秒後に結果を返す
    setTimeout(() => {
      // メッシュ表示用の樹木位置データを生成
      const mockTreePoints = []
      
      // 選択された小班の境界を使用
      let minLat, maxLat, minLon, maxLon
      
      if (forestBounds) {
        minLat = forestBounds._southWest.lat
        maxLat = forestBounds._northEast.lat
        minLon = forestBounds._southWest.lng
        maxLon = forestBounds._northEast.lng
        
        console.log('[App.jsx] 小班の境界:', { minLat, maxLat, minLon, maxLon })
      } else {
        // フォールバック: 函館中心
        minLat = 41.765
        maxLat = 41.775
        minLon = 140.725
        maxLon = 140.735
        console.log('[App.jsx] 小班境界が見つかりません。デフォルト位置を使用')
      }
      
      // メッシュサイズを計算（50m x 50m）
      const meshSizeM = 50
      const avgLat = (minLat + maxLat) / 2
      const latStep = meshSizeM / 111000
      const lonStep = meshSizeM / (111000 * Math.cos(avgLat * Math.PI / 180))
      
      // 複数小班の場合は樹木数を増やす
      const polygonCount = rowData.isMultiple && rowData.polygons ? rowData.polygons.length : 1
      const baseTreeCount = 120
      const totalTrees = baseTreeCount * polygonCount
      const coniferousRatio = 0.67 // 針葉樹の割合
      const coniferousCount = Math.floor(totalTrees * coniferousRatio)
      
      console.log('[App.jsx] ポリゴン数:', polygonCount)
      console.log('[App.jsx] 予定樹木数:', totalTrees, '本（針葉樹:', coniferousCount, '本）')
      
      // グリッド状に樹木位置を生成（隙間なく、重複なし）
      let treeIndex = 0
      
      for (let lat = minLat; lat < maxLat && treeIndex < totalTrees; lat += latStep) {
        for (let lon = minLon; lon < maxLon && treeIndex < totalTrees; lon += lonStep) {
          // グリッドの中心に配置
          const centerLat = lat + latStep / 2
          const centerLon = lon + lonStep / 2
          
          // 境界チェック
          if (centerLat <= maxLat && centerLon <= maxLon) {
            const isConiferous = treeIndex < coniferousCount
            
            mockTreePoints.push({
              lat: centerLat,
              lon: centerLon,
              tree_type: isConiferous ? 'coniferous' : 'broadleaf',
              dbh: 20 + Math.random() * 40, // 胸高直径 20-60cm
              volume: 0.5 + Math.random() * 3 // 材積 0.5-3.5m³
            })
            
            treeIndex++
          }
        }
      }
      
      // 実際に生成された樹木数でカウントを更新
      const actualConiferousCount = mockTreePoints.filter(p => p.tree_type === 'coniferous').length
      const actualBroadleafCount = mockTreePoints.filter(p => p.tree_type === 'broadleaf').length
      const totalVolume = mockTreePoints.reduce((sum, p) => sum + p.volume, 0)
      
      const mockResult = {
        tree_count: mockTreePoints.length,
        coniferous_count: actualConiferousCount,
        broadleaf_count: actualBroadleafCount,
        total_volume: Math.round(totalVolume),
        volume: Math.round(totalVolume),
        volume_m3: Math.round(totalVolume),
        tree_points: mockTreePoints, // メッシュ表示用
        warnings: ['境界付近の樹木は検出精度が低下する可能性があります'],
        polygon_count: polygonCount // 解析した小班数
      }
      
      setAnalysisResult(mockResult)
      setAnalysisStatus('completed')
      setTreePoints(mockTreePoints) // メッシュ表示用データをセット
      
      console.log('[App.jsx] 解析完了、樹木位置データ:', mockTreePoints.length, '本（グリッド配置）')
      console.log('[App.jsx] メッシュサイズ:', meshSizeM, 'm x', meshSizeM, 'm')
      
      // テーブルデータを更新（材積とステータス）
      const rowIndex = tableData.findIndex(row => row.keycode === rowData.keycode)
      if (rowIndex !== -1) {
        const newTableData = [...tableData]
        newTableData[rowIndex] = {
          ...newTableData[rowIndex],
          volume: mockResult.volume,
          status: 'completed'
        }
        setTableData(newTableData)
      }
    }, 3000)
  }

  // 選択した複数小班を解析
  const handleAnalyzeSelected = (selectedData) => {
    console.log('[App.jsx] ========== handleAnalyzeSelected 開始 ==========')
    console.log('[App.jsx] 選択した小班を解析:', selectedData?.length || 0, '件')
    console.log('[App.jsx] selectedData:', selectedData)
    
    if (!selectedData || selectedData.length === 0) {
      console.log('[App.jsx] 小班が選択されていません')
      alert('小班を選択してください。')
      return
    }
    
    // 選択された小班のkeycodeを取得
    const selectedKeycodes = selectedData.map(row => row.keycode)
    console.log('[App.jsx] 選択されたKEYCODE:', selectedKeycodes)
    
    // Map.jsxのグローバル関数を使用して、選択された小班のみを解析
    // highlightedLayersMapから選択された小班のみをフィルタリング
    if (window.highlightedLayersMap) {
      const highlightedLayers = window.highlightedLayersMap
      console.log('[App.jsx] highlightedLayersMap.size:', highlightedLayers.size)
      
      // 選択された小班のポリゴンを収集
      const selectedPolygons = []
      let minLat = Infinity, maxLat = -Infinity
      let minLon = Infinity, maxLon = -Infinity
      
      selectedKeycodes.forEach(keycode => {
        const layer = highlightedLayers.get(keycode)
        console.log('[App.jsx] keycode:', keycode, 'layer:', layer)
        
        if (layer) {
          // layerが単一レイヤーかGeoJSONレイヤーグループかを判定
          if (layer.getLatLngs) {
            // 単一レイヤーの場合（Map.jsxで保存されているのは単一レイヤー）
            console.log('[App.jsx] 単一レイヤーを処理:', keycode)
            let latLngs = layer.getLatLngs()
            while (Array.isArray(latLngs[0]) && latLngs[0].lat === undefined) {
              latLngs = latLngs[0]
            }
            
            // 座標を配列に変換
            const coords = latLngs.map(latLng => ({
              lat: latLng.lat,
              lng: latLng.lng
            }))
            selectedPolygons.push(coords)
            
            // 境界を計算
            coords.forEach(coord => {
              minLat = Math.min(minLat, coord.lat)
              maxLat = Math.max(maxLat, coord.lat)
              minLon = Math.min(minLon, coord.lng)
              maxLon = Math.max(maxLon, coord.lng)
            })
          } else if (layer.eachLayer) {
            // GeoJSONレイヤーグループの場合
            console.log('[App.jsx] レイヤーグループを処理:', keycode)
            layer.eachLayer((l) => {
              let latLngs = l.getLatLngs()
              while (Array.isArray(latLngs[0]) && latLngs[0].lat === undefined) {
                latLngs = latLngs[0]
              }
              
              // 座標を配列に変換
              const coords = latLngs.map(latLng => ({
                lat: latLng.lat,
                lng: latLng.lng
              }))
              selectedPolygons.push(coords)
              
              // 境界を計算
              coords.forEach(coord => {
                minLat = Math.min(minLat, coord.lat)
                maxLat = Math.max(maxLat, coord.lat)
                minLon = Math.min(minLon, coord.lng)
                maxLon = Math.max(maxLon, coord.lng)
              })
            })
          } else {
            console.error('[App.jsx] レイヤーの型が不明:', layer)
          }
        }
      })
      
      console.log('[App.jsx] 選択されたポリゴン数:', selectedPolygons.length)
      console.log('[App.jsx] 解析範囲:', { minLat, maxLat, minLon, maxLon })
      
      if (selectedPolygons.length > 0) {
        // 境界を作成
        const bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon])
        
        // 解析を実行（複数ポリゴン）
        handleAnalyze({ 
          keycode: 'multiple',
          bounds: bounds,
          polygons: selectedPolygons,
          isMultiple: true
        })
      } else {
        console.error('[App.jsx] 選択された小班のポリゴンが見つかりません')
        alert('選択された小班のデータが見つかりません。')
      }
    } else {
      console.error('[App.jsx] window.highlightedLayersMap が定義されていません')
      alert('地図データが読み込まれていません。')
    }
    
    console.log('[App.jsx] ========== handleAnalyzeSelected 終了 ==========')
  }

  // 解析再試行
  const handleRetryAnalysis = () => {
    setAnalysisStatus('analyzing')
    setAnalysisResult(null)
    
    // 再度解析を実行
    setTimeout(() => {
      const mockResult = {
        tree_count: 120,
        coniferous_count: 80,
        broadleaf_count: 40,
        total_volume: 350,
        volume: 350,
        volume_m3: 350,
        warnings: ['境界付近の樹木は検出精度が低下する可能性があります']
      }
      setAnalysisResult(mockResult)
      setAnalysisStatus('completed')
    }, 3000)
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
    // 初期状態では空のテーブル（選択された小班のみ表示）
    setTableData([])
  }, [])

  // プリセット画像選択
  const handlePresetImageSelect = async (imageId) => {
    console.log('[App.jsx] プリセット画像選択:', imageId)
    setIsLoadingImage(true)
    
    try {
      // MVP版: バックエンドAPIを使わず、直接画像パスと座標情報を設定
      const imagePath = `sample-images/${imageId}.png`
      
      // TIFFファイルから取得した実際の座標情報（函館付近）
      const mockBbox = {
        min_lat: 41.794053826085,
        min_lon: 140.58585197971667,
        max_lat: 41.795881627054484,
        max_lon: 140.5898721292174
      }
      
      const mockMetadata = {
        bbox: mockBbox,
        width: 1000,
        height: 1000,
        crs: 'EPSG:4326',
        has_geotiff: true,
        warnings: [
          'MVP版: TIFFファイルから座標情報を取得しました',
          '位置: 北緯41.79度、東経140.58度（函館付近）'
        ]
      }
      
      setImageMetadata(mockMetadata)
      setImageBounds(mockBbox)
      setSelectedImageId(imagePath)  // 画像パスを保存
      
      console.log('[App.jsx] 画像パス:', imagePath)
      console.log('[App.jsx] 画像境界:', mockBbox)
      
      // アップロードタブに切り替え（画像が表示されることを確認しやすくする）
      setActiveTab('upload')
      
      // 成功メッセージ
      alert(`画像「${imageId}.png」を読み込みました。\n地図上に表示されます。\n\n位置: 函館付近（北緯41.79度、東経140.58度）`)
      
    } catch (err) {
      console.error('[App.jsx] プリセット画像読み込みエラー:', err)
      alert('画像の読み込みに失敗しました。')
      setSelectedImageId(null)
    } finally {
      setIsLoadingImage(false)
    }
  }

  // チャット送信処理
  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isChatProcessing) return

    const userMessage = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput('')
    setIsChatProcessing(true)

    // 特定の文言をチェック
    if (userMessage === '札幌市全体の材積を解析したい。') {
      // 1. 考え中メッセージ
      await new Promise(resolve => setTimeout(resolve, 800))
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '札幌市全体の材積解析を開始します...',
        isTyping: true 
      }])

      // 2. データ読み込み中
      await new Promise(resolve => setTimeout(resolve, 1500))
      setChatMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: '行政区域データを読み込んでいます...',
          isTyping: true
        }
        return newMessages
      })

      // 3. 札幌市のポリゴンデータを読み込む
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      try {
        let allPolygons = []
        let minLat, maxLat, minLon, maxLon
        
        // 実際のGeoJSONデータを読み込む試み
        try {
          const baseUrl = import.meta.env.BASE_URL || '/'
          const adminUrl = `${baseUrl}data/administrative/admin_simple.geojson`
          const response = await fetch(adminUrl)
          
          if (!response.ok) {
            throw new Error('GeoJSONファイルが見つかりません')
          }
          
          const data = await response.json()

          // 札幌市のフィーチャーを抽出
          const sapporoFeatures = data.features.filter(feature => {
            const city = feature.properties.N03_004 || ''
            const ward = feature.properties.N03_005 || ''
            return city.includes('札幌') || ward.includes('中央') || ward.includes('北区') || 
                   ward.includes('東区') || ward.includes('白石') || ward.includes('豊平') || 
                   ward.includes('南区') || ward.includes('西区') || ward.includes('厚別') || 
                   ward.includes('手稲') || ward.includes('清田')
          })

          if (sapporoFeatures.length > 0) {
            // ポリゴン座標を抽出
            sapporoFeatures.forEach(feature => {
              if (feature.geometry.type === 'Polygon') {
                const coords = feature.geometry.coordinates[0].map(coord => ({
                  lat: coord[1],
                  lon: coord[0]
                }))
                allPolygons.push(coords)
              } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                  const coords = polygon[0].map(coord => ({
                    lat: coord[1],
                    lon: coord[0]
                  }))
                  allPolygons.push(coords)
                })
              }
            })

            // 境界を計算
            minLat = Infinity
            maxLat = -Infinity
            minLon = Infinity
            maxLon = -Infinity
            allPolygons.forEach(polygon => {
              polygon.forEach(coord => {
                minLat = Math.min(minLat, coord.lat)
                maxLat = Math.max(maxLat, coord.lat)
                minLon = Math.min(minLon, coord.lon)
                maxLon = Math.max(maxLon, coord.lon)
              })
            })
            
            console.log('[チャット] 実際のGeoJSONから札幌市データを読み込みました:', allPolygons.length, 'ポリゴン')
            console.log('[チャット] 計算された境界:', { minLat, maxLat, minLon, maxLon })
            console.log('[チャット] 最初のポリゴンのサンプル座標:', allPolygons[0]?.slice(0, 3))
          } else {
            throw new Error('札幌市のフィーチャーが見つかりません')
          }
        } catch (geoJsonError) {
          // GeoJSONが読み込めない場合はモックデータを使用
          console.warn('[チャット] GeoJSONの読み込みに失敗、モックデータを使用:', geoJsonError.message)
          
          // 札幌市の概算範囲（モックデータ）
          minLat = 42.85
          maxLat = 43.20
          minLon = 141.05
          maxLon = 141.55
          
          // 札幌市の大まかな矩形ポリゴンを生成
          allPolygons = [[
            { lat: minLat, lon: minLon },
            { lat: minLat, lon: maxLon },
            { lat: maxLat, lon: maxLon },
            { lat: maxLat, lon: minLon },
            { lat: minLat, lon: minLon }
          ]]
          
          console.log('[チャット] モックデータで札幌市範囲を生成しました')
        }

        // 簡易解析を実行（モック）
        const latDiff = maxLat - minLat
        const lonDiff = maxLon - minLon
        const avgLat = (minLat + maxLat) / 2
        const areaKm2 = latDiff * 111 * lonDiff * 111 * Math.cos(avgLat * Math.PI / 180)
        
        const treesPerKm2 = Math.floor(Math.random() * 700) + 800
        const treeCount = Math.floor(areaKm2 * treesPerKm2)
        const volumePerTree = Math.random() * 0.5 + 0.3
        const totalVolume = treeCount * volumePerTree

        // メッシュデータを生成（実際のポリゴン範囲を使用）
        const mockTreePoints = []
        const meshSizeM = 500  // 500m四方（より大きく、全域をカバー）
        const latStep = meshSizeM / 111000
        const lonStep = meshSizeM / (111000 * Math.cos(avgLat * Math.PI / 180))
        
        const maxMeshes = 10000  // 上限を10000に増やす
        let meshCount = 0
        
        console.log('[チャット] メッシュ生成範囲:', { minLat, maxLat, minLon, maxLon })
        console.log('[チャット] メッシュサイズ:', meshSizeM, 'm四方')
        console.log('[チャット] メッシュステップ:', { latStep, lonStep })
        
        // ポリゴン内判定関数
        const isPointInPolygon = (point, polygon) => {
          const [x, y] = point
          let inside = false
          for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].lon
            const yi = polygon[i].lat
            const xj = polygon[j].lon
            const yj = polygon[j].lat
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
            if (intersect) inside = !inside
          }
          return inside
        }
        
        // グリッド生成（ポリゴン内のみ）
        for (let lat = minLat; lat < maxLat && meshCount < maxMeshes; lat += latStep) {
          for (let lon = minLon; lon < maxLon && meshCount < maxMeshes; lon += lonStep) {
            const centerLat = lat + latStep / 2
            const centerLon = lon + lonStep / 2
            
            // いずれかのポリゴン内にあるかチェック
            let inAnyPolygon = false
            for (const polygon of allPolygons) {
              if (isPointInPolygon([centerLon, centerLat], polygon)) {
                inAnyPolygon = true
                break
              }
            }
            
            if (!inAnyPolygon) continue
            
            mockTreePoints.push({
              lat: centerLat,
              lon: centerLon,
              tree_type: Math.random() > 0.2 ? 'coniferous' : 'broadleaf',
              dbh: 15 + Math.random() * 30,
              volume: 0.1 + Math.random() * 1.4
            })
            meshCount++
          }
        }

        console.log('[チャット] 生成されたメッシュ数:', mockTreePoints.length)

        const coniferousCount = mockTreePoints.filter(p => p.tree_type === 'coniferous').length
        const broadleafCount = mockTreePoints.filter(p => p.tree_type === 'broadleaf').length

        console.log('[チャット] メッシュデータ生成完了:', mockTreePoints.length, '個')
        console.log('[チャット] 針葉樹:', coniferousCount, '個、広葉樹:', broadleafCount, '個')
        console.log('[チャット] 範囲:', { minLat, maxLat, minLon, maxLon })
        console.log('[チャット] サンプルメッシュ:', mockTreePoints.slice(0, 3))

        // 解析結果を設定
        setAnalysisResult({
          tree_count: mockTreePoints.length,
          coniferous_count: coniferousCount,
          broadleaf_count: broadleafCount,
          volume_m3: Math.round(totalVolume),
          tree_points: mockTreePoints,
          polygon_coords: allPolygons,
          is_multi_polygon: true,
          sapporo_bounds: { min_lat: minLat, max_lat: maxLat, min_lon: minLon, max_lon: maxLon }
        })
        setTreePoints(mockTreePoints)
        setAnalysisStatus('completed')

        console.log('[チャット] setTreePoints実行完了:', mockTreePoints.length, '個')
        console.log('[チャット] setAnalysisResult実行完了')

        // 最終メッセージ
        setChatMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: `札幌市全体の材積を解析しました。\n\n検出本数: ${mockTreePoints.length.toLocaleString()}本\n材積: ${Math.round(totalVolume).toLocaleString()} m³\n\n地図上に札幌市の行政区域と材積分布のグリッドメッシュを表示しました。`
          }
          return newMessages
        })
      } catch (err) {
        console.error('札幌市解析エラー:', err)
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'エラーが発生しました。解析を実行できませんでした。'
        }])
      }
    } else {
      // テスト用文言以外の場合
      await new Promise(resolve => setTimeout(resolve, 500))
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'MVP版では、テスト用の文言のみ対応しています。\n\n以下の文言をコピーして入力してください：\n「札幌市全体の材積を解析したい。」'
      }])
    }

    setIsChatProcessing(false)
  }

  return (
    <div className="app">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        selectedMunicipality={selectedMunicipality}
        onMunicipalityChange={setSelectedMunicipality}
        municipalityNames={municipalityNames}
        theme={theme}
        onToggleTheme={toggleTheme}
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
          slopeOpacity={slopeOpacity}
          contourOpacity={contourOpacity}
          onToggleLayer={handleToggleLayer}
          onSlopeOpacityChange={setSlopeOpacity}
          onContourOpacityChange={setContourOpacity}
          chatMessages={chatMessages}
          chatInput={chatInput}
          isChatProcessing={isChatProcessing}
          onChatInputChange={setChatInput}
          onChatSubmit={handleChatSubmit}
          presetImages={presetImages}
          selectedImageId={selectedImageId}
          isLoadingImage={isLoadingImage}
          onPresetImageSelect={handlePresetImageSelect}
          drawMode={drawMode}
          drawType={drawType}
          onDrawModeChange={handleDrawModeChange}
        />
        
        <main className="main-content">
          <div className="map-section">
            <Map
              showAdminBoundaries={showAdminBoundaries}
              showForestRegistry={showForestRegistry}
              showRivers={showRivers}
              showSlope={showSlope}
              showContour={showContour}
              slopeOpacity={slopeOpacity}
              contourOpacity={contourOpacity}
              municipalityNames={municipalityNames}
              drawMode={drawMode}
              drawType={drawType}
              onDrawModeChange={handleDrawModeChange}
              onFeatureClick={handleFeatureClick}
              onForestSelect={handleFeatureClick}
              onAnalyze={handleMapAnalyze}
              onHasShapeChange={(hasShape) => console.log('[App.jsx] 図形描画状態:', hasShape)}
              treePoints={treePoints}
              polygonCoords={analysisResult?.polygon_coords}
              sapporoBounds={analysisResult?.sapporo_bounds}
              imageBounds={imageBounds}
              fileId={selectedImageId}
              zoomToImage={0}
            />
          </div>
          
          <div className="table-section" style={{ height: `${tableHeight}px` }}>
            <AttributeTable 
              data={tableData}
              isResizing={isResizing}
              onResizeStart={handleResizeStart}
              onRowSelect={handleRowSelect}
              onRowDetail={handleRowDetail}
              onAnalyzeSelected={handleAnalyzeSelected}
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
          onRetryAnalysis={handleRetryAnalysis}
          tableHeight={tableHeight}
        />
      </div>
    </div>
  )
}

export default App
