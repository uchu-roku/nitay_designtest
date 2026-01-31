import React from 'react'

const Header = ({ searchQuery, onSearchChange, onSearchSubmit }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">森林分析プラットフォーム</h1>
      </div>
      
      <div className="header-center">
        <div className="global-search">
          <input
            type="text"
            placeholder="林班・小班コードで検索（例: 123-4）"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit()
            }}
            className="search-input"
          />
          <button onClick={onSearchSubmit} className="search-button">
            検索
          </button>
        </div>
      </div>
      
      <div className="header-right">
        <button className="icon-button" title="通知">
          <span>🔔</span>
        </button>
        <button className="icon-button" title="設定">
          <span>⚙️</span>
        </button>
        <div className="user-avatar">
          <span>👤</span>
        </div>
      </div>
    </header>
  )
}

export default Header
