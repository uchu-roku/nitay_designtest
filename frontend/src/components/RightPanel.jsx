import React from 'react'
import AppIcon from './AppIcon'
import Skeleton from './ui/Skeleton'

const RightPanel = ({ 
  isOpen, 
  onClose, 
  analysisResult,
  analysisStatus,
  tableHeight = 300
}) => {
  if (!isOpen) return null

  return (
    <aside className="right-panel" style={{ bottom: `${tableHeight}px` }}>
      <div className="right-panel-header">
        <div className="panel-title-wrapper">
          <AppIcon name="chart" size="base" />
          <h3 className="panel-title">解析結果</h3>
        </div>
        <button className="panel-close-btn" onClick={onClose} title="閉じる">
          <AppIcon name="close" size="sm" />
        </button>
      </div>

      <div className="right-panel-content">
        {analysisStatus === 'analyzing' && (
          <div className="analysis-loading">
            <Skeleton width="100%" height="20px" />
            <Skeleton width="100%" height="20px" />
            <Skeleton width="80%" height="20px" />
            <p className="loading-text">解析中...</p>
          </div>
        )}

        {analysisStatus === 'error' && (
          <div className="analysis-error">
            <AppIcon name="error" size="lg" />
            <h4>解析エラー</h4>
            <p>解析処理中にエラーが発生しました。</p>
          </div>
        )}

        {analysisStatus === 'completed' && analysisResult && (
          <div className="analysis-result">
            <div className="result-section">
              <div className="result-metrics">
                <div className="metric-item">
                  <span className="metric-label">検出本数</span>
                  <span className="metric-value">{analysisResult.tree_count || 0}本</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">針葉樹</span>
                  <span className="metric-value">{analysisResult.coniferous_count || 0}本</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">広葉樹</span>
                  <span className="metric-value">{analysisResult.broadleaf_count || 0}本</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">総材積</span>
                  <span className="metric-value">{analysisResult.volume_m3 || 0}m³</span>
                </div>
              </div>
            </div>

            {analysisResult.warnings && analysisResult.warnings.length > 0 && (
              <div className="result-warnings">
                <div className="warnings-header">
                  <AppIcon name="alert" size="base" />
                  <h4 className="warnings-title">注意事項</h4>
                </div>
                <ul className="warnings-list">
                  {analysisResult.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {analysisStatus === 'idle' && (
          <div className="panel-empty">
            <AppIcon name="chart" size="lg" />
            <p>属性テーブルから小班を選択して<br/>解析ボタンをクリックしてください</p>
          </div>
        )}
      </div>
    </aside>
  )
}

export default RightPanel
