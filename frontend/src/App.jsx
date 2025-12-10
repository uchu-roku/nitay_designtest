import React, { useState, useEffect, useCallback } from 'react'
import Map from './Map'
import axios from 'axios'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ポリゴン内判定（Ray casting algorithm）
function isPointInPolygon(point, polygon) {
  const [x, y] = point
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    
    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    
    if (intersect) inside = !inside
  }
  
  return inside
}

// MVP版: フロントエンドのみで簡易解析を実行
function generateMockAnalysis(requestData) {
  const { bbox, polygon_coords, forest_registry_id, is_multi_polygon } = requestData
  
  // 面積を計算（簡易版）
  const latDiff = bbox.max_lat - bbox.min_lat
  const lonDiff = bbox.max_lon - bbox.min_lon
  const avgLat = (bbox.min_lat + bbox.max_lat) / 2
  const areaKm2 = latDiff * 111 * lonDiff * 111 * Math.cos(avgLat * Math.PI / 180)
  
  // 樹木密度（1km²あたり800-1500本）
  const treesPerKm2 = Math.floor(Math.random() * 700) + 800
  const treeCount = Math.floor(areaKm2 * treesPerKm2)
  
  // 材積（1本あたり0.3-0.8m³）
  const volumePerTree = Math.random() * 0.5 + 0.3
  const totalVolume = treeCount * volumePerTree
  
  // ポリゴン座標を変換（ある場合）
  let polygon = null
  let multiPolygons = null
  
  if (polygon_coords && polygon_coords.length > 0) {
    if (is_multi_polygon) {
      // 複数ポリゴンの場合（札幌市全体など）
      multiPolygons = polygon_coords.map(polyCoords => 
        polyCoords.map(coord => [coord.lon || coord.lng, coord.lat])
      )
      console.log('複数ポリゴン判定を使用:', multiPolygons.length, '個のポリゴン')
    } else {
      // 単一ポリゴンの場合
      polygon = polygon_coords.map(coord => [coord.lon || coord.lng, coord.lat])
      console.log('ポリゴン判定を使用:', polygon.length, '頂点')
    }
  }
  
  // グリッド状にメッシュを生成（範囲を埋め尽くす）
  const treePoints = []
  
  // メッシュサイズを動的に調整（最大5000メッシュまで）
  const maxMeshes = 5000
  let meshSizeM = 10 // 基本は10m四方
  
  // 仮のグリッド数を計算
  let latStep = meshSizeM / 111000
  let lonStep = meshSizeM / (111000 * Math.cos(avgLat * Math.PI / 180))
  let rows = Math.ceil(latDiff / latStep)
  let cols = Math.ceil(lonDiff / lonStep)
  let totalMeshes = rows * cols
  
  // メッシュ数が多すぎる場合はメッシュサイズを大きくする
  if (totalMeshes > maxMeshes) {
    const scaleFactor = Math.sqrt(totalMeshes / maxMeshes)
    meshSizeM = meshSizeM * scaleFactor
    latStep = meshSizeM / 111000
    lonStep = meshSizeM / (111000 * Math.cos(avgLat * Math.PI / 180))
    rows = Math.ceil(latDiff / latStep)
    cols = Math.ceil(lonDiff / lonStep)
    totalMeshes = rows * cols
    console.log(`メッシュサイズを調整: ${meshSizeM.toFixed(1)}m四方（メッシュ数を${maxMeshes}以下に制限）`)
  }
  
  console.log(`グリッド生成: ${rows}行 x ${cols}列 = ${totalMeshes}メッシュ（${meshSizeM.toFixed(1)}m四方）`)
  
  // 自然な森林分布を模倣するノイズ関数（複数のスケールを組み合わせ）
  const noise2D = (x, y, seed) => {
    // 大きなスケールのノイズ（全体的な傾向）- より滑らかに
    const large = Math.sin(x * 0.02 + seed) * Math.cos(y * 0.02 + seed * 1.3) * 0.5 + 0.5
    // 中程度のスケールのノイズ（林分の違い）
    const medium = Math.sin(x * 0.1 + seed * 2) * Math.cos(y * 0.1 + seed * 2.5) * 0.5 + 0.5
    // 小さなスケールのノイズ（個体差）
    const small = Math.sin(x * 0.4 + seed * 3) * Math.cos(y * 0.4 + seed * 3.7) * 0.5 + 0.5
    // ランダムノイズ
    const random = Math.random()
    
    // 組み合わせ（大きなスケールを重視して滑らかなグラデーションに）
    return large * 0.5 + medium * 0.3 + small * 0.15 + random * 0.05
  }
  
  const seed = Math.random() * 100
  
  // グリッド状に配置（自然な分布）
  try {
    for (let i = 0; i < rows && treePoints.length < maxMeshes; i++) {
      for (let j = 0; j < cols && treePoints.length < maxMeshes; j++) {
        const lat = bbox.min_lat + (i + 0.5) * latStep
        const lon = bbox.min_lon + (j + 0.5) * lonStep
        
        // ポリゴンが指定されている場合は範囲内チェック
        if (polygon && !isPointInPolygon([lon, lat], polygon)) {
          continue
        }
        
        // 複数ポリゴンが指定されている場合は、いずれかのポリゴン内かチェック
        if (multiPolygons) {
          let inAnyPolygon = false
          for (const poly of multiPolygons) {
            if (isPointInPolygon([lon, lat], poly)) {
              inAnyPolygon = true
              break
            }
          }
          if (!inAnyPolygon) {
            continue
          }
        }
        
        // ノイズ関数で材積を決定（グラデーション + ランダム性）
        const volumeNoise = noise2D(i, j, seed)
        const volume = 0.1 + volumeNoise * 1.4
        
        // 樹種を決定（針葉樹80%、広葉樹20%）
        // ランダム関数を使用して確実に20%を広葉樹にする
        const treeType = Math.random() > 0.2 ? 'coniferous' : 'broadleaf'
        
        // 胸高直径は材積に比例
        const dbh = 15 + volumeNoise * 30
        
        treePoints.push({
          lat,
          lon,
          tree_type: treeType,
          dbh: Math.round(dbh * 10) / 10,
          volume: Math.round(volume * 1000) / 1000
        })
      }
    }
  } catch (error) {
    console.error('グリッド生成エラー:', error)
    // エラー時は最低限のメッシュを生成
    if (treePoints.length === 0) {
      const centerLat = (bbox.min_lat + bbox.max_lat) / 2
      const centerLon = (bbox.min_lon + bbox.max_lon) / 2
      treePoints.push({
        lat: centerLat,
        lon: centerLon,
        tree_type: 'coniferous',
        dbh: 25,
        volume: 0.5
      })
    }
  }
  
  console.log(`生成されたメッシュ数: ${treePoints.length}`)
  
  // 針葉樹と広葉樹の本数を集計
  const coniferousCount = treePoints.filter(p => p.tree_type === 'coniferous').length
  const broadleafCount = treePoints.filter(p => p.tree_type === 'broadleaf').length
  const totalTreeCount = coniferousCount + broadleafCount
  
  // 実際の材積を集計
  const actualTotalVolume = treePoints.reduce((sum, p) => sum + p.volume, 0)
  
  console.log(`針葉樹: ${coniferousCount}本, 広葉樹: ${broadleafCount}本, 合計: ${totalTreeCount}本`)
  console.log(`合計材積: ${actualTotalVolume.toFixed(2)} m³`)
  
  const warnings = [
    `解析面積: ${areaKm2.toFixed(4)} km²`,
    `検出本数: ${totalTreeCount.toLocaleString()}本（針葉樹: ${coniferousCount.toLocaleString()}本、広葉樹: ${broadleafCount.toLocaleString()}本）`,
    `メッシュ数: ${treePoints.length}個（${meshSizeM.toFixed(1)}m四方グリッド）`
  ]
  
  if (forest_registry_id) {
    warnings.push(`森林簿ID: ${forest_registry_id}`)
  }
  
  warnings.push('※MVP版: フロントエンドのみの簡易シミュレーションです')
  warnings.push('※材積分布は滑らかなグラデーションで表示')
  
  return {
    tree_count: totalTreeCount,
    coniferous_count: coniferousCount,
    broadleaf_count: broadleafCount,
    volume_m3: Math.round(actualTotalVolume * 100) / 100,
    confidence: areaKm2 < 0.01 || areaKm2 > 10 ? 'low' : 'medium',
    warnings,
    tree_points: treePoints,
    polygon_coords: polygon_coords // ポリゴン座標を返す
  }
}

function App() {
  const [mode, setMode] = useState('map') // 'map', 'upload', 'chatbot'
  const [fileId, setFileId] = useState(null)
  const [fileMetadata, setFileMetadata] = useState(null)
  const [imageBounds, setImageBounds] = useState(null)
  const [imageQualityWarnings, setImageQualityWarnings] = useState([])
  const [zoomToImage, setZoomToImage] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [forestRegistryId, setForestRegistryId] = useState(null)
  const [presetImages, setPresetImages] = useState([])
  const [loadingPresets, setLoadingPresets] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  
  // 地図コントロール用のstate
  const [drawMode, setDrawMode] = useState(false)
  const [drawType, setDrawType] = useState('rectangle')
  const [showAdminBoundaries, setShowAdminBoundaries] = useState(false)
  const [showRivers, setShowRivers] = useState(false)
  const [showForestRegistry, setShowForestRegistry] = useState(false)
  const [forestSearchQuery, setForestSearchQuery] = useState('')
  const [hasShape, setHasShape] = useState(false) // 図形が描画されているか

  const handleClearResults = useCallback(() => {
    console.log('解析結果をクリアします')
    setResult(null)
    setError(null)
    setForestRegistryId(null)
  }, [])

  // プリセット画像リストを取得（MVP版：静的リスト）
  useEffect(() => {
    // MVP版: バックエンドAPIを使わず、静的な画像リストを使用
    const staticImages = [
      {
        id: '02_GE_modified',
        filename: '02_GE_modified.tif',
        path: '/zaisekiyosokuapp/sample-images/02_GE_modified.png'
      }
    ]
    setPresetImages(staticImages)
  }, [])

  const handlePresetImageSelect = async (imageId) => {
    setLoadingPresets(true)
    setImageLoaded(false)
    setError(null)
    setFileMetadata(null)
    setImageQualityWarnings([])

    try {
      // MVP版: バックエンドAPIを使わず、直接画像パスを設定
      console.log('プリセット画像を選択:', imageId)
      
      // 画像のパスを設定（publicフォルダ内、PNG形式）
      const imagePath = `/zaisekiyosokuapp/sample-images/${imageId}.png`
      
      // ファイルIDとして画像パスを使用
      setFileId(imagePath)
      
      // MVP版: TIFFファイルから取得した実際の座標情報
      const mockBbox = {
        min_lat: 41.794053826085,
        min_lon: 140.58585197971667,
        max_lat: 41.795881627054484,
        max_lon: 140.5898721292174
      }
      
      setFileMetadata({
        bbox: mockBbox,
        width: 1000,
        height: 1000,
        crs: 'EPSG:4326'
      })
      
      setImageBounds(mockBbox)
      
      // 警告メッセージ
      setImageQualityWarnings([
        'MVP版: TIFFファイルから座標情報を取得しました',
        '位置: 北緯41.79度、東経140.58度（函館付近）'
      ])
      
      console.log('画像の境界（MVP版）:', mockBbox)
      setImageLoaded(true)
    } catch (err) {
      console.error('プリセット画像読み込みエラー:', err)
      setError('プリセット画像の読み込みに失敗しました')
      setImageLoaded(true)
    } finally {
      setLoadingPresets(false)
    }
  }

  const handleImageLoaded = useCallback(() => {
    console.log('画像が地図上に読み込まれました')
    setImageLoaded(true)
  }, [])

  const handleFileUploadClick = (event) => {
    // MVP版：ファイル選択を促す代わりにサンプル画像使用を促す
    event.preventDefault()
    alert('🎯 MVP版のため、ファイルアップロード機能は無効です。\n\n上の「サンプル画像を使用（MVP）」セクションから画像を選択してください。')
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setFileMetadata(null)
    setImageQualityWarnings([])

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      console.log('アップロードレスポンス:', response.data)
      
      setFileId(response.data.file_id)
      setFileMetadata(response.data.info)
      
      // 画像品質の警告を設定
      if (response.data.info && response.data.info.warnings) {
        setImageQualityWarnings(response.data.info.warnings)
      }
      
      // GeoTIFF情報がある場合は地図を移動
      if (response.data.info && response.data.info.bbox) {
        console.log('画像の境界:', response.data.info.bbox)
        setImageBounds(response.data.info.bbox)
      } else {
        console.warn('GeoTIFF情報が見つかりません:', response.data.info)
        setError('警告: 画像に座標情報がありません。地図上に表示できません。')
      }
    } catch (err) {
      console.error('アップロードエラー:', err)
      setError(err.response?.data?.detail || 'アップロードに失敗しました。バックエンドAPIが必要です。')
    } finally {
      setUploading(false)
    }
  }

  const handleChatSubmit = useCallback(() => {
    if (!chatInput.trim()) return
    
    const userMessage = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput('')
    
    // テスト用文言をチェック
    if (userMessage === '札幌市全体の材積を解析したい。') {
      setAnalyzing(true)
      
      // AIが考えているような演出を追加
      ;(async () => {
        // 1. 「考え中...」メッセージを表示
        await new Promise(resolve => setTimeout(resolve, 800))
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '札幌市全体の材積解析を開始します...',
          isTyping: true 
        }])
        
        // 2. データ読み込み中メッセージ
        await new Promise(resolve => setTimeout(resolve, 1500))
        setChatMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: '画像データを解析中...',
            isTyping: true
          }
          return newMessages
        })
        
        // 3. 解析中メッセージ
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 札幌市の行政区域ポリゴンを読み込む
        try {
          const baseUrl = import.meta.env.BASE_URL || '/'
          const adminUrl = `${baseUrl}data/administrative/admin_simple.geojson`
          const response = await fetch(adminUrl)
          const data = await response.json()
          
          // 札幌市のポリゴンを抽出
          const sapporoFeatures = data.features.filter(feature => {
            const city = feature.properties.N03_004 || ''
            const ward = feature.properties.N03_005 || ''
            return city.includes('札幌') || 
                   ward.includes('中央') || ward.includes('北区') || ward.includes('東区') ||
                   ward.includes('白石') || ward.includes('豊平') || ward.includes('南区') ||
                   ward.includes('西区') || ward.includes('厚別') || ward.includes('手稲') ||
                   ward.includes('清田')
          })
          
          console.log('札幌市のフィーチャー:', sapporoFeatures.length)
          
          if (sapporoFeatures.length > 0) {
            // 全ての区のポリゴンを抽出して配列に格納
            const allPolygons = []
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
            
            console.log('札幌市の全ポリゴン数:', allPolygons.length)
            
            // 札幌市全体のbboxを計算
            let minLat = Infinity, maxLat = -Infinity
            let minLon = Infinity, maxLon = -Infinity
            
            allPolygons.forEach(polygon => {
              polygon.forEach(coord => {
                minLat = Math.min(minLat, coord.lat)
                maxLat = Math.max(maxLat, coord.lat)
                minLon = Math.min(minLon, coord.lon)
                maxLon = Math.max(maxLon, coord.lon)
              })
            })
            
            console.log('札幌市のbbox:', { minLat, maxLat, minLon, maxLon })
            
            // 他の解析と同じ方法で、generateMockAnalysisを直接呼び出す
            const mockResult = generateMockAnalysis({
              bbox: {
                min_lat: minLat,
                max_lat: maxLat,
                min_lon: minLon,
                max_lon: maxLon
              },
              polygon_coords: allPolygons, // 複数ポリゴンの配列を渡す
              is_multi_polygon: true // 複数ポリゴンであることを示すフラグ
            })
            
            // 札幌市の範囲情報を追加
            mockResult.sapporo_bounds = {
              min_lat: minLat,
              max_lat: maxLat,
              min_lon: minLon,
              max_lon: maxLon
            }
            
            // 複数ポリゴンの座標を上書き（Map.jsxで白い背景を表示するため）
            // generateMockAnalysisが元のpolygon_coordsを返すので、ここで上書きする
            mockResult.polygon_coords = allPolygons
            mockResult.is_multi_polygon = true
            
            // 結果を設定
            setResult(mockResult)
            
            // 4. 最終結果を表示
            setChatMessages(prev => {
              const newMessages = [...prev]
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: `札幌市全体の材積を解析しました。\n\n検出本数: ${mockResult.tree_count.toLocaleString()}本\n材積: ${mockResult.volume_m3.toLocaleString()} m³\n\n地図上に札幌市の行政区域と材積分布のグリッドメッシュを表示しました。`
              }
              return newMessages
            })
          }
        } catch (err) {
          console.error('札幌市ポリゴンデータの読み込みエラー:', err)
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: 'エラーが発生しました。札幌市のデータを読み込めませんでした。'
          }])
        }
        
        setAnalyzing(false)
      })()
    } else {
      // テスト用文言以外の場合
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'MVP版では、テスト用の文言のみ対応しています。\n\n以下の文言をコピーして入力してください：\n「札幌市全体の材積を解析したい。」'
      }])
    }
  }, [chatInput])

  const handleAnalyze = useCallback(async (bounds, polygonCoords = null, registryId = null) => {
    // モードB（画像アップロード）の場合はファイル必須
    if (mode === 'upload' && !fileId) {
      setError('先に画像ファイルをアップロードしてください')
      return
    }

    setAnalyzing(true)
    setError(null)
    // 結果はクリアしない（前の結果を残す）
    // setResult(null)

    try {
      const requestData = {
        mode: mode,
        file_id: fileId || null,
        bbox: {
          min_lat: bounds.getSouth(),
          min_lon: bounds.getWest(),
          max_lat: bounds.getNorth(),
          max_lon: bounds.getEast()
        }
      }
      
      // ポリゴン座標がある場合は追加
      if (polygonCoords && polygonCoords.length > 0) {
        requestData.polygon_coords = polygonCoords.map(coord => ({
          lat: coord.lat,
          lon: coord.lng
        }))
      }
      
      // 森林簿IDがある場合は追加
      if (registryId) {
        requestData.forest_registry_id = registryId
      }

      console.log('解析リクエスト:', requestData)
      
      // MVP版: フロントエンドのみで簡易解析
      const mockResult = generateMockAnalysis(requestData)
      setResult(mockResult)
    } catch (err) {
      setError(err.response?.data?.detail || '解析に失敗しました')
    } finally {
      setAnalyzing(false)
    }
  }, [mode, fileId])
  
  // グローバル関数として森林簿解析を登録（ポップアップから呼び出すため）
  useEffect(() => {
    // aパターン: まるごと解析
    window.analyzeForestRegistryWhole = () => {
      const registryId = window.currentForestRegistryId
      const bounds = window.currentForestBounds
      
      console.log('森林簿解析を開始（まるごと）:', registryId)
      setForestRegistryId(registryId)
      // モードはそのまま（'map' または 'upload'）
      
      // グローバル変数からポリゴン座標を取得
      let polygonCoords = null
      if (window.currentForestPolygon && Array.isArray(window.currentForestPolygon)) {
        // Leafletの座標形式を変換
        polygonCoords = window.currentForestPolygon.map(latLng => ({
          lat: latLng.lat,
          lng: latLng.lng
        }))
        console.log('ポリゴン座標を使用:', polygonCoords.length, '頂点')
      }
      
      handleAnalyze(bounds, polygonCoords, registryId)
    }
    
    // bパターン: 範囲を指定
    window.analyzeForestRegistryPartial = () => {
      const registryId = window.currentForestRegistryId
      console.log('森林簿解析（範囲指定モード）:', registryId)
      setForestRegistryId(registryId)
      // モードはそのまま（'map' または 'upload'）
      
      // 範囲指定モードを有効化（Mapコンポーネントに通知）
      window.forestRegistryPartialMode = true
      console.log('範囲指定モードを有効化しました:', window.forestRegistryPartialMode)
      
      // すべてのポップアップを閉じる
      if (window.mapInstance) {
        window.mapInstance.closePopup()
        
        // 森林簿レイヤーのz-indexはそのまま（450）
        // 描画レイヤー（overlayPane、z-index: 400）より高いが、
        // クリックイベントは無効化されているので描画は可能
        const pane = window.mapInstance.getPane('forestRegistryPane')
        if (pane) {
          console.log('森林簿レイヤーのz-indexを維持:', pane.style.zIndex)
        }
        
        // 森林簿レイヤーのすべてのポップアップをアンバインドし、クリックイベントを無効化
        if (window.forestRegistryLayer) {
          window.forestRegistryLayer.eachLayer(layer => {
            layer.unbindPopup()
            layer.off('click') // クリックイベントを完全に削除
            // 透明度を下げる（うっすらと見えるようにする）
            layer.setStyle({ opacity: 0.3, fillOpacity: 0.05 })
          })
          console.log('森林簿レイヤーのポップアップとクリックイベントを無効化し、透明度を下げました')
        }
      }
      
      // アラートを表示
      alert('地図上で矩形またはポリゴンを描画してください。\n\n矩形: 左側の「▭ 矩形」ボタンをクリック\nポリゴン: 左側の「⬡ ポリゴン」ボタンをクリック')
      console.log('アラート表示後、範囲指定モード:', window.forestRegistryPartialMode)
    }
    
    return () => {
      delete window.analyzeForestRegistryWhole
      delete window.analyzeForestRegistryPartial
      delete window.currentForestPolygon
      delete window.currentForestBounds
      delete window.currentForestRegistryId
      delete window.forestRegistryPartialMode
    }
  }, [handleAnalyze])

  return (
    <div className="app">
      <div className="sidebar">
        <h1>材積予測アプリ</h1>
        
        {/* タブ形式のモード選択 */}
        <div style={{ 
          display: 'flex', 
          background: 'white',
          borderBottom: '1px solid #ddd'
        }}>
          <button
            onClick={() => setMode('map')}
            style={{
              flex: 1,
              padding: '12px 8px',
              background: mode === 'map' ? '#2c5f2d' : 'white',
              color: mode === 'map' ? 'white' : '#666',
              border: 'none',
              borderBottom: mode === 'map' ? 'none' : '1px solid #ddd',
              cursor: 'pointer',
              fontWeight: mode === 'map' ? 'bold' : 'normal',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
          >
            A: 地図から解析
          </button>
          <button
            onClick={() => setMode('upload')}
            style={{
              flex: 1,
              padding: '12px 8px',
              background: mode === 'upload' ? '#2c5f2d' : 'white',
              color: mode === 'upload' ? 'white' : '#666',
              border: 'none',
              borderBottom: mode === 'upload' ? 'none' : '1px solid #ddd',
              cursor: 'pointer',
              fontWeight: mode === 'upload' ? 'bold' : 'normal',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
          >
            B: 画像から解析
          </button>
          <button
            onClick={() => setMode('chatbot')}
            style={{
              flex: 1,
              padding: '12px 8px',
              background: mode === 'chatbot' ? '#2c5f2d' : 'white',
              color: mode === 'chatbot' ? 'white' : '#666',
              border: 'none',
              borderBottom: mode === 'chatbot' ? 'none' : '1px solid #ddd',
              cursor: 'pointer',
              fontWeight: mode === 'chatbot' ? 'bold' : 'normal',
              fontSize: '12px',
              transition: 'all 0.2s'
            }}
          >
            C: チャットボット
          </button>
        </div>

        <div className="sidebar-content">
          {mode !== 'chatbot' && (
            <>
              <div className="section">
                <h2>範囲を指定</h2>
                
                {/* 描画ボタン */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    onClick={() => {
                      setDrawType('rectangle')
                      setDrawMode(true)
                    }}
                    disabled={drawMode}
                    style={{
                      flex: 1,
                      background: drawMode && drawType === 'rectangle' ? '#2c5f2d' : 'white',
                      color: drawMode && drawType === 'rectangle' ? 'white' : '#2c5f2d',
                      padding: '10px',
                      border: '2px solid #2c5f2d',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: drawMode ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>▭</span>
                    矩形
                  </button>
                  <button
                    onClick={() => {
                      setDrawType('polygon')
                      setDrawMode(true)
                    }}
                    disabled={drawMode}
                    style={{
                      flex: 1,
                      background: drawMode && drawType === 'polygon' ? '#2c5f2d' : 'white',
                      color: drawMode && drawType === 'polygon' ? 'white' : '#2c5f2d',
                      padding: '10px',
                      border: '2px solid #2c5f2d',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: drawMode ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>⬡</span>
                    ポリゴン
                  </button>
                </div>
                
                {drawMode && (
                  <div style={{
                    background: '#e8f5e9',
                    padding: '10px',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    fontSize: '11px',
                    border: '1px solid #4CAF50'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#2c5f2d', marginBottom: '5px' }}>
                      ✏️ {drawType === 'rectangle' ? '矩形描画中' : 'ポリゴン描画中'}
                    </div>
                    <div style={{ color: '#666', lineHeight: '1.5' }}>
                      {drawType === 'rectangle' 
                        ? 'ドラッグして矩形を描画してください'
                        : 'クリックで頂点を追加、ダブルクリックで完了'}
                    </div>
                    <button
                      onClick={() => setDrawMode(false)}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        background: 'white',
                        color: '#2c5f2d',
                        padding: '6px',
                        border: '1px solid #2c5f2d',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      キャンセル
                    </button>
                  </div>
                )}
                
                <p className="instruction" style={{ fontSize: '11px', color: '#888', lineHeight: '1.5' }}>
                  地図上で範囲を描画するか、下のレイヤーボタンから森林簿を表示して小班を選択できます。
                </p>
              </div>
              
              {/* 図形クリア・結果クリアボタン */}
              {(hasShape || (result && result.tree_points && result.tree_points.length > 0)) && (
                <div className="section">
                  <h2>クリア操作</h2>
                  
                  {hasShape && (
                    <button
                      onClick={() => {
                        // Map.jsxの図形クリア関数を呼び出し
                        if (window.clearMapShape) {
                          window.clearMapShape()
                        }
                        setHasShape(false)
                        handleClearResults()
                      }}
                      style={{
                        width: '100%',
                        background: '#dc3545',
                        color: 'white',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginBottom: '8px'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>🗑️</span>
                      図形をクリア
                    </button>
                  )}
                  
                  {!hasShape && result && result.tree_points && result.tree_points.length > 0 && (
                    <button
                      onClick={() => {
                        // Map.jsxの結果クリア関数を呼び出し
                        if (window.clearMapResults) {
                          window.clearMapResults()
                        }
                        handleClearResults()
                      }}
                      style={{
                        width: '100%',
                        background: '#dc3545',
                        color: 'white',
                        padding: '10px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>🗑️</span>
                      結果をクリア
                    </button>
                  )}
                </div>
              )}
              
              <div className="section">
                <h2>レイヤー表示</h2>
                
                {/* 行政区域レイヤー */}
                <div
                  onClick={() => setShowAdminBoundaries(!showAdminBoundaries)}
                  style={{
                    width: '100%',
                    background: 'white',
                    padding: '12px 16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    color: '#333'
                  }}
                >
                  <span>行政区域レイヤー</span>
                  <div
                    style={{
                      width: '50px',
                      height: '26px',
                      background: showAdminBoundaries ? '#2c5f2d' : '#ccc',
                      borderRadius: '13px',
                      position: 'relative',
                      transition: 'background 0.3s'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        background: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: showAdminBoundaries ? '26px' : '2px',
                        transition: 'left 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                </div>
                
                {/* 河川レイヤー */}
                <div
                  onClick={() => setShowRivers(!showRivers)}
                  style={{
                    width: '100%',
                    background: 'white',
                    padding: '12px 16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    color: '#333'
                  }}
                >
                  <span>河川レイヤー</span>
                  <div
                    style={{
                      width: '50px',
                      height: '26px',
                      background: showRivers ? '#2c5f2d' : '#ccc',
                      borderRadius: '13px',
                      position: 'relative',
                      transition: 'background 0.3s'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        background: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: showRivers ? '26px' : '2px',
                        transition: 'left 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                </div>
                
                {/* 森林簿レイヤー */}
                <div
                  onClick={() => setShowForestRegistry(!showForestRegistry)}
                  style={{
                    width: '100%',
                    background: 'white',
                    padding: '12px 16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    color: '#333'
                  }}
                >
                  <span>森林簿レイヤー</span>
                  <div
                    style={{
                      width: '50px',
                      height: '26px',
                      background: showForestRegistry ? '#2c5f2d' : '#ccc',
                      borderRadius: '13px',
                      position: 'relative',
                      transition: 'background 0.3s'
                    }}
                  >
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        background: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: showForestRegistry ? '26px' : '2px',
                        transition: 'left 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                </div>
                
                {/* 森林簿検索 */}
                {showForestRegistry && (
                  <div style={{
                    background: '#f5f5f5',
                    padding: '10px',
                    borderRadius: '4px',
                    marginTop: '8px'
                  }}>
                    <input
                      type="text"
                      placeholder="林班-小班 (例: 0053-0049)"
                      value={forestSearchQuery}
                      onChange={(e) => setForestSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && window.handleForestSearch) {
                          window.handleForestSearch(forestSearchQuery)
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #8B4513',
                        borderRadius: '4px',
                        fontSize: '11px',
                        marginBottom: '8px'
                      }}
                    />
                    <button
                      onClick={() => {
                        if (window.handleForestSearch) {
                          window.handleForestSearch(forestSearchQuery)
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#8B4513',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      🔍 検索
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {mode === 'chatbot' && (
            <div className="section">
              <h2>チャットボット解析</h2>
            <div style={{
              background: '#e3f2fd',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '12px',
              border: '1px solid #2196F3'
            }}>
              <strong style={{ color: '#0d47a1' }}>🤖 チャットボット解析について</strong>
              <p style={{ marginTop: '8px', marginBottom: 0, color: '#0d47a1', lineHeight: '1.6' }}>
                AIとやり取りしながら解析を実行できます。MVP版ではテスト用の文言で動作確認できます。
              </p>
            </div>
            
            <div style={{
              background: '#fff3cd',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '12px',
              border: '1px solid #ffc107'
            }}>
              <strong style={{ color: '#856404' }}>📝 テスト用文言</strong>
              <p style={{ marginTop: '8px', marginBottom: '8px', color: '#856404', lineHeight: '1.6' }}>
                以下の文言をコピーして入力してください：
              </p>
              <div style={{
                background: 'white',
                padding: '10px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '13px',
                color: '#333',
                border: '1px solid #ddd',
                cursor: 'pointer'
              }}
              onClick={() => {
                navigator.clipboard.writeText('札幌市全体の材積を解析したい。')
                alert('クリップボードにコピーしました！')
              }}
              title="クリックでコピー"
              >
                札幌市全体の材積を解析したい。
              </div>
            </div>
            
            {/* チャットメッセージ表示エリア（LINE風） */}
            <div style={{
              background: '#f7f7f7',
              border: 'none',
              borderRadius: '8px',
              padding: '20px 12px',
              marginBottom: '12px',
              maxHeight: '400px',
              overflowY: 'auto',
              minHeight: '200px'
            }}>
              {chatMessages.length === 0 ? (
                <p style={{ color: '#999', fontSize: '13px', textAlign: 'center', margin: '80px 0' }}>
                  メッセージを入力してください
                </p>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    marginBottom: '20px',
                    gap: '10px'
                  }}>
                    {/* アイコン */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #06C755 0%, #00B900 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}>
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    
                    {/* メッセージバブル */}
                    <div style={{
                      maxWidth: '75%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        marginBottom: '6px',
                        color: '#888',
                        paddingLeft: msg.role === 'user' ? '0' : '8px',
                        paddingRight: msg.role === 'user' ? '8px' : '0'
                      }}>
                        {msg.role === 'user' ? 'あなた' : 'AI'}
                      </div>
                      <div style={{
                        padding: '14px 18px',
                        borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        background: msg.role === 'user' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #06C755 0%, #00B900 100%)',
                        color: 'white',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        position: 'relative'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* チャット入力欄 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !analyzing) {
                    handleChatSubmit()
                  }
                }}
                placeholder="メッセージを入力..."
                disabled={analyzing}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              />
              <button
                onClick={handleChatSubmit}
                disabled={analyzing || !chatInput.trim()}
                style={{
                  padding: '10px 20px',
                  background: analyzing || !chatInput.trim() ? '#ccc' : '#2c5f2d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: analyzing || !chatInput.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                {analyzing ? '⏳' : '送信'}
              </button>
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div className="section">
              <h2>画像アップロード</h2>
              
              {/* 画像品質の注意事項 */}
              <div style={{
                background: '#fff3cd',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '12px',
                border: '1px solid #ffc107'
              }}>
                <strong style={{ color: '#856404' }}>📋 推奨画像品質</strong>
                <ul style={{ marginTop: '8px', marginLeft: '18px', color: '#856404' }}>
                  <li><strong>解像度:</strong> 30cm/ピクセル以下（最低50cm）</li>
                  <li><strong>雲量:</strong> 5%未満（最低20%）</li>
                  <li><strong>影:</strong> 20-30%未満（最低40%）</li>
                  <li><strong>季節:</strong> 落葉樹は葉有り期、積雪期NG</li>
                  <li><strong>撮影角度:</strong> 25-30°以下（最低35°）</li>
                </ul>
                <p style={{ marginTop: '8px', fontSize: '11px', color: '#856404' }}>
                  ※ 品質が低いと検出精度が低下します
                </p>
              </div>
              
              <div style={{
                background: '#e7f3ff',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '10px',
                fontSize: '12px',
                border: '1px solid #2196F3'
              }}>
                <strong style={{ color: '#0d47a1' }}>💡 ファイル形式について</strong>
                <p style={{ marginTop: '5px', marginBottom: '5px', color: '#0d47a1' }}>
                  <strong>推奨: GeoTIFF形式（.tif, .tiff）</strong><br />
                  緯度経度情報が含まれており、地図上の正確な位置に表示できます。
                </p>
                <p style={{ marginTop: '5px', marginBottom: 0, color: '#0d47a1', fontSize: '11px' }}>
                  ※ JPG/PNG形式も可能ですが、座標情報がないため地図上に表示できません。
                </p>
              </div>

              {/* プリセット画像選択（MVP用） */}
              {presetImages.length > 0 && (
                <div style={{
                  background: '#e8f5e9',
                  padding: '14px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  border: '2px solid #4CAF50',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '20px', marginRight: '8px' }}>🎯</span>
                    <strong style={{ color: '#2c5f2d', fontSize: '14px' }}>サンプル画像を使用（MVP）</strong>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    {presetImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => handlePresetImageSelect(img.id)}
                        disabled={loadingPresets}
                        style={{
                          width: '100%',
                          padding: '12px',
                          marginBottom: '8px',
                          background: loadingPresets ? '#f5f5f5' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: loadingPresets ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s',
                          boxShadow: loadingPresets ? 'none' : '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onMouseEnter={(e) => {
                          if (!loadingPresets) {
                            e.target.style.background = '#45a049'
                            e.target.style.transform = 'translateY(-1px)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loadingPresets) {
                            e.target.style.background = '#4CAF50'
                            e.target.style.transform = 'translateY(0)'
                          }
                        }}
                      >
                        {loadingPresets ? '⏳ 読み込み中...' : `📷 ${img.filename}`}
                      </button>
                    ))}
                  </div>
                  <p style={{ marginTop: '10px', marginBottom: 0, fontSize: '11px', color: '#2c5f2d', lineHeight: '1.4' }}>
                    💡 事前に配置されたサンプル画像を使用できます
                  </p>
                </div>
              )}
              
              <label
                htmlFor="file-upload"
                onClick={handleFileUploadClick}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '15px',
                  border: '2px dashed #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  background: '#f5f5f5',
                  textAlign: 'center',
                  color: '#999',
                  fontWeight: 'bold',
                  transition: 'all 0.3s',
                  opacity: 0.6
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e8e8e8'
                  e.target.style.borderColor = '#999'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f5f5f5'
                  e.target.style.borderColor = '#ccc'
                }}
              >
                📁 GeoTIFFファイルを選択（MVP版では無効）
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".tif,.tiff,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={true}
                style={{ display: 'none' }}
              />
              {fileId && (
                <>
                  {!imageLoaded ? (
                    <p className="status">📤 画像を読み込み中...</p>
                  ) : (
                    <p className="success">✓ アップロード完了</p>
                  )}
                  
                  {/* 画像品質の警告 */}
                  {imageQualityWarnings.length > 0 && imageLoaded && (
                    <div style={{
                      background: '#fff3cd',
                      padding: '10px',
                      borderRadius: '4px',
                      marginTop: '10px',
                      fontSize: '12px',
                      border: '1px solid #ffc107'
                    }}>
                      <strong style={{ color: '#856404' }}>⚠️ 画像品質の注意</strong>
                      <ul style={{ marginTop: '5px', marginLeft: '18px', marginBottom: 0 }}>
                        {imageQualityWarnings.map((warning, i) => (
                          <li key={i} style={{ color: '#856404', marginTop: '3px' }}>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {imageBounds && imageLoaded && (
                    <>
                      <p className="success" style={{ fontSize: '13px', marginTop: '5px' }}>
                        画像が地図上に表示されました
                      </p>
                      <button
                        onClick={() => setZoomToImage(prev => !prev)}
                        style={{
                          marginTop: '10px',
                          padding: '8px 16px',
                          background: '#2c5f2d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        📍 画像位置にズーム
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {analyzing && (
            <div className="section">
              <p className="status" style={{ textAlign: 'center', fontSize: '14px', color: '#2c5f2d' }}>
                ⏳ 解析中...
              </p>
            </div>
          )}

          {result && (
          <div className="section result">
            <h2>解析結果</h2>
            <div className="result-item">
              <span className="label">検出本数:</span>
              <span className="value">{result.tree_count.toLocaleString()}本</span>
            </div>
            {result.tree_points && result.tree_points.length > 0 && (
              <>
                <div className="result-item">
                  <span className="label">
                    <span style={{ 
                      display: 'inline-block', 
                      width: '12px', 
                      height: '12px', 
                      background: '#2e7d32', 
                      marginRight: '5px',
                      borderRadius: '2px'
                    }}></span>
                    針葉樹:
                  </span>
                  <span className="value">
                    {result.tree_points.filter(p => p.tree_type === 'coniferous').length.toLocaleString()}本
                  </span>
                </div>
                <div className="result-item">
                  <span className="label">
                    <span style={{ 
                      display: 'inline-block', 
                      width: '12px', 
                      height: '12px', 
                      background: '#8d6e63', 
                      marginRight: '5px',
                      borderRadius: '2px'
                    }}></span>
                    広葉樹:
                  </span>
                  <span className="value">
                    {result.tree_points.filter(p => p.tree_type === 'broadleaf').length.toLocaleString()}本
                  </span>
                </div>
              </>
            )}
            <div className="result-item">
              <span className="label">材積:</span>
              <span className="value">{result.volume_m3.toLocaleString()} m³</span>
            </div>
            {result.warnings && result.warnings.length > 0 && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#666'
              }}>
                {result.warnings.map((w, i) => (
                  <div key={i} style={{ marginBottom: '5px' }}>{w}</div>
                ))}
              </div>
            )}

          </div>
          )}

          {error && (
            <div className="section" style={{
              background: '#f8d7da',
              border: '1px solid #dc3545',
              borderRadius: '4px',
              padding: '15px'
            }}>
              <h3 style={{ color: '#721c24', marginBottom: '8px', fontSize: '13px' }}>エラー</h3>
              <p style={{ color: '#721c24', fontSize: '12px', margin: 0 }}>
                {typeof error === 'string' ? error : JSON.stringify(error)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="map-container">
        <Map 
          onAnalyze={handleAnalyze} 
          disabled={analyzing || (mode === 'upload' && !fileId)}
          imageBounds={mode === 'upload' ? imageBounds : null}
          fileId={fileId}
          zoomToImage={zoomToImage}
          treePoints={result?.tree_points || []}
          polygonCoords={result?.polygon_coords || null}
          sapporoBounds={result?.sapporo_bounds || null}
          mode={mode}
          onClearResults={handleClearResults}
          onImageLoaded={handleImageLoaded}
          isMultiPolygon={result?.is_multi_polygon || false}
          drawMode={drawMode}
          drawType={drawType}
          showAdminBoundaries={showAdminBoundaries}
          showRivers={showRivers}
          showForestRegistry={showForestRegistry}
          forestSearchQuery={forestSearchQuery}
          onDrawModeChange={setDrawMode}
          onForestSearchQueryChange={setForestSearchQuery}
          onHasShapeChange={setHasShape}
        />
      </div>
    </div>
  )
}

export default App
