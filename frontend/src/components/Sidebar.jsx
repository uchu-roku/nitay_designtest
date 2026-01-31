import React from 'react'
import AppIcon from './AppIcon'

const Sidebar = ({ 
  activeTab, 
  onTabChange,
  showAdminBoundaries,
  showForestRegistry,
  showRivers,
  showSlope,
  showContour,
  onToggleLayer
}) => {
  const tabs = [
    { id: 'layers', label: 'レイヤ', icon: 'layer' },
    { id: 'upload', label: 'アップロード', icon: 'upload' },
    { id: 'tools', label: 'ツール', icon: 'settings' },
  ]

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <AppIcon name={tab.icon} size="sm" className="nav-icon" />
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="sidebar-content">
        {activeTab === 'layers' && (
          <div className="panel">
            <h3 className="panel-title">地図レイヤ</h3>
            
            <div className="layer-group">
              <div className="layer-group-header">
                <span className="layer-group-title">ベースレイヤ</span>
              </div>
              
              <div className="layer-item">
                <div className="layer-controls">
                  <button 
                    className={`visibility-btn ${showAdminBoundaries ? 'visible' : 'hidden'}`}
                    onClick={() => onToggleLayer('admin')}
                    title={showAdminBoundaries ? '表示中' : '非表示'}
                  >
                    <AppIcon name={showAdminBoundaries ? 'eye' : 'eyeOff'} size="sm" />
                  </button>
                  <span className="layer-name">行政界</span>
                </div>
                <div className="layer-actions">
                  <button className="layer-menu-btn" title="設定">
                    <AppIcon name="settings" size="sm" />
                  </button>
                </div>
              </div>
              
              <div className="layer-item">
                <div className="layer-controls">
                  <button 
                    className={`visibility-btn ${showRivers ? 'visible' : 'hidden'}`}
                    onClick={() => onToggleLayer('rivers')}
                    title={showRivers ? '表示中' : '非表示'}
                  >
                    <AppIcon name={showRivers ? 'eye' : 'eyeOff'} size="sm" />
                  </button>
                  <span className="layer-name">河川</span>
                </div>
                <div className="layer-actions">
                  <button className="layer-menu-btn" title="設定">
                    <AppIcon name="settings" size="sm" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="layer-group">
              <div className="layer-group-header">
                <span className="layer-group-title">森林情報</span>
              </div>
              
              <div className="layer-item">
                <div className="layer-controls">
                  <button 
                    className={`visibility-btn ${showForestRegistry ? 'visible' : 'hidden'}`}
                    onClick={() => onToggleLayer('forest')}
                    title={showForestRegistry ? '表示中' : '非表示'}
                  >
                    <AppIcon name={showForestRegistry ? 'eye' : 'eyeOff'} size="sm" />
                  </button>
                  <span className="layer-name">森林簿</span>
                </div>
                <div className="layer-actions">
                  <button className="layer-menu-btn" title="設定">
                    <AppIcon name="settings" size="sm" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="layer-group">
              <div className="layer-group-header">
                <span className="layer-group-title">地形情報</span>
              </div>
              
              <div className="layer-item">
                <div className="layer-controls">
                  <button 
                    className={`visibility-btn ${showSlope ? 'visible' : 'hidden'}`}
                    onClick={() => onToggleLayer('slope')}
                    title={showSlope ? '表示中' : '非表示'}
                  >
                    <AppIcon name={showSlope ? 'eye' : 'eyeOff'} size="sm" />
                  </button>
                  <span className="layer-name">傾斜図</span>
                </div>
                <div className="layer-actions">
                  <button className="layer-menu-btn" title="設定">
                    <AppIcon name="settings" size="sm" />
                  </button>
                </div>
              </div>
              
              <div className="layer-item">
                <div className="layer-controls">
                  <button 
                    className={`visibility-btn ${showContour ? 'visible' : 'hidden'}`}
                    onClick={() => onToggleLayer('contour')}
                    title={showContour ? '表示中' : '非表示'}
                  >
                    <AppIcon name={showContour ? 'eye' : 'eyeOff'} size="sm" />
                  </button>
                  <span className="layer-name">等高線</span>
                </div>
                <div className="layer-actions">
                  <button className="layer-menu-btn" title="設定">
                    <AppIcon name="settings" size="sm" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="legend">
              <h4 className="legend-title">凡例</h4>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-color" style={{background: '#16a34a'}}></span>
                  <span className="legend-text">針葉樹</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{background: '#d97706'}}></span>
                  <span className="legend-text">広葉樹</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'upload' && (
          <div className="panel">
            <h3 className="panel-title">ファイルアップロード</h3>
            <p className="panel-description">
              画像ファイルをアップロードして解析します
            </p>
            <input type="file" className="file-input" accept="image/*" />
          </div>
        )}
        
        {activeTab === 'tools' && (
          <div className="panel">
            <h3 className="panel-title">描画ツール</h3>
            <button className="tool-button">矩形選択</button>
            <button className="tool-button">多角形選択</button>
            <button className="tool-button">距離測定</button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
