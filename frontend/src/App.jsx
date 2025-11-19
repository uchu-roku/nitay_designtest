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
  const { bbox, polygon_coords, forest_registry_id } = requestData
  
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
  if (polygon_coords && polygon_coords.length > 0) {
    polygon = polygon_coords.map(coord => [coord.lon || coord.lng, coord.lat])
    console.log('ポリゴン判定を使用:', polygon.length, '頂点')
  }
  
  // 樹木位置を生成（最大100本まで表示）
  const displayCount = Math.min(treeCount, 100)
  const treePoints = []
  
  // ポリゴンがある場合は、ポリゴン内の点のみ生成
  let attempts = 0
  const maxAttempts = displayCount * 20 // 最大試行回数
  
  while (treePoints.length < displayCount && attempts < maxAttempts) {
    attempts++
    
    const lat = bbox.min_lat + Math.random() * latDiff
    const lon = bbox.min_lon + Math.random() * lonDiff
    
    // ポリゴンが指定されている場合は範囲内チェック
    if (polygon && !isPointInPolygon([lon, lat], polygon)) {
      continue
    }
    
    const treeType = Math.random() < 0.6 ? 'coniferous' : 'broadleaf'
    const dbh = Math.random() * 30 + 15
    const volume = Math.random() * 1.0 + 0.2
    
    treePoints.push({
      lat,
      lon,
      tree_type: treeType,
      dbh: Math.round(dbh * 10) / 10,
      volume: Math.round(volume * 1000) / 1000
    })
  }
  
  const warnings = [
    `解析面積: ${areaKm2.toFixed(4)} km²`,
  ]
  
  if (forest_registry_id) {
    warnings.push(`森林簿ID: ${forest_registry_id}`)
  }
  
  if (treeCount > 100) {
    warnings.push(`※ 検出本数: ${treeCount}本（地図上には100本まで表示）`)
  }
  
  warnings.push('※MVP版: フロントエンドのみの簡易シミュレーションです')
  
  return {
    tree_count: treeCount,
    volume_m3: Math.round(totalVolume * 100) / 100,
    confidence: areaKm2 < 0.01 || areaKm2 > 10 ? 'low' : 'medium',
    warnings,
    tree_points: treePoints
  }
}

function App() {
  const [mode, setMode] = useState('map') // 'map', 'upload', or 'forest_registry'
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

  const handleClearResults = useCallback(() => {
    console.log('解析結果をクリアします')
    setResult(null)
    setError(null)
    setForestRegistryId(null)
  }, [])

  // プリセット画像リストを取得
  useEffect(() => {
    const fetchPresetImages = async () => {
      try {
        const response = await axios.get(`${API_URL}/preset-images`)
        setPresetImages(response.data.images || [])
      } catch (err) {
        console.error('プリセット画像の取得エラー:', err)
      }
    }
    fetchPresetImages()
  }, [])

  const handlePresetImageSelect = async (imageId) => {
    setLoadingPresets(true)
    setError(null)
    setFileMetadata(null)
    setImageQualityWarnings([])

    try {
      const response = await axios.post(`${API_URL}/upload-preset/${imageId}`)
      
      console.log('プリセット画像読み込みレスポンス:', response.data)
      
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
      console.error('プリセット画像読み込みエラー:', err)
      setError(err.response?.data?.detail || 'プリセット画像の読み込みに失敗しました')
    } finally {
      setLoadingPresets(false)
    }
  }

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
        
        <div className="section">
          <h2>解析モード選択</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={() => setMode('map')}
              style={{
                flex: 1,
                padding: '10px',
                background: mode === 'map' ? '#2c5f2d' : '#ddd',
                color: mode === 'map' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: mode === 'map' ? 'bold' : 'normal',
                fontSize: '13px'
              }}
            >
              A: 地図から解析
            </button>
            <button
              onClick={() => setMode('upload')}
              style={{
                flex: 1,
                padding: '10px',
                background: mode === 'upload' ? '#2c5f2d' : '#ddd',
                color: mode === 'upload' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: mode === 'upload' ? 'bold' : 'normal',
                fontSize: '13px'
              }}
            >
              B: 画像から解析
            </button>
          </div>
          <p className="instruction" style={{ fontSize: '13px', color: '#666' }}>
            {mode === 'map' 
              ? '地図上で範囲を指定、または森林簿レイヤーから小班を選択'
              : '画像をアップロードして範囲を指定、または森林簿レイヤーから小班を選択'}
          </p>
          <div style={{
            background: '#fff3cd',
            padding: '12px',
            borderRadius: '4px',
            marginTop: '10px',
            fontSize: '12px',
            border: '1px solid #ffc107'
          }}>
            <strong style={{ color: '#856404' }}>💡 ヒント</strong>
            <p style={{ marginTop: '8px', marginBottom: 0, color: '#856404', lineHeight: '1.6' }}>
              {mode === 'map' 
                ? '地図上で矩形/ポリゴンを描画するか、「📋 森林簿」ボタンをONにして林班・小班をクリックできます。'
                : '画像をアップロード後、矩形/ポリゴンを描画するか、「📋 森林簿」ボタンをONにして林班・小班をクリックできます。'}
            </p>
          </div>
        </div>

        {mode === 'upload' && (
          <>
            <div className="section">
              <h2>1. 画像アップロード</h2>
              
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
                  background: '#f0f8ff',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '12px',
                  border: '1px solid #4CAF50'
                }}>
                  <strong style={{ color: '#2c5f2d', fontSize: '13px' }}>🎯 サンプル画像を使用（MVP）</strong>
                  <div style={{ marginTop: '8px' }}>
                    {presetImages.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => handlePresetImageSelect(img.id)}
                        disabled={loadingPresets}
                        style={{
                          width: '100%',
                          padding: '10px',
                          marginBottom: '6px',
                          background: loadingPresets ? '#f5f5f5' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loadingPresets ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {loadingPresets ? '読み込み中...' : `📷 ${img.filename}`}
                      </button>
                    ))}
                  </div>
                  <p style={{ marginTop: '8px', marginBottom: 0, fontSize: '11px', color: '#666' }}>
                    ※ MVP版: 事前に配置された画像を使用します
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
                  <p className="success">✓ アップロード完了</p>
                  
                  {/* 画像品質の警告 */}
                  {imageQualityWarnings.length > 0 && (
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
                  
                  {imageBounds ? (
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
                  ) : (
                    <p className="status" style={{ fontSize: '13px', marginTop: '5px' }}>
                      座標情報を確認中...
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <div className="section">
          <h2>{mode === 'upload' ? '2. ' : ''}範囲を指定</h2>
          <p className="instruction">
            矩形/ポリゴンを描画、または森林簿から小班を選択
          </p>
          <p className="instruction" style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
            ▭ 矩形: ドラッグで描画<br />
            ⬡ ポリゴン: クリックで頂点追加、ダブルクリックで完了<br />
            📋 森林簿: ボタンをONにして小班をクリック
          </p>
        </div>

        {analyzing && (
          <div className="section">
            <p className="status">解析中...</p>
          </div>
        )}

        {result && (
          <div className="section result">
            <h2>解析結果</h2>
            {forestRegistryId && (
              <div style={{
                background: '#f4e4d7',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '12px',
                fontSize: '12px',
                border: '1px solid #8B4513'
              }}>
                <strong style={{ color: '#5d2e0f' }}>📋 対象小班</strong>
                <p style={{ marginTop: '5px', marginBottom: 0, color: '#5d2e0f' }}>
                  {forestRegistryId}
                </p>
              </div>
            )}
            <div className="result-item">
              <span className="label">検出本数:</span>
              <span className="value">{result.tree_count} 本</span>
            </div>
            {result.tree_points && result.tree_points.length > 0 && (
              <>
                <div className="result-item" style={{ fontSize: '13px', marginLeft: '10px' }}>
                  <span className="label">🌲 針葉樹:</span>
                  <span className="value">
                    {result.tree_points.filter(p => p.tree_type === 'coniferous').length} 本
                  </span>
                </div>
                <div className="result-item" style={{ fontSize: '13px', marginLeft: '10px' }}>
                  <span className="label">🌳 広葉樹:</span>
                  <span className="value">
                    {result.tree_points.filter(p => p.tree_type === 'broadleaf').length} 本
                  </span>
                </div>
              </>
            )}
            <div className="result-item">
              <span className="label">材積:</span>
              <span className="value">{result.volume_m3} m³</span>
            </div>
            <div className="result-item">
              <span className="label">信頼度:</span>
              <span className="value">{result.confidence}</span>
            </div>
            {result.warnings && result.warnings.length > 0 && (
              <div className="warnings">
                <h3>注意事項:</h3>
                <ul>
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="section error">
            <h3>エラー</h3>
            <p>{typeof error === 'string' ? error : JSON.stringify(error)}</p>
          </div>
        )}
      </div>

      <div className="map-container">
        <Map 
          onAnalyze={handleAnalyze} 
          disabled={analyzing || (mode === 'upload' && !fileId)}
          imageBounds={mode === 'upload' ? imageBounds : null}
          fileId={fileId}
          zoomToImage={zoomToImage}
          treePoints={result?.tree_points || []}
          mode={mode}
          onClearResults={handleClearResults}
        />
      </div>
    </div>
  )
}

export default App
