import React, { useState } from 'react'
import AppIcon from './AppIcon'
import Button from './ui/Button'
import Badge from './ui/Badge'
import Skeleton from './ui/Skeleton'
import Tabs from './ui/Tabs'

const RightPanel = ({ 
  isOpen, 
  onClose, 
  selectedFeature,
  analysisResult,
  analysisStatus,
  onStartAnalysis,
  onRetryAnalysis
}) => {
  const [activeTab, setActiveTab] = useState('details')

  if (!isOpen) return null

  const tabs = [
    { id: 'details', label: '詳細' },
    { id: 'analysis', label: '解析結果' }
  ]

  return (
    <aside className="right-panel">
      <div className="right-panel-header">
        <h3 className="panel-title">
          {selectedFeature?.name || selectedFeature?.id || 'AOI #1'}
        </h3>
        <button className="panel-close-btn" onClick={onClose} title="閉じる">
          <AppIcon name="close" size="sm" />
        </button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="right-panel-content">
        {activeTab === 'details' && (
          <div className="details-tab">
            {!selectedFeature ? (
              <div className="panel-empty">
                <AppIcon name="info" size="lg" />
                <p>対象が選択されていません</p>
              </div>
            ) : (
              <div className="details-list">
                <div className="detail-item">
                  <span className="detail-label">林班</span>
                  <span className="detail-value">{selectedFeature.rinban || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">小班</span>
                  <span className="detail-value">{selectedFeature.shoban || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">KEYCODE</span>
                  <span className="detail-value detail-code">{selectedFeature.keycode || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">面積</span>
                  <span className="detail-value detail-numeric">{selectedFeature.area ? `${selectedFeature.area}ha` : '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">樹種</span>
                  <span className="detail-value">{selectedFeature.species || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">林齢</span>
                  <span className="detail-value detail-numeric">{selectedFeature.age ? `${selectedFeature.age}年` : '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">材積</span>
                  <span className="detail-value detail-numeric">
                    {analysisResult?.volume ? `${analysisResult.volume}m³` : '未解析'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">ステータス</span>
                  <Badge variant={
                    analysisStatus === 'completed' ? 'success' :
                    analysisStatus === 'analyzing' ? 'info' :
                    analysisStatus === 'error' ? 'error' : 'default'
                  } size="sm">
                    {analysisStatus === 'completed' ? '解析完了' :
                     analysisStatus === 'analyzing' ? '解析中' :
                     analysisStatus === 'error' ? 'エラー' : '未解析'}
                  </Badge>
                </div>
              </div>
            )}

            {selectedFeature && !analysisResult && (
              <div className="panel-actions">
                <Button 
                  variant="primary" 
                  size="base" 
                  onClick={onStartAnalysis}
                  disabled={analysisStatus === 'analyzing'}
                  icon="play"
                >
                  解析を開始
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab">
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
                <AppIcon name="alert" size="lg" />
                <h4>解析エラー</h4>
                <p>解析処理中にエラーが発生しました。</p>
                <Button variant="primary" size="base" onClick={onRetryAnalysis} icon="refresh">
                  再試行
                </Button>
              </div>
            )}

            {analysisStatus === 'completed' && analysisResult && (
              <div className="analysis-result">
                <div className="result-section">
                  <h4 className="result-section-title">解析結果</h4>
                  <div className="result-metrics">
                    <div className="metric-item">
                      <span className="metric-label">検出本数</span>
                      <span className="metric-value">{analysisResult.tree_count}本</span>
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
                      <span className="metric-value">{analysisResult.total_volume}m³</span>
                    </div>
                  </div>
                </div>

                {analysisResult.warnings && analysisResult.warnings.length > 0 && (
                  <div className="result-warnings">
                    <h4 className="warnings-title">注意事項</h4>
                    <ul className="warnings-list">
                      {analysisResult.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="panel-actions">
                  <Button variant="ghost" size="base" icon="export">
                    CSVで出力
                  </Button>
                  <Button variant="ghost" size="base" icon="refresh">
                    再解析
                  </Button>
                </div>
              </div>
            )}

            {analysisStatus === 'idle' && (
              <div className="panel-empty">
                <AppIcon name="chart" size="lg" />
                <p>解析を開始してください</p>
                <Button variant="primary" size="base" onClick={onStartAnalysis} icon="play">
                  解析を開始
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export default RightPanel
