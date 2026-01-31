import React from 'react'

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
    { id: 'layers', label: 'レイヤ', icon: '🗺️' },
    { id: 'upload', label: 'アップロード', icon: '📁' },
    { id: 'tools', label: 'ツール', icon: '🔧' },
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
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="sidebar-content">
        {activeTab === 'layers' && (
          <div className="panel">
            <h3 className="panel-title">地図レイヤ</h3>
            
            <div className="layer-group">
              <div className="layer-item">
                <label className="layer-label">
                  <span>行政界</span>
                  <input
                    type="checkbox"
                    className="layer-checkbox"
                    checked={showAdminBoundaries}
                    onChange={() => onToggleLayer('admin')}
                  />
                  <span className="toggle"></span>
                </label>
              </div>
              
              <div className="layer-item">
                <label className="layer-label">
                  <span>森林簿</span>
                  <input
                    type="checkbox"
                    className="layer-checkbox"
                    checked={showForestRegistry}
                    onChange={() => onToggleLayer('forest')}
                  />
                  <span className="toggle"></span>
                </label>
              </div>
              
              <div className="layer-item">
                <label className="layer-label">
                  <span>河川</span>
                  <input
                    type="checkbox"
                    className="layer-checkbox"
                    checked={showRivers}
                    onChange={() => onToggleLayer('rivers')}
                  />
                  <span className="toggle"></span>
                </label>
              </div>
              
              <div className="layer-item">
                <label className="layer-label">
                  <span>傾斜</span>
                  <input
                    type="checkbox"
                    className="layer-checkbox"
                    checked={showSlope}
                    onChange={() => onToggleLayer('slope')}
                  />
                  <span className="toggle"></span>
                </label>
              </div>
              
              <div className="layer-item">
                <label className="layer-label">
                  <span>等高線</span>
                  <input
                    type="checkbox"
                    className="layer-checkbox"
                    checked={showContour}
                    onChange={() => onToggleLayer('contour')}
                  />
                  <span className="toggle"></span>
                </label>
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
