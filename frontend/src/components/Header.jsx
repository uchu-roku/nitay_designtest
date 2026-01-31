import React from 'react'
import AppIcon from './AppIcon'
import Button from './ui/Button'
import Input from './ui/Input'

const Header = ({ searchQuery, onSearchChange, onSearchSubmit }) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">森林分析プラットフォーム</h1>
      </div>
      
      <div className="header-center">
        <div className="global-search">
          <Input
            type="text"
            placeholder="林班・小班コードで検索（例: 123-4）"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit()
            }}
            icon="search"
            iconPosition="left"
            size="base"
          />
          <Button 
            onClick={onSearchSubmit} 
            variant="primary" 
            size="base"
          >
            検索
          </Button>
        </div>
      </div>
      
      <div className="header-right">
        <button className="icon-button" title="設定">
          <AppIcon name="settings" size="md" />
        </button>
        <button className="icon-button" title="ユーザー">
          <AppIcon name="user" size="md" />
        </button>
      </div>
    </header>
  )
}

export default Header
