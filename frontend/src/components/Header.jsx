import { useState, useRef, useEffect } from 'react'
import AppIcon from './AppIcon'
import Button from './ui/Button'
import Input from './ui/Input'

const Header = ({ 
  searchQuery, 
  onSearchChange, 
  onSearchSubmit,
  selectedMunicipality,
  onMunicipalityChange,
  municipalityNames,
  theme,
  onToggleTheme
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const settingsRef = useRef(null)

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 市町村の選択/解除
  const handleMunicipalityToggle = (code) => {
    const newSelection = selectedMunicipality.includes(code)
      ? selectedMunicipality.filter(c => c !== code)
      : [...selectedMunicipality, code]
    onMunicipalityChange(newSelection)
  }

  // 全選択/全解除
  const handleSelectAll = () => {
    if (selectedMunicipality.length === Object.keys(municipalityNames || {}).length) {
      onMunicipalityChange([])
    } else {
      onMunicipalityChange(Object.keys(municipalityNames || {}))
    }
  }

  const displayText = selectedMunicipality.length === 0 
    ? '全市町村' 
    : selectedMunicipality.length === 1
    ? municipalityNames[selectedMunicipality[0]]
    : `${selectedMunicipality.length}件選択中`

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">Nitay</h1>
      </div>
      
      <div className="header-center">
        <div className="global-search">
          {/* 市町村選択ドロップダウン（複数選択） */}
          <div ref={dropdownRef} className="municipality-dropdown">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="municipality-dropdown-button"
            >
              <span>{displayText}</span>
              <span className={`municipality-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
                ▼
              </span>
            </button>
            
            {isDropdownOpen && (
              <div className="municipality-dropdown-menu">
                {/* 全選択/全解除ボタン */}
                <label className="municipality-dropdown-header">
                  <input
                    type="checkbox"
                    checked={selectedMunicipality.length === Object.keys(municipalityNames || {}).length}
                    onChange={handleSelectAll}
                    className="municipality-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="municipality-label">全選択/全解除</span>
                </label>
                
                {/* 市町村リスト */}
                {Object.entries(municipalityNames || {}).map(([code, name]) => (
                  <label key={code} className="municipality-dropdown-item">
                    <input
                      type="checkbox"
                      checked={selectedMunicipality.includes(code)}
                      onChange={() => handleMunicipalityToggle(code)}
                      className="municipality-checkbox"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="municipality-label">{name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <Input
            type="text"
            placeholder="林班・小班コードで検索（例: 0001-0001、複数指定: 0001-0001, 0002-0001）"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit()
            }}
            icon="search"
            iconPosition="left"
            size="md"
          />
          <Button 
            onClick={onSearchSubmit} 
            variant="primary" 
            size="md"
          >
            検索
          </Button>
        </div>
      </div>
      
      <div className="header-right">
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <button 
            className="icon-button" 
            title="設定"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <AppIcon name="settings" size="md" />
          </button>
          
          {isSettingsOpen && (
            <div className="settings-dropdown">
              <div className="settings-dropdown-header">設定</div>
              <button 
                className="settings-dropdown-item"
                onClick={() => {
                  onToggleTheme()
                  setIsSettingsOpen(false)
                }}
              >
                <AppIcon name={theme === 'light' ? 'moon' : 'sun'} size="sm" />
                <span>{theme === 'light' ? 'ダークモード' : 'ライトモード'}</span>
              </button>
            </div>
          )}
        </div>
        <button className="icon-button" title="ユーザー">
          <AppIcon name="user" size="md" />
        </button>
      </div>
    </header>
  )
}

export default Header
