import { useState, useEffect } from 'react'

/**
 * 森林簿の複数選択コントロール
 * 選択された小班の情報表示と解析を行うUIコンポーネント
 */
const ForestSelectionControl = () => {
  const [selectedCount, setSelectedCount] = useState(0)

  // 選択数を監視
  useEffect(() => {
    const updateCount = () => {
      if (window.highlightedLayersMap) {
        setSelectedCount(window.highlightedLayersMap.size)
      }
    }

    // 定期的に選択数を更新
    const interval = setInterval(updateCount, 300)
    return () => clearInterval(interval)
  }, [])

  // 選択がない場合は表示しない
  if (selectedCount === 0) {
    return null
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.98)',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 1000,
        minWidth: '220px',
        border: '2px solid #FF4500'
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          marginBottom: '12px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#2c5f2d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>🌲 選択中の小班</span>
        <span
          style={{
            background: '#FF4500',
            color: 'white',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          {selectedCount}件
        </span>
      </div>

      {/* 選択情報を表示ボタン */}
      <button
        onClick={() => window.showSelectedForestInfo && window.showSelectedForestInfo()}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #2c5f2d 0%, #1a3a1b 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        📋 選択情報を表示
      </button>

      {/* 選択した小班を解析ボタン */}
      <button
        onClick={() => window.analyzeSelectedForests && window.analyzeSelectedForests()}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #FF4500 0%, #DC3545 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        🔍 選択した小班を解析
      </button>

      {/* 選択をクリアボタン */}
      <button
        onClick={() => window.clearForestSelection && window.clearForestSelection()}
        style={{
          width: '100%',
          padding: '8px',
          background: 'white',
          color: '#666',
          border: '1px solid #ddd',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.target.style.background = '#f5f5f5'
          e.target.style.borderColor = '#999'
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'white'
          e.target.style.borderColor = '#ddd'
        }}
      >
        ✕ 選択をクリア
      </button>
    </div>
  )
}

export default ForestSelectionControl
