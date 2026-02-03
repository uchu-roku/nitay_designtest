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
  slopeOpacity,
  contourOpacity,
  onToggleLayer,
  onSlopeOpacityChange,
  onContourOpacityChange,
  chatMessages = [],
  chatInput = '',
  isChatProcessing = false,
  onChatInputChange,
  onChatSubmit,
  presetImages = [],
  selectedImageId = null,
  isLoadingImage = false,
  onPresetImageSelect,
  drawMode = false,
  drawType = null,
  onDrawModeChange
}) => {
  const tabs = [
    { id: 'layers', label: 'レイヤ', icon: 'layer' },
    { id: 'upload', label: 'アップロード', icon: 'upload' },
    { id: 'chatbot', label: 'チャット', icon: 'message' },
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
                {showSlope && (
                  <div className="layer-opacity-control">
                    <label className="opacity-label">
                      <span className="opacity-text">透明度</span>
                      <span className="opacity-value">{Math.round((1 - slopeOpacity) * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(1 - slopeOpacity) * 100}
                      onChange={(e) => onSlopeOpacityChange(1 - e.target.value / 100)}
                      className="opacity-slider"
                    />
                  </div>
                )}
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
                {showContour && (
                  <div className="layer-opacity-control">
                    <label className="opacity-label">
                      <span className="opacity-text">透明度</span>
                      <span className="opacity-value">{Math.round((1 - contourOpacity) * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(1 - contourOpacity) * 100}
                      onChange={(e) => onContourOpacityChange(1 - e.target.value / 100)}
                      className="opacity-slider"
                    />
                  </div>
                )}
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
            <h3 className="panel-title">画像アップロード</h3>
            
            {/* MVP版の説明 */}
            <div className="upload-info-box">
              <div className="upload-info-title">
                <AppIcon name="info" size="sm" />
                <span>MVP版について</span>
              </div>
              <p className="upload-info-text">
                MVP版では、あらかじめ用意された画像のみ使用できます。
              </p>
            </div>
            
            {/* プリセット画像選択 */}
            <div className="preset-images-section">
              <h4 className="section-subtitle">サンプル画像</h4>
              
              {presetImages.length === 0 ? (
                <div className="preset-empty">
                  <AppIcon name="image" size="lg" />
                  <p>画像が見つかりません</p>
                </div>
              ) : (
                <div className="preset-images-list">
                  {presetImages.map((img) => (
                    <button
                      key={img.id}
                      className={`preset-image-btn ${selectedImageId === img.id ? 'selected' : ''}`}
                      onClick={() => onPresetImageSelect(img.id)}
                      disabled={isLoadingImage}
                    >
                      <div className="preset-image-icon">
                        <AppIcon name="image" size="md" />
                      </div>
                      <div className="preset-image-info">
                        <div className="preset-image-name">{img.filename}</div>
                        {selectedImageId === img.id && (
                          <div className="preset-image-status">
                            {isLoadingImage ? (
                              <>
                                <AppIcon name="loader" size="sm" />
                                <span>読み込み中...</span>
                              </>
                            ) : (
                              <>
                                <AppIcon name="check" size="sm" />
                                <span>選択中</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* 画像品質の注意事項 */}
            <div className="upload-quality-info">
              <h4 className="section-subtitle">推奨画像品質</h4>
              <ul className="quality-list">
                <li>解像度: 30cm/ピクセル以下</li>
                <li>雲量: 5%未満</li>
                <li>影: 20-30%未満</li>
                <li>季節: 落葉樹は葉有り期</li>
                <li>撮影角度: 25-30°以下</li>
              </ul>
            </div>
            
            {/* ファイルアップロード（無効化） */}
            <div className="file-upload-section">
              <h4 className="section-subtitle">ファイルアップロード</h4>
              <button 
                className="file-upload-btn disabled"
                disabled
                title="MVP版では無効です"
              >
                <AppIcon name="upload" size="sm" />
                <span>ファイルを選択（MVP版では無効）</span>
              </button>
              <p className="upload-disabled-note">
                MVP版ではファイルアップロードは無効です。上のサンプル画像をご利用ください。
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'chatbot' && (
          <div className="panel">
            <h3 className="panel-title">AI解析チャット</h3>
            <p className="panel-description">
              チャットで解析を実行できます（MVP版）
            </p>
            
            {/* テスト用文言の案内 */}
            <div className="chat-info-box">
              <div className="chat-info-title">
                <AppIcon name="info" size="sm" />
                <span>テスト用文言</span>
              </div>
              <div 
                className="chat-test-phrase"
                onClick={() => {
                  navigator.clipboard.writeText('札幌市全体の材積を解析したい。')
                  alert('クリップボードにコピーしました')
                }}
                title="クリックでコピー"
              >
                札幌市全体の材積を解析したい。
              </div>
              <p className="chat-info-text">
                上記の文言をコピーして入力してください
              </p>
            </div>
            
            {/* チャットメッセージ表示エリア */}
            <div className="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="chat-empty">
                  <AppIcon name="message" size="lg" />
                  <p>メッセージを入力してください</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`chat-message ${msg.role}`}>
                    <div className="chat-message-avatar">
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="chat-message-content">
                      <div className="chat-message-role">
                        {msg.role === 'user' ? 'あなた' : 'AI'}
                      </div>
                      <div className="chat-message-text">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* チャット入力欄 */}
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="メッセージを入力..."
                value={chatInput}
                onChange={(e) => onChatInputChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isChatProcessing) {
                    onChatSubmit()
                  }
                }}
                disabled={isChatProcessing}
              />
              <button
                className="chat-send-btn"
                onClick={onChatSubmit}
                disabled={isChatProcessing || !chatInput.trim()}
              >
                {isChatProcessing ? (
                  <AppIcon name="loader" size="sm" />
                ) : (
                  <AppIcon name="send" size="sm" />
                )}
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'tools' && (
          <div className="panel">
            <h3 className="panel-title">描画ツール</h3>
            <p className="panel-description">
              地図上に図形を描画して範囲を指定できます
            </p>
            
            <div className="tool-buttons">
              <button 
                className={`tool-button ${drawMode && drawType === 'rectangle' ? 'active' : ''}`}
                onClick={() => {
                  if (drawMode && drawType === 'rectangle') {
                    // 既に矩形モードの場合はキャンセル
                    onDrawModeChange(false, null)
                  } else {
                    // 矩形モードを有効化
                    onDrawModeChange(true, 'rectangle')
                  }
                }}
                disabled={drawMode && drawType !== 'rectangle'}
              >
                <AppIcon name="square" size="sm" />
                <span>矩形選択</span>
                {drawMode && drawType === 'rectangle' && (
                  <span className="tool-status">描画中</span>
                )}
              </button>
              
              <button 
                className={`tool-button ${drawMode && drawType === 'polygon' ? 'active' : ''}`}
                onClick={() => {
                  if (drawMode && drawType === 'polygon') {
                    // 既にポリゴンモードの場合はキャンセル
                    onDrawModeChange(false, null)
                  } else {
                    // ポリゴンモードを有効化
                    onDrawModeChange(true, 'polygon')
                  }
                }}
                disabled={drawMode && drawType !== 'polygon'}
              >
                <AppIcon name="polygon" size="sm" />
                <span>多角形選択</span>
                {drawMode && drawType === 'polygon' && (
                  <span className="tool-status">描画中</span>
                )}
              </button>
              
              <button 
                className="tool-button"
                disabled
                title="MVP版では無効です"
              >
                <AppIcon name="ruler" size="sm" />
                <span>距離測定</span>
                <span className="tool-disabled-badge">MVP版では無効</span>
              </button>
            </div>
            
            {/* 描画モード時の説明 */}
            {drawMode && (
              <div className="draw-mode-info">
                <div className="draw-mode-title">
                  <AppIcon name="info" size="sm" />
                  <span>描画方法</span>
                </div>
                {drawType === 'rectangle' ? (
                  <p className="draw-mode-text">
                    地図上でドラッグして矩形を描画してください
                  </p>
                ) : (
                  <p className="draw-mode-text">
                    地図上をクリックして頂点を追加し、ダブルクリックで完了してください
                  </p>
                )}
                <button 
                  className="draw-mode-cancel-btn"
                  onClick={() => onDrawModeChange(false, null)}
                >
                  <AppIcon name="x" size="sm" />
                  <span>キャンセル</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
