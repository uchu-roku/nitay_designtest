import { useRef, useEffect, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
console.log('API_URL:', API_URL, 'VITE_API_URL:', import.meta.env.VITE_API_URL)

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
  showContour,
  slopeOpacity,
  contourOpacity,
  forestSearchQuery,
  onDrawModeChange,
  onForestSearchQueryChange,
  onHasShapeChange,
  municipalityNames, // 市町村名マッピングを受け取る
  sidebarVisible // サイドバーの表示状態
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
  const contourLayerRef = useRef(null)
  const sapporoBoundsLayerRef = useRef(null)
  const clearControlRef = useRef(null)
  const undoControlRef = useRef(null)
  const onAnalyzeRef = useRef(onAnalyze)
  const disabledRef = useRef(disabled)
  const onClearResultsRef = useRef(onClearResults)
  
  // 最新の値をrefに保存
  useEffect(() => {
    onAnalyzeRef.current = onAnalyze
    disabledRef.current = disabled
    onClearResultsRef.current = onClearResults
  }, [onAnalyze, disabled, onClearResults])

  // グローバル関数を登録
  useEffect(() => {
    // 複数選択用のMapをグローバルに保持（JavaScriptのMapオブジェクト）
    if (!window.highlightedLayersMap) {
      window.highlightedLayersMap = new window.Map()
    }
    
    // 市町村コードリストを取得する関数
    window.getMunicipalityCodes = () => {
      if (!forestRegistryLayerRef.current) {
        return []
      }
      
      const municipalityCodes = new Set()
      forestRegistryLayerRef.current.eachLayer((layer) => {
        const props = layer.feature.properties
        const keycode = props['KEYCODE']
        if (keycode && keycode.length >= 4) {
          // KEYCODEの3～4桁目が市町村コード
          const munCode = keycode.substring(2, 4)
          municipalityCodes.add(munCode)
        }
      })
      
      return Array.from(municipalityCodes).sort()
    }
    
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
    
    // 選択クリア関数（複数選択対応）
    window.clearForestSelection = () => {
      if (!mapInstanceRef.current) return
      
      const map = mapInstanceRef.current
      const highlightedLayers = window.highlightedLayersMap
      console.log('選択をクリアします:', highlightedLayers.size, '件')
      
      // すべてのハイライトレイヤーを削除
      highlightedLayers.forEach((layer) => {
        map.removeLayer(layer)
      })
      
      highlightedLayers.clear()
      
      // 元の森林簿レイヤーのスタイルをリセット
      if (forestRegistryLayerRef.current) {
        forestRegistryLayerRef.current.eachLayer((layer) => {
          layer.setStyle({
            color: '#8B4513',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.15
          })
          layer._isHighlighted = false
        })
      }
      
      highlightedLayers.clear()
      console.log('選択をクリアしました')
    }
    
    // 選択情報を表示する関数
    window.showSelectedForestInfo = async () => {
      if (!mapInstanceRef.current) return
      
      const highlightedLayers = window.highlightedLayersMap
      
      if (highlightedLayers.size === 0) {
        alert('小班が選択されていません。')
        return
      }
      
      console.log('選択情報を表示:', highlightedLayers.size, '件')
      
      // 選択された小班の情報を収集
      const selectedInfos = []
      let totalArea = 0 // 面積合計
      
      for (const [keycode, layer] of highlightedLayers) {
        const props = layer.feature.properties
        const rinban = props['林班'] || 'N/A'
        const syouhan = props['小班'] || 'N/A'
        
        // KEYCODEから市町村コードを抽出（3-4桁目）
        const municipalityCode = keycode && keycode.length >= 4 ? keycode.substring(2, 4) : 'N/A'
        const municipalityName = municipalityNames[municipalityCode] || municipalityCode
        
        // 層データを取得
        let layersHtml = '<div style="color: #999; font-size: 10px;">読込中...</div>'
        let shobanArea = 0 // この小班の面積
        
        try {
          const layersRes = await fetch(`${API_URL}/api/layers/${keycode}`)
          if (layersRes.ok) {
            const layersData = await layersRes.json()
            
            if (layersData.layers && layersData.layers.length > 0) {
              layersHtml = `<div style="font-size: 10px; margin-top: 4px;">`
              layersData.layers.forEach((layerData, idx) => {
                const fukusou = layerData['複層区分コード'] || 'NULL'
                
                // 森林の種類（コード + 名前）
                const shinrinCode = layerData['森林の種類1コード'] || 'N/A'
                const shinrinName = layerData['森林の種類1名'] || ''
                const shinrin = shinrinName ? `${shinrinCode} (${shinrinName})` : shinrinCode
                
                // 林種（コード + 名前）
                const rinshuCode = layerData['林種コード'] || 'N/A'
                const rinshuName = layerData['林種名'] || ''
                const rinshu = rinshuName ? `${rinshuCode} (${rinshuName})` : rinshuCode
                
                // 樹種（コード + 名前）
                const jushuCode = layerData['樹種1コード'] || 'N/A'
                const jushuName = layerData['樹種1名'] || ''
                const jushu = jushuName ? `${jushuCode} (${jushuName})` : jushuCode
                
                const rinrei = layerData['林齢'] || 'N/A'
                const menseki = layerData['面積'] || 'N/A'
                
                // 面積を数値として加算（最初の層のみ、複層の場合は重複カウントを避ける）
                if (idx === 0 && menseki !== 'N/A') {
                  const areaValue = parseFloat(menseki)
                  if (!isNaN(areaValue)) {
                    shobanArea = areaValue
                  }
                }
                
                layersHtml += `
                  <div style="
                    background: ${idx % 2 === 0 ? '#f5f5f5' : 'white'};
                    padding: 6px;
                    margin: 3px 0;
                    border-radius: 3px;
                    font-size: 10px;
                    border-left: 2px solid #8B4513;
                  ">
                    <strong>層${idx + 1}</strong> (複層: ${fukusou})<br/>
                    森林種類: ${shinrin} / 林種: ${rinshu}<br/>
                    樹種: ${jushu} / 林齢: ${rinrei}年 / 面積: ${menseki}ha
                  </div>
                `
              })
              layersHtml += `</div>`
            } else {
              layersHtml = '<div style="color: #999; font-size: 10px;">層データなし</div>'
            }
          } else {
            layersHtml = '<div style="color: #d32f2f; font-size: 10px;">取得失敗</div>'
          }
        } catch (err) {
          layersHtml = '<div style="color: #d32f2f; font-size: 10px;">エラー</div>'
        }
        
        totalArea += shobanArea
        
        selectedInfos.push({
          rinban,
          syouhan,
          keycode,
          municipalityCode,
          municipalityName,
          layersHtml
        })
      }
      
      // ポップアップの内容を生成
      let popupContent = `
        <div style="font-size: 12px; min-width: 280px; max-width: 320px; max-height: 600px; overflow-y: auto;">
          <div style="
            background: linear-gradient(135deg, #2c5f2d 0%, #1a3a1b 100%);
            color: white;
            padding: 12px;
            margin: -10px -10px 10px -10px;
            border-radius: 4px 4px 0 0;
          ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 14px;">🌲 選択中の小班</strong>
                <span style="
                  background: rgba(255,255,255,0.2);
                  padding: 2px 8px;
                  border-radius: 10px;
                  margin-left: 8px;
                  font-size: 11px;
                ">${selectedInfos.length}件</span>
              </div>
            </div>
            <div style="
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px solid rgba(255,255,255,0.3);
              font-size: 12px;
            ">
              📊 合計面積: <strong>${totalArea.toFixed(2)} ha</strong>
            </div>
          </div>
          <div style="margin-top: 8px;">
      `
      
      selectedInfos.forEach((info, idx) => {
        popupContent += `
          <div style="
            background: ${idx % 2 === 0 ? '#f9f9f9' : 'white'};
            padding: 10px;
            margin: 6px 0;
            border-radius: 4px;
            border-left: 4px solid #FF4500;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            <div style="
              font-weight: bold;
              color: #2c5f2d;
              margin-bottom: 4px;
              font-size: 13px;
            ">
              ${idx + 1}. ${info.municipalityName} - 林班: ${info.rinban} / 小班: ${info.syouhan}
            </div>
            <div style="font-size: 9px; color: #999; margin-bottom: 6px;">
              市町村コード: ${info.municipalityCode} | KEYCODE: ${info.keycode}
            </div>
            ${info.layersHtml}
          </div>
        `
      })
      
      popupContent += `
          </div>
        </div>
      `
      
      // 既存のカスタムポップアップを削除
      const existingPopup = document.getElementById('custom-forest-popup')
      if (existingPopup) {
        existingPopup.remove()
      }
      
      // 固定位置のDIV要素としてポップアップを表示
      const popupDiv = document.createElement('div')
      popupDiv.id = 'custom-forest-popup'
      popupDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        height: 400px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        resize: vertical;
        overflow: hidden;
        min-height: 200px;
        max-height: calc(100vh - 40px);
      `
      
      // コンテンツラッパー（スクロール可能）
      const contentWrapper = document.createElement('div')
      contentWrapper.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      `
      contentWrapper.innerHTML = popupContent
      
      // 閉じるボタンを追加
      const closeButton = document.createElement('button')
      closeButton.innerHTML = '×'
      closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 25px;
        background: rgba(44, 95, 45, 0.9);
        border: 2px solid white;
        border-radius: 4px;
        font-size: 20px;
        color: white;
        cursor: pointer;
        z-index: 1001;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
      `
      closeButton.onmouseover = () => {
        closeButton.style.background = 'rgba(220, 53, 69, 0.9)'
        closeButton.style.transform = 'scale(1.1)'
      }
      closeButton.onmouseout = () => {
        closeButton.style.background = 'rgba(44, 95, 45, 0.9)'
        closeButton.style.transform = 'scale(1)'
      }
      closeButton.onclick = () => popupDiv.remove()
      
      // リサイズハンドルを追加
      const resizeHandle = document.createElement('div')
      resizeHandle.style.cssText = `
        height: 10px;
        background: linear-gradient(135deg, #2c5f2d 0%, #1a3a1b 100%);
        cursor: ns-resize;
        border-radius: 0 0 8px 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      `
      resizeHandle.innerHTML = `
        <div style="
          width: 40px;
          height: 3px;
          background: rgba(255,255,255,0.5);
          border-radius: 2px;
        "></div>
      `
      
      // リサイズ機能の実装
      let isResizing = false
      let startY = 0
      let startHeight = 0
      
      resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true
        startY = e.clientY
        startHeight = popupDiv.offsetHeight
        e.preventDefault()
      })
      
      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return
        
        const deltaY = e.clientY - startY
        const newHeight = startHeight + deltaY
        
        // 最小・最大高さの制限
        const minHeight = 200
        const maxHeight = window.innerHeight - 40
        
        if (newHeight >= minHeight && newHeight <= maxHeight) {
          popupDiv.style.height = newHeight + 'px'
        }
      })
      
      document.addEventListener('mouseup', () => {
        isResizing = false
      })
      
      popupDiv.appendChild(contentWrapper)
      popupDiv.appendChild(closeButton)
      popupDiv.appendChild(resizeHandle)
      
      document.body.appendChild(popupDiv)
    }
    
    // 選択した複数小班を解析する関数
    window.analyzeSelectedForests = () => {
      if (!mapInstanceRef.current) return
      
      const highlightedLayers = window.highlightedLayersMap
      
      if (highlightedLayers.size === 0) {
        alert('小班が選択されていません。')
        return
      }
      
      console.log('選択した小班を解析:', highlightedLayers.size, '件')
      
      // すべての選択された小班のポリゴンを結合
      const allPolygons = []
      let minLat = Infinity, maxLat = -Infinity
      let minLon = Infinity, maxLon = -Infinity
      
      highlightedLayers.forEach((layer) => {
        // ポリゴン座標を取得
        let latLngs = layer.getLatLngs()
        while (Array.isArray(latLngs[0]) && latLngs[0].lat === undefined) {
          latLngs = latLngs[0]
        }
        
        // 座標を配列に変換
        const coords = latLngs.map(latLng => ({
          lat: latLng.lat,
          lng: latLng.lng
        }))
        
        allPolygons.push(coords)
        
        // 境界を計算
        coords.forEach(coord => {
          minLat = Math.min(minLat, coord.lat)
          maxLat = Math.max(maxLat, coord.lat)
          minLon = Math.min(minLon, coord.lng)
          maxLon = Math.max(maxLon, coord.lng)
        })
      })
      
      console.log('解析範囲:', { minLat, maxLat, minLon, maxLon })
      console.log('ポリゴン数:', allPolygons.length)
      
      // 境界を作成
      const bounds = L.latLngBounds(
        [minLat, minLon],
        [maxLat, maxLon]
      )
      
      // 解析を実行（複数ポリゴン）
      // allPolygonsは配列の配列なので、そのまま渡す
      onAnalyzeRef.current(bounds, allPolygons, null, true)
    }
    
    // 森林簿検索関数（複数ID対応 + 市町村コードフィルタ）
    window.handleForestSearch = (query, municipalityCode = '') => {
      if (!query || !query.trim() || !forestRegistryLayerRef.current || !mapInstanceRef.current) {
        console.log('検索条件が不足しています')
        return
      }

      const map = mapInstanceRef.current
      const searchQuery = query.trim()
      const munCode = municipalityCode.trim()
      console.log('森林簿を検索:', searchQuery, '市町村コード:', munCode)

      // カンマ区切りで複数IDを分割
      const searchIds = searchQuery.split(',').map(id => id.trim()).filter(id => id.length > 0)
      console.log('検索ID:', searchIds)

      const highlightedLayers = window.highlightedLayersMap

      // 前回のハイライトをクリア
      if (highlightedLayerRef) {
        map.removeLayer(highlightedLayerRef)
      }
      highlightedLayers.forEach((layer) => {
        map.removeLayer(layer)
      })
      highlightedLayers.clear()
      
      // 元の森林簿レイヤーのスタイルをリセット
      if (forestRegistryLayerRef.current) {
        forestRegistryLayerRef.current.eachLayer((layer) => {
          layer.setStyle({
            color: '#8B4513',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.15
          })
          layer._isHighlighted = false
        })
      }

      const foundBounds = []

      // レイヤーを検索
      forestRegistryLayerRef.current.eachLayer((layer) => {
        const props = layer.feature.properties
        const keycode = props['KEYCODE']
        const rinban = props['林班'] || ''
        const syouhan = props['小班'] || ''
        const rinbanSyouhan = `${rinban}-${syouhan}`
        
        // 市町村コードでフィルタ（指定されている場合）
        if (munCode && keycode && keycode.length >= 4) {
          // KEYCODEの3～4桁目が市町村コード
          const layerMunCode = keycode.substring(2, 4)
          if (layerMunCode !== munCode) {
            return // 市町村コードが一致しない場合はスキップ
          }
        }
        
        // 検索IDのいずれかにマッチするかチェック
        // 林班-小班形式、林班のみ、小班のみ、KEYCODEのいずれかでマッチ
        const matched = searchIds.some(searchId => {
          return rinbanSyouhan === searchId || 
                 rinban === searchId || 
                 syouhan === searchId ||
                 keycode === searchId ||
                 rinbanSyouhan.includes(searchId) ||
                 searchId.includes(rinbanSyouhan)
        })

        if (matched) {
          console.log('見つかりました:', rinbanSyouhan, '(KEYCODE:', keycode, ')')

          // レイヤーを選択用ペインに移動（一度削除して再作成）
          const geojson = layer.toGeoJSON()
          const bounds = layer.getBounds()
          
          // 選択用ペインで新しいレイヤーを作成
          const highlightLayer = L.geoJSON(geojson, {
            pane: 'forestRegistryHighlightPane',
            style: {
              color: '#FF4500',
              weight: 4,
              opacity: 1,
              fillOpacity: 0.3,
              fillColor: '#FF4500'
            }
          }).addTo(map)
          
          highlightLayer.eachLayer((newLayer) => {
            newLayer._isHighlighted = true
            highlightedLayers.set(keycode, newLayer)
          })
          
          foundBounds.push(bounds)
          
          // 最初に見つかったレイヤーを保存（後方互換性）
          if (!highlightedLayerRef) {
            setHighlightedLayerRef(highlightLayer)
          }
        }
      })

      if (highlightedLayers.size === 0) {
        alert(`林班・小班「${searchQuery}」が見つかりませんでした。\n\n例: 0053-0049\n複数指定: 0053-0049, 0054-0001`)
      } else {
        console.log(`${highlightedLayers.size}件の小班を選択しました`)
        
        // 複数選択時は全体を表示
        if (foundBounds.length > 0) {
          const combinedBounds = foundBounds.reduce((acc, bounds) => {
            return acc.extend(bounds)
          }, L.latLngBounds(foundBounds[0]))
          
          map.fitBounds(combinedBounds, {
            padding: [50, 50],
            maxZoom: 16
          })
        }
      }
    }

    return () => {
      delete window.clearMapShape
      delete window.clearMapResults
      delete window.handleForestSearch
      delete window.clearForestSelection
      delete window.showSelectedForestInfo
      delete window.analyzeSelectedForests
      delete window.getMunicipalityCodes
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

    // 地図の初期化（函館中心）
    const map = L.map(mapRef.current, {
      center: [41.77, 140.73],
      zoom: 10,
      zoomControl: false // デフォルトのズームコントロールを無効化
    })
    mapInstanceRef.current = map
    window.mapInstance = map

    // カスタムズームコントロールを右下に追加
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map)

    // クリアボタンを左上に追加
    const ClearControl = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
        container.id = 'clear-control-container'
        container.style.cssText = `
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: margin-top 0.3s ease;
        `
        
        const button = L.DomUtil.create('a', 'leaflet-control-clear', container)
        
        button.innerHTML = `
          <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" 
                  fill="#333" 
                  stroke="none"/>
          </svg>
        `
        button.href = '#'
        button.title = 'リセット（選択をクリア）'
        button.style.cssText = `
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: none;
          cursor: pointer;
          text-decoration: none;
          padding: 0;
          transition: all 0.2s ease;
          border-radius: 4px;
        `
        
        // ホバーエフェクト
        button.addEventListener('mouseenter', function() {
          button.style.transform = 'rotate(-30deg) scale(1.05)'
          button.style.background = '#f5f5f5'
        })
        
        button.addEventListener('mouseleave', function() {
          button.style.transform = 'rotate(0deg) scale(1)'
          button.style.background = 'white'
        })
        
        button.addEventListener('mousedown', function() {
          button.style.transform = 'rotate(-30deg) scale(0.95)'
        })
        
        button.addEventListener('mouseup', function() {
          button.style.transform = 'rotate(-30deg) scale(1.05)'
        })
        
        L.DomEvent.on(button, 'click', function(e) {
          L.DomEvent.stopPropagation(e)
          L.DomEvent.preventDefault(e)
          
          // 初期化処理
          console.log('初期化ボタンがクリックされました')
          
          // 選択中の小班パネルを閉じる
          const popup = document.getElementById('custom-forest-popup')
          if (popup) {
            popup.remove()
          }
          
          // ハイライトされた小班をクリア
          console.log('ハイライトマップ:', window.highlightedLayersMap)
          console.log('ハイライト数:', window.highlightedLayersMap ? window.highlightedLayersMap.size : 0)
          
          if (window.highlightedLayersMap && window.highlightedLayersMap.size > 0) {
            window.highlightedLayersMap.forEach((highlightLayer, keycode) => {
              console.log('ハイライトレイヤーをクリア:', keycode, highlightLayer)
              
              // highlightLayerが単一レイヤーの場合
              if (highlightLayer._originalLayer) {
                console.log('単一レイヤー: 元のレイヤーを復元')
                map.removeLayer(highlightLayer)
                highlightLayer._originalLayer.addTo(map)
              } 
              // highlightLayerがGeoJSONレイヤーグループの場合
              else if (highlightLayer.eachLayer) {
                console.log('レイヤーグループ: 各レイヤーを処理')
                highlightLayer.eachLayer((layer) => {
                  console.log('レイヤーを処理:', layer, '元のレイヤー:', layer._originalLayer)
                  map.removeLayer(layer)
                  
                  if (layer._originalLayer) {
                    layer._originalLayer.addTo(map)
                  }
                })
              }
            })
            window.highlightedLayersMap.clear()
            console.log('ハイライトをクリアしました')
          } else {
            console.log('クリアするハイライトがありません')
          }
          
          // 描画中の図形をクリア
          if (shapeLayerRef.current) {
            map.removeLayer(shapeLayerRef.current)
            shapeLayerRef.current = null
          }
          
          // 一時的な図形をクリア（グローバル変数から）
          if (window.tempDrawingShape) {
            map.removeLayer(window.tempDrawingShape)
            window.tempDrawingShape = null
          }
          
          // ポリゴンポイントをクリア（グローバル変数から）
          if (window.polygonDrawingPoints) {
            window.polygonDrawingPoints = []
          }
          setPolygonPointCount(0)
          
          // 解析結果（メッシュ）をクリア
          if (window.clearMapResults) {
            window.clearMapResults()
          }
          
          // 描画モードを無効化
          drawingStateRef.current.drawModeEnabled = false
          drawingStateRef.current.drawType = null
          
          // 描画状態をリセット
          setHasShape(false)
          
          // App.jsxの状態をリセット（レイヤー表示と森林簿検索も含む）
          if (onClearResultsRef.current) {
            onClearResultsRef.current()
          }
          
          // レイヤー表示を初期化するイベントを発火
          window.dispatchEvent(new CustomEvent('resetLayers'))
          
          console.log('初期化完了')
        })
        
        return container
      }
    })
    
    const clearControl = new ClearControl()
    clearControl.addTo(map)
    clearControlRef.current = clearControl

    // 元に戻すボタンを左上に追加（リセットボタンの下）
    const UndoControl = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
        container.id = 'undo-control-container'
        container.style.cssText = `
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          margin-top: 10px;
          transition: margin-top 0.3s ease;
        `
        
        const button = L.DomUtil.create('a', 'leaflet-control-undo', container)
        
        button.innerHTML = `
          <svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" 
                  fill="#333" 
                  stroke="none"/>
          </svg>
        `
        button.href = '#'
        button.title = '元に戻す'
        button.style.cssText = `
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: none;
          cursor: pointer;
          text-decoration: none;
          padding: 0;
          transition: all 0.2s ease;
          border-radius: 4px;
        `
        
        // ホバーエフェクト
        button.addEventListener('mouseenter', function() {
          button.style.background = '#f5f5f5'
        })
        
        button.addEventListener('mouseleave', function() {
          button.style.background = 'white'
        })
        
        button.addEventListener('mousedown', function() {
          button.style.transform = 'scale(0.95)'
        })
        
        button.addEventListener('mouseup', function() {
          button.style.transform = 'scale(1)'
        })
        
        L.DomEvent.on(button, 'click', function(e) {
          L.DomEvent.stopPropagation(e)
          L.DomEvent.preventDefault(e)
          
          console.log('元に戻すボタンがクリックされました')
          
          // ポリゴン描画中の場合、最後の頂点を削除
          if (drawingStateRef.current.drawModeEnabled && 
              drawingStateRef.current.drawType === 'polygon' && 
              window.polygonDrawingPoints && 
              window.polygonDrawingPoints.length > 0) {
            
            // 最後の頂点を削除
            window.polygonDrawingPoints.pop()
            setPolygonPointCount(window.polygonDrawingPoints.length)
            
            // 一時的な図形を再描画
            if (window.tempDrawingShape) {
              map.removeLayer(window.tempDrawingShape)
            }
            
            if (window.polygonDrawingPoints.length > 0) {
              window.tempDrawingShape = L.polyline(window.polygonDrawingPoints, {
                color: '#2c5f2d',
                weight: 2,
                opacity: 0.8,
                dashArray: '5, 5'
              }).addTo(map)
            } else {
              window.tempDrawingShape = null
            }
            
            console.log('ポリゴンの頂点を削除しました。残り:', window.polygonDrawingPoints.length)
          } 
          // 描画済みの図形がある場合、図形を削除
          else if (shapeLayerRef.current) {
            map.removeLayer(shapeLayerRef.current)
            shapeLayerRef.current = null
            setHasShape(false)
            
            // 解析結果もクリア
            if (window.clearMapResults) {
              window.clearMapResults()
            }
            if (onClearResultsRef.current) {
              onClearResultsRef.current()
            }
            
            console.log('描画済みの図形を削除しました')
          }
          // ハイライトされた小班がある場合、最後のハイライトを削除
          else if (window.highlightedLayersMap && window.highlightedLayersMap.size > 0) {
            // Mapオブジェクトは挿入順を保持するので、最後の要素を取得
            const entries = Array.from(window.highlightedLayersMap.entries())
            const [lastKeycode, lastHighlightLayer] = entries[entries.length - 1]
            
            console.log('最後のハイライトを削除:', lastKeycode)
            
            // ハイライトレイヤーを削除して元のレイヤーを復元
            if (lastHighlightLayer._originalLayer) {
              map.removeLayer(lastHighlightLayer)
              lastHighlightLayer._originalLayer.addTo(map)
            } else if (lastHighlightLayer.eachLayer) {
              lastHighlightLayer.eachLayer((layer) => {
                map.removeLayer(layer)
                if (layer._originalLayer) {
                  layer._originalLayer.addTo(map)
                }
              })
            }
            
            window.highlightedLayersMap.delete(lastKeycode)
            console.log('ハイライトを削除しました。残り:', window.highlightedLayersMap.size)
            
            // 最後のハイライトを削除した場合、パネルも閉じる
            if (window.highlightedLayersMap.size === 0) {
              const popup = document.getElementById('custom-forest-popup')
              if (popup) {
                popup.remove()
              }
            }
          } else {
            console.log('元に戻す操作がありません')
          }
        })
        
        return container
      }
    })
    
    const undoControl = new UndoControl()
    undoControl.addTo(map)
    undoControlRef.current = undoControl

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
    
    // グローバル変数として保存（リセットボタンからアクセスできるように）
    window.tempDrawingShape = tempShape
    window.polygonDrawingPoints = polygonPoints

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
          window.polygonDrawingPoints = polygonPoints
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
            window.tempDrawingShape = tempShape
          } else if (polygonPoints.length === 1) {
            // 最初の点をマーカーで表示
            tempShape = L.circleMarker(polygonPoints[0], {
              radius: 5,
              color: '#2c5f2d',
              fillColor: '#2c5f2d',
              fillOpacity: 1
            }).addTo(map)
            window.tempDrawingShape = tempShape
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
      // メッシュ用のカスタムペインを作成（森林簿より上に表示）
      if (!map.getPane('meshPane')) {
        const pane = map.createPane('meshPane')
        pane.style.zIndex = 460 // 森林簿(450)より上
      }
      
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
            pane: 'meshPane',
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
            pane: 'meshPane',
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
          pane: 'meshPane',
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
          pane: 'meshPane',
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
      // 小班GeoJSONを読み込み
      console.log('小班GeoJSONを読み込みます')
      
      // バックエンドAPIから取得
      fetch(`${API_URL}/forest-registry/boundaries`)
        .then(async res => {
          console.log('小班GeoJSONレスポンス:', res.status, res.ok)
          console.log('小班GeoJSON URL:', `${API_URL}/forest-registry/boundaries`)
          const text = await res.text()
          console.log('小班GeoJSON レスポンス最初の200文字:', text.substring(0, 200))
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return JSON.parse(text)
        })
        .then(data => {
          console.log('小班GeoJSON読み込み完了:', data.features?.length, '件')
          
          // 森林簿用のカスタムペインを作成
          if (!map.getPane('forestRegistryPane')) {
            const pane = map.createPane('forestRegistryPane')
            pane.style.zIndex = 450
          }
          
          // 選択された小班用のカスタムペインを作成（メッシュより上）
          if (!map.getPane('forestRegistryHighlightPane')) {
            const pane = map.createPane('forestRegistryHighlightPane')
            pane.style.zIndex = 470 // メッシュ(460)より上
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
              const clickHandler = async (e) => {
                console.log('小班クリック, 範囲指定モード:', window.forestRegistryPartialMode)
                
                // 範囲指定モードの時はイベントを無視
                if (window.forestRegistryPartialMode) {
                  console.log('範囲指定モード中のため、ポップアップを表示しません')
                  L.DomEvent.stopPropagation(e)
                  L.DomEvent.preventDefault(e)
                  map.closePopup()
                  return
                }
                L.DomEvent.stopPropagation(e)
                
                const props = feature.properties
                const keycode = props['KEYCODE']
                const bounds = layer.getBounds()
                
                console.log('小班クリック:', props)
                console.log('KEYCODE:', keycode)
                
                // 詳細情報をポップアップで表示
                const rinban = props['林班'] || 'N/A'
                const syouhan = props['小班'] || 'N/A'
                
                // KEYCODEから市町村コードを抽出（3～4桁目）
                const municipalityCode = keycode && keycode.length >= 4 ? keycode.substring(2, 4) : 'N/A'
                const municipalityName = municipalityNames[municipalityCode] || municipalityCode
                
                // ローディング表示
                let popupContent = `
                  <div style="font-size: 12px; min-width: 250px;">
                    <div style="
                      background: linear-gradient(135deg, #2c5f2d 0%, #1a3a1b 100%);
                      color: white;
                      padding: 10px;
                      margin: -10px -10px 10px -10px;
                      border-radius: 4px 4px 0 0;
                    ">
                      <strong style="font-size: 14px;">🌲 小班情報</strong>
                    </div>
                    <div style="margin-top: 8px;">
                      <div style="margin-bottom: 6px;">
                        <strong>市町村:</strong> ${municipalityName}
                      </div>
                      <div style="margin-bottom: 6px;">
                        <strong>林班:</strong> ${rinban}
                      </div>
                      <div style="margin-bottom: 6px;">
                        <strong>小班:</strong> ${syouhan}
                      </div>
                      <div style="margin-bottom: 6px; font-size: 10px; color: #999;">
                        KEYCODE: ${keycode}
                      </div>
                      <div style="color: #999; font-size: 11px; margin-top: 10px;">
                        層データを読み込み中...
                      </div>
                    </div>
                  </div>
                `
                
                layer.bindPopup(popupContent).openPopup()
                
                // 層データを取得
                try {
                  const layersRes = await fetch(`${API_URL}/api/layers/${keycode}`)
                  if (layersRes.ok) {
                    const layersData = await layersRes.json()
                    
                    let layersHtml = ''
                    if (layersData.layers && layersData.layers.length > 0) {
                      layersHtml = '<div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">'
                      layersData.layers.forEach((layerData, idx) => {
                        const fukusou = layerData['複層区分コード'] || 'NULL'
                        
                        // 森林の種類（コード + 名前）
                        const shinrinCode = layerData['森林の種類1コード'] || 'N/A'
                        const shinrinName = layerData['森林の種類1名'] || ''
                        const shinrin = shinrinName ? `${shinrinCode} (${shinrinName})` : shinrinCode
                        
                        // 林種（コード + 名前）
                        const rinshuCode = layerData['林種コード'] || 'N/A'
                        const rinshuName = layerData['林種名'] || ''
                        const rinshu = rinshuName ? `${rinshuCode} (${rinshuName})` : rinshuCode
                        
                        // 樹種（コード + 名前）
                        const jushuCode = layerData['樹種1コード'] || 'N/A'
                        const jushuName = layerData['樹種1名'] || ''
                        const jushu = jushuName ? `${jushuCode} (${jushuName})` : jushuCode
                        
                        const rinrei = layerData['林齢'] || 'N/A'
                        const menseki = layerData['面積'] || 'N/A'
                        
                        layersHtml += `
                          <div style="
                            background: ${idx % 2 === 0 ? '#f5f5f5' : 'white'};
                            padding: 8px;
                            margin: 4px 0;
                            border-radius: 3px;
                            font-size: 11px;
                            border-left: 3px solid #8B4513;
                          ">
                            <div style="font-weight: bold; margin-bottom: 4px; color: #2c5f2d;">
                              層${idx + 1} (複層: ${fukusou})
                            </div>
                            <div style="margin-bottom: 2px;">
                              <strong>森林種類:</strong> ${shinrin}
                            </div>
                            <div style="margin-bottom: 2px;">
                              <strong>林種:</strong> ${rinshu}
                            </div>
                            <div style="margin-bottom: 2px;">
                              <strong>樹種:</strong> ${jushu}
                            </div>
                            <div style="margin-bottom: 2px;">
                              <strong>林齢:</strong> ${rinrei}年
                            </div>
                            <div>
                              <strong>面積:</strong> ${menseki}ha
                            </div>
                          </div>
                        `
                      })
                      layersHtml += '</div>'
                    } else {
                      layersHtml = '<div style="color: #999; font-size: 11px; margin-top: 10px;">層データがありません</div>'
                    }
                    
                    // ポップアップを更新
                    popupContent = `
                      <div style="font-size: 12px; min-width: 250px; max-width: 350px; max-height: 400px; overflow-y: auto;">
                        <div style="
                          background: linear-gradient(135deg, #2c5f2d 0%, #1a3a1b 100%);
                          color: white;
                          padding: 10px;
                          margin: -10px -10px 10px -10px;
                          border-radius: 4px 4px 0 0;
                        ">
                          <strong style="font-size: 14px;">🌲 小班情報</strong>
                        </div>
                        <div style="margin-top: 8px;">
                          <div style="margin-bottom: 6px;">
                            <strong>市町村:</strong> ${municipalityName}
                          </div>
                          <div style="margin-bottom: 6px;">
                            <strong>林班:</strong> ${rinban}
                          </div>
                          <div style="margin-bottom: 6px;">
                            <strong>小班:</strong> ${syouhan}
                          </div>
                          <div style="margin-bottom: 6px; font-size: 10px; color: #999;">
                            KEYCODE: ${keycode}
                          </div>
                          ${layersHtml}
                        </div>
                      </div>
                    `
                    
                    layer.setPopupContent(popupContent)
                  } else {
                    // エラー時のポップアップ更新
                    popupContent = `
                      <div style="font-size: 12px; min-width: 250px;">
                        <div style="
                          background: linear-gradient(135deg, #2c5f2d 0%, #1a3a1b 100%);
                          color: white;
                          padding: 10px;
                          margin: -10px -10px 10px -10px;
                          border-radius: 4px 4px 0 0;
                        ">
                          <strong style="font-size: 14px;">🌲 小班情報</strong>
                        </div>
                        <div style="margin-top: 8px;">
                          <div style="margin-bottom: 6px;">
                            <strong>市町村:</strong> ${municipalityName}
                          </div>
                          <div style="margin-bottom: 6px;">
                            <strong>林班:</strong> ${rinban}
                          </div>
                          <div style="margin-bottom: 6px;">
                            <strong>小班:</strong> ${syouhan}
                          </div>
                          <div style="margin-bottom: 6px; font-size: 10px; color: #999;">
                            KEYCODE: ${keycode}
                          </div>
                          <div style="color: #d32f2f; font-size: 11px; margin-top: 10px;">
                            層データの取得に失敗しました
                          </div>
                        </div>
                      </div>
                    `
                    layer.setPopupContent(popupContent)
                  }
                } catch (err) {
                  console.error('層データ取得エラー:', err)
                  // エラー時のポップアップ更新
                  popupContent = `
                    <div style="font-size: 12px; min-width: 250px;">
                      <div style="
                        background: linear-gradient(135deg, #2c5f2d 0%, #1a3a1b 100%);
                        color: white;
                        padding: 10px;
                        margin: -10px -10px 10px -10px;
                        border-radius: 4px 4px 0 0;
                      ">
                        <strong style="font-size: 14px;">🌲 小班情報</strong>
                      </div>
                      <div style="margin-top: 8px;">
                        <div style="margin-bottom: 6px;">
                          <strong>市町村:</strong> ${municipalityName}
                        </div>
                        <div style="margin-bottom: 6px;">
                          <strong>林班:</strong> ${rinban}
                        </div>
                        <div style="margin-bottom: 6px;">
                          <strong>小班:</strong> ${syouhan}
                        </div>
                        <div style="margin-bottom: 6px; font-size: 10px; color: #999;">
                          KEYCODE: ${keycode}
                        </div>
                        <div style="color: #d32f2f; font-size: 11px; margin-top: 10px;">
                          エラーが発生しました
                        </div>
                      </div>
                    </div>
                  `
                  layer.setPopupContent(popupContent)
                }
                
                // ポリゴン座標を取得（解析用に保存）
                let latLngs = layer.getLatLngs()
                while (Array.isArray(latLngs[0]) && latLngs[0].lat === undefined) {
                  latLngs = latLngs[0]
                }
                
                // グローバル変数に保存（解析機能用）
                window.currentForestPolygon = latLngs
                window.currentForestBounds = bounds
                window.currentForestRegistryId = keycode
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
          
          const pane = map.getPane('forestRegistryPane')
          console.log('小班レイヤーを地図に追加しました。z-index:', pane ? pane.style.zIndex : 'undefined')
          
          // 市町村コードリストを更新（App.jsxのドロップダウン用）
          if (window.getMunicipalityCodes) {
            const codes = window.getMunicipalityCodes()
            console.log('森林簿読み込み完了後の市町村コード:', codes)
            // カスタムイベントを発火してApp.jsxに通知
            window.dispatchEvent(new CustomEvent('municipalityCodesUpdated', { detail: codes }))
          }
        })
        .catch(err => {
          console.error('小班GeoJSON読み込みエラー:', err)
          alert('小班データの読み込みに失敗しました。バックエンドAPIが起動しているか確認してください。')
        })
    } else if (!showForestRegistry && forestRegistryLayerRef.current) {
      // 森林簿レイヤーを削除
      map.removeLayer(forestRegistryLayerRef.current)
      forestRegistryLayerRef.current = null
      window.forestRegistryLayer = null
      console.log('小班レイヤーを非表示にしました')
    }
  }, [showForestRegistry])

  // 陰影起伏図の表示/非表示
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    if (showSlope && !slopeLayerRef.current) {
      console.log('陰影起伏図レイヤーを追加します')
      
      // 国土地理院の標高タイル（陰影起伏図）
      const slopeLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/hillshademap/{z}/{x}/{y}.png', {
        attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
        opacity: slopeOpacity,
        maxZoom: 18,
        maxNativeZoom: 16, // 実際のタイルデータの最大ズーム
        minZoom: 2,
        className: 'hillshade-layer'
      })
      
      slopeLayer.on('tileload', (e) => {
        console.log('陰影起伏図タイル読み込み成功:', e.tile.src)
      })
      
      slopeLayer.on('tileerror', (e) => {
        console.warn('陰影起伏図タイルエラー:', e.tile.src)
      })
      
      slopeLayer.on('loading', () => {
        console.log('陰影起伏図レイヤー読み込み開始')
      })
      
      slopeLayer.on('load', () => {
        console.log('陰影起伏図レイヤー読み込み完了')
      })
      
      slopeLayer.addTo(map)
      slopeLayerRef.current = slopeLayer
      console.log('陰影起伏図を地図に追加しました')
    } else if (!showSlope && slopeLayerRef.current) {
      // 陰影起伏図レイヤーを削除
      map.removeLayer(slopeLayerRef.current)
      slopeLayerRef.current = null
      console.log('陰影起伏図を非表示にしました')
    } else if (showSlope && slopeLayerRef.current) {
      // 透明度のみ変更
      slopeLayerRef.current.setOpacity(slopeOpacity)
    }
  }, [showSlope, slopeOpacity])

  // 等高線の表示/非表示
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    if (showContour && !contourLayerRef.current) {
      console.log('等高線レイヤーを追加します')
      
      // OpenTopoMap（等高線入り地形図）
      const contourLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        opacity: contourOpacity,
        maxZoom: 17,
        subdomains: ['a', 'b', 'c'],
        className: 'contour-layer'
      })
      
      contourLayer.on('tileload', (e) => {
        console.log('等高線タイル読み込み成功:', e.tile.src)
      })
      
      contourLayer.on('tileerror', (e) => {
        console.warn('等高線タイルエラー:', e.tile.src)
      })
      
      contourLayer.on('loading', () => {
        console.log('等高線レイヤー読み込み開始')
      })
      
      contourLayer.on('load', () => {
        console.log('等高線レイヤー読み込み完了')
      })
      
      contourLayer.addTo(map)
      contourLayerRef.current = contourLayer
      console.log('等高線を地図に追加しました')
    } else if (!showContour && contourLayerRef.current) {
      // 等高線レイヤーを削除
      map.removeLayer(contourLayerRef.current)
      contourLayerRef.current = null
      console.log('等高線を非表示にしました')
    } else if (showContour && contourLayerRef.current) {
      // 透明度のみ変更
      contourLayerRef.current.setOpacity(contourOpacity)
    }
  }, [showContour, contourOpacity])

  // サイドバーの表示状態に応じてボタンの位置を調整
  useEffect(() => {
    const clearContainer = document.getElementById('clear-control-container')
    const undoContainer = document.getElementById('undo-control-container')
    
    if (clearContainer && undoContainer) {
      if (sidebarVisible) {
        // サイドバーが表示されている場合は少し下に配置
        clearContainer.style.marginTop = '60px'
        undoContainer.style.marginTop = '10px'
      } else {
        // サイドバーが非表示の場合は下に移動（サイドバートグルボタンの下）
        clearContainer.style.marginTop = '60px'
        undoContainer.style.marginTop = '10px' // リセットボタンからの相対位置は変わらない
      }
    }
  }, [sidebarVisible])

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
            🌲 針葉樹
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
            <span>少ない</span>
            <span>多い</span>
          </div>
          
          <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '16px', color: '#333' }}>
            🌳 広葉樹
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
            <span>少ない</span>
            <span>多い</span>
          </div>
        </div>
      )}
      
      {/* 陰影起伏図凡例表示 */}
      {showSlope && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: treePoints && treePoints.length > 0 ? '320px' : '80px', // ズームコントロールのすぐ左に配置
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '13px',
            minWidth: '180px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '16px', color: '#333' }}>
            🏔️ 陰影起伏図
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ 
                width: '30px', 
                height: '20px', 
                background: 'linear-gradient(to right, #fff, #888)', 
                marginRight: '8px',
                border: '1px solid #ccc'
              }} />
              <span style={{ fontSize: '12px' }}>地形の起伏</span>
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginLeft: '38px' }}>
              明るい: 高い地形<br/>
              暗い: 低い地形
            </div>
          </div>
          
          <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>
            出典: 国土地理院 陰影起伏図<br/>
            ※地形の立体感を表現
          </div>
        </div>
      )}
      
      {/* 等高線凡例表示 */}
      {showContour && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: (treePoints && treePoints.length > 0 ? '320px' : '80px') + (showSlope ? 220 : 0), // 陰影起伏図の左に配置
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '13px',
            minWidth: '180px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '16px', color: '#333' }}>
            📏 等高線
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ 
                width: '30px', 
                height: '20px', 
                background: 'linear-gradient(135deg, #f5deb3 0%, #8b7355 50%, #4a3728 100%)', 
                marginRight: '8px',
                border: '1px solid #ccc'
              }} />
              <span style={{ fontSize: '12px' }}>地形図</span>
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginLeft: '38px' }}>
              等高線と地形を表示<br/>
              茶色の線が等高線
            </div>
          </div>
          
          <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>
            出典: OpenTopoMap<br/>
            ※等高線入り地形図
          </div>
        </div>
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
