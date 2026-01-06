import { useRef, useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Map({ 
  onAnalyze, 
  disabled, 
  imageBounds, 
  fileId, 
  zoomToImage, 
  treePoints, 
  polygonCoords, 
  sapporoBounds, 
  mode, 
  onClearResults, 
  onImageLoaded, 
  isMultiPolygon,
  drawMode,
  drawType,
  showAdminBoundaries,
  showRivers,
  showForestRegistry,
  showSlope,
  forestSearchQuery,
  onDrawModeChange,
  onForestSearchQueryChange,
  onHasShapeChange
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const imageLayerRef = useRef(null)
  const rectangleLayerRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [hasShape, setHasShape] = useState(false) // 図形が描画されているか
  const [polygonPointCount, setPolygonPointCount] = useState(0) // ポリゴンの頂点数
  const [highlightedLayerRef, setHighlightedLayerRef] = useState(null) // ハイライトされたレイヤー
  const drawingStateRef = useRef({ startLatLng: null, shape: null, polygonPoints: [] })
  const shapeLayerRef = useRef(null)
  const treeMarkersRef = useRef([])
  const adminLayerRef = useRef(null)
  const riverLayerRef = useRef(null)
  const forestRegistryLayerRef = useRef(null)
  const slopeLayerRef = useRef(null)
  const sapporoBoundsLayerRef = useRef(null)
  const onAnalyzeRef = useRef(onAnalyze)
  const disabledRef = useRef(disabled)
  
  // 最新の値をrefに保存
  useEffect(() => {
    onAnalyzeRef.current = onAnalyze
    disabledRef.current = disabled
  }, [onAnalyze, disabled])

  // グローバル関数を登録
  useEffect(() => {
    // 図形クリア関数
    window.clearMapShape = () => {
      if (shapeLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(shapeLayerRef.current)
        shapeLayerRef.current = null
        setHasShape(false)
        console.log('図形をクリアしました')
      }
    }
    
    // 結果クリア関数
    window.clearMapResults = () => {
      if (treeMarkersRef.current && mapInstanceRef.current) {
        treeMarkersRef.current.forEach(marker => {
          mapInstanceRef.current.removeLayer(marker)
        })
        treeMarkersRef.current = []
        console.log('解析結果をクリアしました')
      }
    }
    
    // 森林簿検索関数
    window.handleForestSearch = (query) => {
      if (!query || !query.trim() || !forestRegistryLayerRef.current || !mapInstanceRef.current) {
        console.log('検索条件が不足しています')
        return
      }

      const map = mapInstanceRef.current
      const searchQuery = query.trim()
      console.log('森林簿を検索:', searchQuery)

      // 前回のハイライトをクリア
      if (highlightedLayerRef) {
        highlightedLayerRef.setStyle({
          color: '#8B4513',
          weight: 2,
          opacity: 0.7,
          fillOpacity: 0.15
        })
      }

      // レイヤーを検索
      let found = false
      forestRegistryLayerRef.current.eachLayer((layer) => {
        const props = layer.feature.properties
        const rinban = props['林班']
        const syouhan = props['小班']
        const id = `${rinban}-${syouhan}`

        if (id === searchQuery || rinban === searchQuery || syouhan === searchQuery) {
          console.log('見つかりました:', id)
          found = true

          // ハイライト表示
          layer.setStyle({
            color: '#FF4500',
            weight: 4,
            opacity: 1,
            fillOpacity: 0.3,
            fillColor: '#FF4500'
          })
          setHighlightedLayerRef(layer)

          // ズーム
          const bounds = layer.getBounds()
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16
          })

          // ポップアップを表示
          layer.openPopup()
        }
      })

      if (!found) {
        alert(`林班・小班「${searchQuery}」が見つかりませんでした。\n\n例: 0053-0049`)
      }
    }

    return () => {
      delete window.clearMapShape
      delete window.clearMapResults
      delete window.handleForestSearch
    }
  }, [highlightedLayerRef])

  // 描画モードの状態を更新
  useEffect(() => {
    drawingStateRef.current.drawModeEnabled = drawMode
    drawingStateRef.current.drawType = drawType
    
    if (mapInstanceRef.current) {
      const container = mapInstanceRef.current.getContainer()
      if (drawMode) {
        container.style.cursor = 'crosshair'
      } else {
        container.style.cursor = ''
      }
    }
  }, [drawMode, drawType])

  // 地図の初期化
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    console.log('地図を初期化します')
    drawingStateRef.current.drawModeEnabled = false

    // 地図の初期化（北海道中心）
    const map = L.map(mapRef.current, {
      center: [43.06, 141.35],
      zoom: 10,
      zoomControl: false // デフォルトのズームコントロールを無効化
    })
    mapInstanceRef.current = map
    window.mapInstance = map

    // カスタムズームコントロールを右下に追加
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map)

    // 国土地理院の航空写真タイル
    L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg', {
      attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
      maxZoom: 18,
      minZoom: 2
    }).addTo(map)

    // 描画の実装
    let startLatLng = null
    let tempShape = null
    let isDrawingActive = false
    let polygonPoints = []

    let clickTimeout = null
    let clickCount = 0

    const handleMapClick = (e) => {
      if (disabledRef.current || !drawingStateRef.current.drawModeEnabled) return
      if (drawingStateRef.current.drawType !== 'polygon') return
      
      clickCount++
      
      // ダブルクリック判定
      if (clickCount === 1) {
        clickTimeout = setTimeout(() => {
          // シングルクリック処理
          console.log('ポリゴン頂点追加:', e.latlng)
          polygonPoints.push(e.latlng)
          setPolygonPointCount(polygonPoints.length)
          
          // 既存の図形を削除
          if (shapeLayerRef.current) {
            map.removeLayer(shapeLayerRef.current)
            shapeLayerRef.current = null
          }
          
          if (tempShape) {
            map.removeLayer(tempShape)
          }
          
          // 一時的なポリゴンを作成
          if (polygonPoints.length >= 2) {
            tempShape = L.polygon(polygonPoints, {
              color: '#2c5f2d',
              weight: 3,
              fillOpacity: 0.2,
              pane: 'overlayPane'
            }).addTo(map)
          } else if (polygonPoints.length === 1) {
            // 最初の点をマーカーで表示
            tempShape = L.circleMarker(polygonPoints[0], {
              radius: 5,
              color: '#2c5f2d',
              fillColor: '#2c5f2d',
              fillOpacity: 1
            }).addTo(map)
          }
          
          clickCount = 0
        }, 300)
      } else if (clickCount === 2) {
        // ダブルクリック処理
        clearTimeout(clickTimeout)
        clickCount = 0
        
        if (polygonPoints.length < 3) {
          console.log('頂点が3つ以上必要です')
          return
        }
        
        console.log('ポリゴン完成:', polygonPoints.length, '頂点')
        
        // 一時図形を削除
        if (tempShape) {
          map.removeLayer(tempShape)
          tempShape = null
        }
        
        // 最終的なポリゴンを作成
        const finalPolygon = L.polygon(polygonPoints, {
          color: '#2c5f2d',
          weight: 3,
          fillOpacity: 0.2,
          pane: 'overlayPane'
        }).addTo(map)
        
        shapeLayerRef.current = finalPolygon
        setHasShape(true)
        onHasShapeChange(true)
        onDrawModeChange(false)
        drawingStateRef.current.drawModeEnabled = false
        
        // ポリゴンの境界と座標を取得して解析
        const bounds = finalPolygon.getBounds()
        const latLngs = finalPolygon.getLatLngs()[0]
        console.log('ポリゴンの境界:', bounds)
        console.log('ポリゴンの座標:', latLngs)
        console.log('解析を開始します')
        
        // 森林簿の範囲指定モードの場合
        if (window.forestRegistryPartialMode) {
          console.log('森林簿範囲指定モード: ユーザー指定ポリゴンを使用')
          window.forestRegistryPartialMode = false
          
          // 森林簿レイヤーのz-indexを元に戻す
          if (window.mapInstance) {
            const pane = window.mapInstance.getPane('forestRegistryPane')
            if (pane) {
              pane.style.zIndex = 450 // 元の値に戻す
            }
          }
          
          // 森林簿レイヤーを再表示（透明度を元に戻す）
          if (window.forestRegistryLayer) {
            window.forestRegistryLayer.eachLayer(layer => {
              layer.setStyle({ opacity: 0.7, fillOpacity: 0.15 })
            })
            console.log('森林簿レイヤーの透明度を元に戻しました（イベントは無効のまま）')
          }
        }
        
        // 解析を実行（ポリゴン座標も渡す）
        onAnalyzeRef.current(bounds, latLngs)
        
        // リセット
        polygonPoints = []
        drawingStateRef.current.polygonPoints = []
        setPolygonPointCount(0)
      }
    }

    const handleMouseDown = (e) => {
      if (disabledRef.current || !drawingStateRef.current.drawModeEnabled) return
      if (drawingStateRef.current.drawType !== 'rectangle') return
      
      // 地図のドラッグを無効化
      map.dragging.disable()
      
      console.log('矩形描画開始:', e.latlng)
      startLatLng = e.latlng
      isDrawingActive = true
      setIsDrawing(true)
      
      // 既存の図形を削除
      if (shapeLayerRef.current) {
        map.removeLayer(shapeLayerRef.current)
        shapeLayerRef.current = null
      }
      
      // 一時的な矩形を作成
      tempShape = L.rectangle([startLatLng, startLatLng], {
        color: '#2c5f2d',
        weight: 3,
        fillOpacity: 0.2,
        pane: 'overlayPane'
      }).addTo(map)
    }

    const handleMouseMove = (e) => {
      if (!isDrawingActive || !startLatLng || !tempShape) return
      
      // 矩形を更新
      const bounds = L.latLngBounds(startLatLng, e.latlng)
      tempShape.setBounds(bounds)
    }

    const handleMouseUp = (e) => {
      // 地図のドラッグを再有効化
      map.dragging.enable()
      
      if (!isDrawingActive || !startLatLng || !tempShape) return
      
      console.log('矩形描画完了:', e.latlng)
      setIsDrawing(false)
      isDrawingActive = false
      
      const bounds = L.latLngBounds(startLatLng, e.latlng)
      
      // 矩形が小さすぎる場合は無視
      const distance = startLatLng.distanceTo(e.latlng)
      if (distance < 100) {
        console.log('矩形が小さすぎます')
        map.removeLayer(tempShape)
        startLatLng = null
        tempShape = null
        return
      }
      
      // 矩形を確定
      shapeLayerRef.current = tempShape
      setHasShape(true)
      onHasShapeChange(true)
      onDrawModeChange(false)
      drawingStateRef.current.drawModeEnabled = false
      startLatLng = null
      tempShape = null
      
      console.log('解析を開始します:', bounds)
      
      // 森林簿の範囲指定モードの場合
      if (window.forestRegistryPartialMode && window.currentForestPolygon) {
        console.log('森林簿範囲指定モード: 小班ポリゴンとの交差を計算')
        // 矩形の4隅の座標を取得
        const rectCoords = [
          { lat: bounds.getSouth(), lng: bounds.getWest() },
          { lat: bounds.getNorth(), lng: bounds.getWest() },
          { lat: bounds.getNorth(), lng: bounds.getEast() },
          { lat: bounds.getSouth(), lng: bounds.getEast() }
        ]
        // 小班ポリゴンとの交差として扱う（簡易実装）
        onAnalyzeRef.current(bounds, rectCoords)
        window.forestRegistryPartialMode = false
        
        // 森林簿レイヤーのz-indexを元に戻す
        if (window.mapInstance) {
          const pane = window.mapInstance.getPane('forestRegistryPane')
          if (pane) {
            pane.style.zIndex = 450 // 元の値に戻す
          }
        }
        
        // 森林簿レイヤーを再表示（透明度を元に戻す）
        // ただし、イベントは復元されないので、ページをリロードするか、森林簿ボタンをOFF/ONする必要がある
        if (window.forestRegistryLayer) {
          window.forestRegistryLayer.eachLayer(layer => {
            layer.setStyle({ opacity: 0.7, fillOpacity: 0.15 })
          })
          console.log('森林簿レイヤーの透明度を元に戻しました（イベントは無効のまま）')
        }
      } else {
        // 通常モード: 矩形の場合はポリゴン座標なし
        onAnalyzeRef.current(bounds, null)
      }
    }

    map.on('click', handleMapClick)
    map.on('mousedown', handleMouseDown)
    map.on('mousemove', handleMouseMove)
    map.on('mouseup', handleMouseUp)
    
    // ダブルクリックでのズームを無効化（ポリゴン描画のため）
    map.doubleClickZoom.disable()

    // クリーンアップ
    return () => {
      console.log('地図をクリーンアップします')
      map.remove()
      mapInstanceRef.current = null
    }
  }, []) // 依存配列を空にして、初回のみ実行

  // 画像オーバーレイの表示
  useEffect(() => {
    if (!mapInstanceRef.current || !imageBounds || !fileId) {
      console.log('画像オーバーレイの条件が満たされていません', { 
        hasMap: !!mapInstanceRef.current, 
        imageBounds, 
        fileId 
      })
      return
    }

    console.log('画像オーバーレイを追加します', imageBounds)
    const map = mapInstanceRef.current

    // 既存の画像レイヤーを削除
    if (imageLayerRef.current) {
      console.log('既存の画像レイヤーを削除します')
      map.removeLayer(imageLayerRef.current)
    }

    // 画像の境界（min_lat/max_lat形式に対応）
    const bounds = [
      [imageBounds.min_lat || imageBounds.south, imageBounds.min_lon || imageBounds.west],
      [imageBounds.max_lat || imageBounds.north, imageBounds.max_lon || imageBounds.east]
    ]
    console.log('Leaflet用の境界:', bounds)

    // ローディング開始
    setImageLoading(true)

    // 画像オーバーレイを追加（MVP版: 直接パスを使用）
    const imageUrl = fileId.startsWith('/') ? fileId : `${API_URL}/image/${fileId}`
    console.log('画像URL:', imageUrl)
    
    const imageLayer = L.imageOverlay(imageUrl, bounds, {
      opacity: 0.9,
      interactive: false,
      crossOrigin: 'anonymous',
      className: 'uploaded-image-overlay'
    })
    
    imageLayer.on('load', () => {
      console.log('✅ 画像の読み込みが完了しました')
      console.log('画像レイヤーの境界:', imageLayer.getBounds())
      setImageLoading(false)
      // 親コンポーネントに通知
      if (onImageLoaded) {
        onImageLoaded()
      }
    })
    
    imageLayer.on('error', (e) => {
      console.error('❌ 画像の読み込みエラー:', e)
      setImageLoading(false)
      alert('画像の読み込みに失敗しました。ファイル形式を確認してください。')
    })
    
    imageLayer.addTo(map)
    imageLayerRef.current = imageLayer
    console.log('画像レイヤーを地図に追加しました')

    // 地図を画像の範囲に移動
    setTimeout(() => {
      map.fitBounds(bounds, { 
        padding: [20, 20],
        maxZoom: 18
      })
      console.log('地図を画像の範囲に移動しました')
    }, 100)

  }, [imageBounds, fileId])

  // ズームボタンが押されたときの処理
  useEffect(() => {
    if (!mapInstanceRef.current || !imageBounds || zoomToImage === 0) return

    console.log('画像位置にズームします')
    const map = mapInstanceRef.current

    const bounds = [
      [imageBounds.min_lat || imageBounds.south, imageBounds.min_lon || imageBounds.west],
      [imageBounds.max_lat || imageBounds.north, imageBounds.max_lon || imageBounds.east]
    ]

    // アニメーション付きでズーム
    map.flyToBounds(bounds, {
      padding: [50, 50],
      duration: 1.5
    })

  }, [zoomToImage, imageBounds])

  // 樹木位置をメッシュ表示
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // 既存のマーカーを削除
    treeMarkersRef.current.forEach(marker => {
      map.removeLayer(marker)
    })
    treeMarkersRef.current = []

    // 新しいメッシュを追加
    if (treePoints && treePoints.length > 0) {
      console.log(`樹木位置をメッシュ表示: ${treePoints.length}本`)

      // 材積の範囲を計算
      const volumes = treePoints.map(p => p.volume)
      const maxVolume = Math.max(...volumes)
      const minVolume = Math.min(...volumes)
      console.log(`材積範囲: ${minVolume.toFixed(2)} - ${maxVolume.toFixed(2)} m³`)

      // 全体の範囲を計算
      const lats = treePoints.map(p => p.lat)
      const lons = treePoints.map(p => p.lon)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLon = Math.min(...lons)
      const maxLon = Math.max(...lons)
      
      // メッシュサイズを推定（隣接するポイント間の距離から計算）
      let estimatedMeshSizeM = 10 // デフォルト10m
      if (treePoints.length > 1) {
        // 最初の2点間の距離からメッシュサイズを推定
        const p1 = treePoints[0]
        const p2 = treePoints[1]
        const latDist = Math.abs(p1.lat - p2.lat) * 111000
        const lonDist = Math.abs(p1.lon - p2.lon) * 111000 * Math.cos(p1.lat * Math.PI / 180)
        estimatedMeshSizeM = Math.max(latDist, lonDist)
        console.log(`推定メッシュサイズ: ${estimatedMeshSizeM.toFixed(1)}m`)
      }
      
      // 全体の範囲に対して統一されたメッシュサイズを使用
      const avgLat = (minLat + maxLat) / 2
      const latStep = estimatedMeshSizeM / 111000
      const lonStep = estimatedMeshSizeM / (111000 * Math.cos(avgLat * Math.PI / 180))
      
      // 白い背景レイヤーを追加（ポリゴンまたは矩形）
      let backgroundLayer
      if (polygonCoords && polygonCoords.length > 0) {
        // ポリゴンが指定されている場合はポリゴン形状の背景
        // 複数ポリゴン（配列の配列）かどうかをチェック
        // polygonCoords[0]が配列で、その最初の要素がオブジェクト（{lat, lon}）なら複数ポリゴン
        const isMultiPolygonDetected = Array.isArray(polygonCoords[0]) && 
                                       polygonCoords[0].length > 0 &&
                                       typeof polygonCoords[0][0] === 'object' &&
                                       polygonCoords[0][0].lat !== undefined
        
        console.log('ポリゴン座標の構造チェック:', {
          isArray: Array.isArray(polygonCoords),
          length: polygonCoords.length,
          firstElement: polygonCoords[0],
          isMultiPolygonDetected: isMultiPolygonDetected,
          isMultiPolygonProp: isMultiPolygon
        })
        
        // propsから渡されたisMultiPolygonフラグまたは自動検出を使用
        const useMultiPolygon = isMultiPolygon || isMultiPolygonDetected
        
        if (useMultiPolygon) {
          // 複数ポリゴンの場合
          console.log('複数ポリゴン形状の白い背景を作成:', polygonCoords.length, '個のポリゴン')
          const allPolygonLatLngs = polygonCoords.map(polygon => 
            polygon.map(coord => [coord.lat, coord.lon || coord.lng])
          )
          
          backgroundLayer = L.polygon(allPolygonLatLngs, {
            color: 'white',
            weight: 0,
            opacity: 0,
            fillColor: 'white',
            fillOpacity: 0.9,
            zIndexOffset: 499
          })
        } else {
          // 単一ポリゴンの場合
          const polygonLatLngs = polygonCoords.map(coord => [coord.lat, coord.lon || coord.lng])
          console.log('ポリゴン形状の白い背景を作成:', polygonLatLngs.length, '頂点')
          
          backgroundLayer = L.polygon(polygonLatLngs, {
            color: 'white',
            weight: 0,
            opacity: 0,
            fillColor: 'white',
            fillOpacity: 0.9,
            zIndexOffset: 499
          })
        }
      } else {
        // ポリゴンがない場合は矩形の背景
        const backgroundBounds = [
          [minLat - latStep * 0.5, minLon - lonStep * 0.5],
          [maxLat + latStep * 0.5, maxLon + lonStep * 0.5]
        ]
        
        backgroundLayer = L.rectangle(backgroundBounds, {
          color: 'white',
          weight: 0,
          opacity: 0,
          fillColor: 'white',
          fillOpacity: 0.9,
          zIndexOffset: 499
        })
      }
      
      backgroundLayer.addTo(map)
      treeMarkersRef.current.push(backgroundLayer)
      console.log('白い背景レイヤーを追加しました')

      treePoints.forEach((point, index) => {
        const isConiferous = point.tree_type === 'coniferous'
        
        // 材積に応じた不透明度を計算（0.2〜0.95の範囲）
        const volumeRatio = maxVolume > minVolume 
          ? (point.volume - minVolume) / (maxVolume - minVolume)
          : 0.5
        const opacity = 0.2 + (volumeRatio * 0.75)
        
        // 針葉樹と広葉樹で色を分ける（はっきり区別）
        // 針葉樹: 濃い緑（#2e7d32）、広葉樹: 茶色系（#8d6e63）
        const baseColor = isConiferous ? '#2e7d32' : '#8d6e63'
        
        // 統一されたメッシュサイズで境界を計算（隙間なし）
        const bounds = [
          [point.lat - latStep / 2, point.lon - lonStep / 2],
          [point.lat + latStep / 2, point.lon + lonStep / 2]
        ]
        
        // 矩形メッシュを作成（境界線なし、隙間なし）
        const mesh = L.rectangle(bounds, {
          color: baseColor,
          weight: 0,
          opacity: 0,
          fillColor: baseColor,
          fillOpacity: opacity,
          interactive: true,
          zIndexOffset: 500
        })

        // ポップアップを追加
        const treeTypeName = point.tree_type === 'coniferous' ? '針葉樹' : '広葉樹'
        const icon = point.tree_type === 'coniferous' ? '🌲' : '🌳'
        mesh.bindPopup(`
          <div style="font-size: 13px;">
            <strong>🌲 ${treeTypeName}</strong><br/>
            胸高直径: ${point.dbh} cm<br/>
            材積: ${point.volume.toFixed(2)} m³<br/>
            <span style="color: #666; font-size: 11px;">
              (濃さ: ${(opacity * 100).toFixed(0)}%)
            </span>
          </div>
        `)

        mesh.addTo(map)
        treeMarkersRef.current.push(mesh)
      })
    }
  }, [treePoints])

  // 札幌市の範囲を表示（チャットボットモード用）
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // 既存の札幌市範囲レイヤーを削除
    if (sapporoBoundsLayerRef.current) {
      map.removeLayer(sapporoBoundsLayerRef.current)
      sapporoBoundsLayerRef.current = null
    }

    // 札幌市の範囲を表示
    if (sapporoBounds) {
      console.log('札幌市の行政区域を読み込みます')

      const baseUrl = import.meta.env.BASE_URL || '/'
      const adminUrl = `${baseUrl}data/administrative/admin_simple.geojson`
      
      fetch(adminUrl)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(data => {
          console.log('行政区域データ読み込み完了')
          
          // 札幌市のポリゴンを抽出（N03_004が市区町村名）
          const sapporoFeatures = data.features.filter(feature => {
            const city = feature.properties.N03_004 || ''
            const ward = feature.properties.N03_005 || ''
            // 札幌市の各区を抽出（中央区、北区、東区、白石区、豊平区、南区、西区、厚別区、手稲区、清田区）
            return city.includes('札幌') || 
                   ward.includes('中央') || ward.includes('北区') || ward.includes('東区') ||
                   ward.includes('白石') || ward.includes('豊平') || ward.includes('南区') ||
                   ward.includes('西区') || ward.includes('厚別') || ward.includes('手稲') ||
                   ward.includes('清田')
          })
          
          console.log('抽出された札幌市のフィーチャー:', sapporoFeatures.length)
          if (sapporoFeatures.length > 0) {
            console.log('最初のフィーチャーのプロパティ:', sapporoFeatures[0].properties)
          }
          
          if (sapporoFeatures.length === 0) {
            console.warn('札幌市のポリゴンが見つかりません。全データを表示します。')
            // 札幌市が見つからない場合は、座標範囲から矩形を表示
            const bounds = [
              [sapporoBounds.min_lat, sapporoBounds.min_lon],
              [sapporoBounds.max_lat, sapporoBounds.max_lon]
            ]
            
            // 札幌市用のカスタムペインを作成（z-indexを低く設定）
            if (!map.getPane('sapporoBackgroundPane')) {
              const pane = map.createPane('sapporoBackgroundPane')
              pane.style.zIndex = 350 // overlayPane(400)より低く設定
            }
            
            const boundsLayer = L.rectangle(bounds, {
              color: '#FF6B6B',
              weight: 3,
              opacity: 0.8,
              fillColor: 'white',
              fillOpacity: 0.9,
              pane: 'sapporoBackgroundPane'
            }).addTo(map)
            
            boundsLayer.bindPopup(`
              <div style="font-size: 13px;">
                <strong>🗺️ 札幌市全体（概算範囲）</strong><br/>
                解析範囲: 約1,121 km²
              </div>
            `)
            
            sapporoBoundsLayerRef.current = boundsLayer
            
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 11
            })
            return
          }
          
          console.log(`札幌市のポリゴンを${sapporoFeatures.length}件見つけました`)
          
          // 札幌市用のカスタムペインを作成（z-indexを低く設定）
          if (!map.getPane('sapporoBackgroundPane')) {
            const pane = map.createPane('sapporoBackgroundPane')
            pane.style.zIndex = 350 // overlayPane(400)より低く設定
          }
          
          // GeoJSONレイヤーを作成
          const sapporoLayer = L.geoJSON({
            type: 'FeatureCollection',
            features: sapporoFeatures
          }, {
            style: {
              color: '#FF6B6B',
              weight: 3,
              opacity: 0.8,
              fillColor: 'white',
              fillOpacity: 0.9
            },
            pane: 'sapporoBackgroundPane'
          }).addTo(map)
          
          // ポップアップを追加
          sapporoLayer.bindPopup(`
            <div style="font-size: 13px;">
              <strong>🗺️ 札幌市全体</strong><br/>
              解析範囲: 約1,121 km²<br/>
              対象地域: 札幌市行政区域
            </div>
          `)
          
          sapporoBoundsLayerRef.current = sapporoLayer
          
          // 地図を札幌市の範囲に移動
          setTimeout(() => {
            const bounds = sapporoLayer.getBounds()
            map.fitBounds(bounds, {
              padding: [50, 50],
              maxZoom: 11
            })
            console.log('地図を札幌市の範囲に移動しました')
          }, 100)
        })
        .catch(err => {
          console.error('札幌市行政区域の読み込みエラー:', err)
          // エラー時は矩形で表示
          const bounds = [
            [sapporoBounds.min_lat, sapporoBounds.min_lon],
            [sapporoBounds.max_lat, sapporoBounds.max_lon]
          ]
          
          const boundsLayer = L.rectangle(bounds, {
            color: '#FF6B6B',
            weight: 3,
            opacity: 0.8,
            fillColor: '#FF6B6B',
            fillOpacity: 0.2,
            pane: 'overlayPane'
          }).addTo(map)
          
          boundsLayer.bindPopup(`
            <div style="font-size: 13px;">
              <strong>🗺️ 札幌市全体（概算範囲）</strong><br/>
              解析範囲: 約1,121 km²
            </div>
          `)
          
          sapporoBoundsLayerRef.current = boundsLayer
          
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 11
          })
        })
    }
  }, [sapporoBounds])

  // 行政区域の表示/非表示
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    if (showAdminBoundaries && !adminLayerRef.current) {
      // 行政区域データを読み込み
      console.log('行政区域データを読み込みます')
      const baseUrl = import.meta.env.BASE_URL || '/'
      const adminUrl = `${baseUrl}data/administrative/admin_simple.geojson`
      console.log('行政区域URL:', adminUrl)
      fetch(adminUrl)
        .then(res => {
          console.log('行政区域レスポンス:', res.status, res.ok)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(data => {
          console.log('行政区域データ読み込み完了')
          
          // GeoJSONレイヤーを追加
          const adminLayer = L.geoJSON(data, {
            style: {
              color: '#ff6b6b',
              weight: 2,
              opacity: 0.6,
              fillOpacity: 0.05,
              fillColor: '#ff6b6b'
            },
            interactive: false,  // クリックイベントを無効化
            onEachFeature: (feature, layer) => {
              // ポップアップは無効化（クリックイベントと競合するため）
              // 必要に応じてホバー時のツールチップに変更可能
            }
          })
          
          // 行政区域レイヤーを地図に追加（z-indexを低く設定）
          adminLayer.addTo(map)
          
          // SVGレイヤーのz-indexを調整
          const panes = map.getPanes()
          if (panes.overlayPane) {
            panes.overlayPane.style.zIndex = 400
          }
          
          adminLayerRef.current = adminLayer
          console.log('行政区域を地図に追加しました（インタラクティブ無効）')
        })
        .catch(err => {
          console.error('行政区域データの読み込みエラー:', err)
        })
    } else if (!showAdminBoundaries && adminLayerRef.current) {
      // 行政区域レイヤーを削除
      map.removeLayer(adminLayerRef.current)
      adminLayerRef.current = null
      console.log('行政区域を非表示にしました')
    }
  }, [showAdminBoundaries])

  // 河川の表示/非表示
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    if (showRivers && !riverLayerRef.current) {
      // 河川データを読み込み
      console.log('河川データを読み込みます')
      const baseUrl = import.meta.env.BASE_URL || '/'
      const riverUrl = `${baseUrl}data/administrative/kasen/rivers_simple.geojson`
      console.log('河川URL:', riverUrl)
      fetch(riverUrl)
        .then(res => {
          console.log('河川レスポンス:', res.status, res.ok)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(data => {
          console.log('河川データ読み込み完了:', data.features?.length, '件')
          console.log('河川データの最初のfeature:', data.features?.[0])
          
          // GeoJSONレイヤーを追加
          const riverLayer = L.geoJSON(data, {
            style: {
              color: '#2196F3',
              weight: 2,
              opacity: 0.7,
              fillOpacity: 0.1,
              fillColor: '#2196F3'
            },
            interactive: false  // クリックイベントを無効化
          })
          
          riverLayer.addTo(map)
          riverLayerRef.current = riverLayer
          console.log('河川を地図に追加しました')
        })
        .catch(err => {
          console.error('河川データの読み込みエラー:', err)
        })
    } else if (!showRivers && riverLayerRef.current) {
      // 河川レイヤーを削除
      map.removeLayer(riverLayerRef.current)
      riverLayerRef.current = null
      console.log('河川を非表示にしました')
    }
  }, [showRivers])

  // 森林簿の表示/非表示
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    if (showForestRegistry && !forestRegistryLayerRef.current) {
      // 森林簿データを読み込み
      console.log('森林簿データを読み込みます')
      const baseUrl = import.meta.env.BASE_URL || '/'
      const forestUrl = `${baseUrl}data/administrative/kitamirinsyou/forest_registry.geojson`
      console.log('森林簿URL:', forestUrl)
      fetch(forestUrl)
        .then(res => {
          console.log('森林簿レスポンス:', res.status, res.ok)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(data => {
          console.log('森林簿データ読み込み完了:', data.features?.length, '件')
          
          // 森林簿用のカスタムペインを作成（z-indexを制御するため）
          if (!map.getPane('forestRegistryPane')) {
            const pane = map.createPane('forestRegistryPane')
            pane.style.zIndex = 450 // overlayPane(400)より高く、markerPane(600)より低く設定
          }
          
          // GeoJSONレイヤーを追加
          const forestLayer = L.geoJSON(data, {
            pane: 'forestRegistryPane',
            style: {
              color: '#8B4513',
              weight: 2,
              opacity: 0.7,
              fillOpacity: 0.15,
              fillColor: '#DEB887'
            },
            onEachFeature: (feature, layer) => {
              // クリックイベントハンドラーを保存
              const clickHandler = (e) => {
                console.log('森林簿レイヤークリック, 範囲指定モード:', window.forestRegistryPartialMode)
                // 範囲指定モードの時はイベントを完全に無視
                if (window.forestRegistryPartialMode) {
                  console.log('範囲指定モード中のため、ポップアップを表示しません')
                  // イベントの伝播を止める
                  L.DomEvent.stopPropagation(e)
                  L.DomEvent.preventDefault(e)
                  // ポップアップを閉じる
                  map.closePopup()
                  // 何もしない
                  return
                }
                L.DomEvent.stopPropagation(e)
                
                const props = feature.properties
                const bounds = layer.getBounds()
                
                console.log('森林簿ポリゴンクリック:', props)
                console.log('境界:', bounds)
                
                // ポリゴンの座標を取得
                let latLngs = layer.getLatLngs()
                // MultiPolygonの場合は最初のポリゴンの最初のリングを取得
                while (Array.isArray(latLngs[0]) && latLngs[0].lat === undefined) {
                  latLngs = latLngs[0]
                }
                console.log('ポリゴン座標:', latLngs.length, '頂点')
                
                // グローバル変数に保存（ポップアップから参照するため）
                window.currentForestPolygon = latLngs
                window.currentForestBounds = bounds
                window.currentForestRegistryId = `${props['林班']}-${props['小班']}`
                
                // ポップアップを表示
                const popupContent = `
                  <div style="font-size: 13px;">
                    <strong>🌲 林班・小班</strong><br/>
                    林班: ${props['林班'] || 'N/A'}<br/>
                    小班: ${props['小班'] || 'N/A'}<br/>
                    面積: ${props['GISAREA'] || 'N/A'} ha<br/>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                      <button 
                        onclick="window.analyzeForestRegistryWhole()"
                        style="
                          flex: 1;
                          padding: 6px 12px;
                          background: #2c5f2d;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          cursor: pointer;
                          font-size: 11px;
                          font-weight: bold;
                        "
                      >
                        まるごと解析
                      </button>
                      <button 
                        onclick="window.analyzeForestRegistryPartial()"
                        style="
                          flex: 1;
                          padding: 6px 12px;
                          background: #ff8c00;
                          color: white;
                          border: none;
                          border-radius: 4px;
                          cursor: pointer;
                          font-size: 11px;
                          font-weight: bold;
                        "
                      >
                        範囲を指定
                      </button>
                    </div>
                  </div>
                `
                layer.bindPopup(popupContent).openPopup()
              }
              
              // クリックイベントを登録
              layer.on('click', clickHandler)
              
              // ホバー時のスタイル変更
              layer.on('mouseover', () => {
                layer.setStyle({
                  fillOpacity: 0.4,
                  weight: 3
                })
              })
              
              layer.on('mouseout', () => {
                layer.setStyle({
                  fillOpacity: 0.15,
                  weight: 2
                })
              })
            }
          })
          
          forestLayer.addTo(map)
          forestRegistryLayerRef.current = forestLayer
          window.forestRegistryLayer = forestLayer
          
          // z-indexを確認
          const pane = map.getPane('forestRegistryPane')
          console.log('森林簿を地図に追加しました。z-index:', pane ? pane.style.zIndex : 'undefined')
        })
        .catch(err => {
          console.error('森林簿データの読み込みエラー:', err)
        })
    } else if (!showForestRegistry && forestRegistryLayerRef.current) {
      // 森林簿レイヤーを削除
      map.removeLayer(forestRegistryLayerRef.current)
      forestRegistryLayerRef.current = null
      window.forestRegistryLayer = null
      console.log('森林簿を非表示にしました')
    }
  }, [showForestRegistry])

  // 標高傾斜度メッシュの表示/非表示
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    if (showSlope && !slopeLayerRef.current) {
      // 標高傾斜度メッシュデータを読み込み
      console.log('標高傾斜度メッシュデータを読み込みます')
      const baseUrl = import.meta.env.BASE_URL || '/'
      const slopeUrl = `${baseUrl}data/administrative/keisya/slope_simple.geojson`
      console.log('傾斜度URL:', slopeUrl)
      fetch(slopeUrl)
        .then(res => {
          console.log('傾斜度レスポンス:', res.status, res.ok)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(data => {
          console.log('傾斜度データ読み込み完了:', data.features?.length, '件')
          
          // 傾斜度用のカスタムペインを作成（z-indexを制御するため）
          if (!map.getPane('slopePane')) {
            const pane = map.createPane('slopePane')
            pane.style.zIndex = 380 // adminLayer(400)より低く、背景より高く設定
          }
          
          // 傾斜度の値に応じた色分け関数
          const getSlopeColor = (slope) => {
            if (slope < 5) return '#90EE90'    // 薄緑 (0-5度: 平坦)
            if (slope < 10) return '#FFFF99'   // 薄黄 (5-10度: 緩傾斜)
            if (slope < 15) return '#FFD700'   // 金色 (10-15度: 中傾斜)
            if (slope < 20) return '#FFA500'   // オレンジ (15-20度: 急傾斜)
            if (slope < 30) return '#FF6347'   // トマト色 (20-30度: 急峻)
            return '#DC143C'                   // 深紅 (30度以上: 非常に急峻)
          }
          
          // GeoJSONレイヤーを追加
          const slopeLayer = L.geoJSON(data, {
            pane: 'slopePane',
            style: (feature) => {
              // 傾斜度の値を取得（G04d_010が傾斜度）
              const slope = parseFloat(feature.properties.G04d_010) || 0
              return {
                color: getSlopeColor(slope),
                weight: 0,
                opacity: 0,
                fillOpacity: 0.6,
                fillColor: getSlopeColor(slope)
              }
            },
            onEachFeature: (feature, layer) => {
              // ポップアップを追加
              const slope = parseFloat(feature.properties.G04d_010) || 0
              const elevation = parseFloat(feature.properties.G04d_002) || 'N/A'
              
              let slopeCategory = ''
              if (slope < 5) slopeCategory = '平坦'
              else if (slope < 10) slopeCategory = '緩傾斜'
              else if (slope < 15) slopeCategory = '中傾斜'
              else if (slope < 20) slopeCategory = '急傾斜'
              else if (slope < 30) slopeCategory = '急峻'
              else slopeCategory = '非常に急峻'
              
              layer.bindPopup(`
                <div style="font-size: 13px;">
                  <strong>📐 標高傾斜度メッシュ</strong><br/>
                  傾斜度: ${slope.toFixed(1)}° (${slopeCategory})<br/>
                  標高: ${elevation}m<br/>
                  <div style="margin-top: 8px; font-size: 11px; color: #666;">
                    <div style="display: inline-block; width: 12px; height: 12px; background: ${getSlopeColor(slope)}; border: 1px solid #999; margin-right: 4px;"></div>
                    ${slopeCategory}地形
                  </div>
                </div>
              `)
            }
          })
          
          slopeLayer.addTo(map)
          slopeLayerRef.current = slopeLayer
          
          console.log('標高傾斜度メッシュを地図に追加しました')
        })
        .catch(err => {
          console.error('標高傾斜度メッシュデータの読み込みエラー:', err)
        })
    } else if (!showSlope && slopeLayerRef.current) {
      // 標高傾斜度メッシュレイヤーを削除
      map.removeLayer(slopeLayerRef.current)
      slopeLayerRef.current = null
      console.log('標高傾斜度メッシュを非表示にしました')
    }
  }, [showSlope])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: disabled ? 0.6 : 1
        }}
      />
      
      {/* データソース表示 */}
      {!imageBounds && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 12px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 1000,
            fontSize: '11px',
            color: '#666',
            maxWidth: '280px',
            lineHeight: '1.4'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
            📍 表示: 国土地理院 航空写真
          </div>
          <div style={{ fontSize: '10px', color: '#888' }}>
            解析時は最新の高解像度衛星画像を使用
          </div>
        </div>
      )}
      
      {/* 凡例表示 */}
      {treePoints && treePoints.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '50px',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '13px',
            minWidth: '200px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '16px', color: '#333' }}>
            針葉樹
          </div>
          
          {/* 針葉樹の濃淡バー */}
          <div style={{ display: 'flex', marginBottom: '8px', gap: '1px' }}>
            <div style={{ width: '25px', height: '20px', background: 'rgba(46, 125, 50, 0.2)', border: '1px solid #ccc' }} />
            <div style={{ width: '25px', height: '20px', background: 'rgba(46, 125, 50, 0.35)', border: '1px solid #ccc' }} />
            <div style={{ width: '25px', height: '20px', background: 'rgba(46, 125, 50, 0.5)', border: '1px solid #ccc' }} />
            <div style={{ width: '25px', height: '20px', background: 'rgba(46, 125, 50, 0.65)', border: '1px solid #ccc' }} />
            <div style={{ width: '25px', height: '20px', background: 'rgba(46, 125, 50, 0.8)', border: '1px solid #ccc' }} />
            <div style={{ width: '25px', height: '20px', background: 'rgba(46, 125, 50, 0.95)', border: '1px solid #ccc' }} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '10px', color: '#666' }}>
            <span>0-10</span>
            <span>50-60</span>
          </div>
          
          <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '16px', color: '#333' }}>
            広葉樹
          </div>
          
          {/* 広葉樹の濃淡バー */}
          <div style={{ display: 'flex', marginBottom: '8px', gap: '1px' }}>
            <div style={{ width: '25px', height: '20px', background: 'rgba(141, 110, 99, 0.2)', border: '1px solid #ccc' }} />
            <div style={{ width: '25px', height: '20px', background: 'rgba(141, 110, 99, 0.35)', border: '1px solid #ccc' }} />
            <div style={{ width: '25px', height: '20px', background: 'rgba(141, 110, 99, 0.5)', border: '1px solid #ccc' }} />
            <div style={{ width: '25px', height: '20px', background: 'rgba(141, 110, 99, 0.65)', border: '1px solid #ccc' }} />
            <div style={{ width: '25px', height: '20px', background: 'rgba(141, 110, 99, 0.8)', border: '1px solid #ccc' }} />
            <div style={{ width: '25px', height: '20px', background: 'rgba(141, 110, 99, 0.95)', border: '1px solid #ccc' }} />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666' }}>
            <span>0-10</span>
            <span>50-60</span>
          </div>
        </div>
      )}
      {!disabled && (
          <button
            onClick={() => {
              alert('【使い方】\n\n1. 左側のタブで解析モードを選択\n2. 地図上で矩形またはポリゴンを描画\n3. 自動的に解析が開始されます\n\n【ボタン説明】\n▭ 矩形: ドラッグで矩形を描画\n⬡ ポリゴン: クリックで頂点追加、ダブルクリックで完了\n🗺️ 行政区域: 市区町村の境界を表示\n🌊 河川: 河川を表示\n📋 森林簿: 林班・小班を表示してクリック可能')
            }}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'white',
              color: '#2c5f2d',
              padding: '10px 16px',
              border: '2px solid #2c5f2d',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 1000,
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="使い方"
          >
            ❓
          </button>
      )}
      
      {imageLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '30px 40px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 2000,
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #2c5f2d',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }}
          />
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c5f2d' }}>
            画像を変換中...
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
            GeoTIFFをPNGに変換しています
          </div>
        </div>
      )}
    </div>
  )
}

export default Map
