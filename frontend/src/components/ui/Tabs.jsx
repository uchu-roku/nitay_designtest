/**
 * Tabs Component
 * 
 * Usage:
 * <Tabs value={activeTab} onChange={setActiveTab}>
 *   <Tab value="search">検索</Tab>
 *   <Tab value="layers">レイヤ</Tab>
 *   <Tab value="reports">帳票</Tab>
 * </Tabs>
 */

import React from 'react';
import './Tabs.css';

export function Tabs({ children, value, onChange, className = '' }) {
  return (
    <div className={`tabs ${className}`} role="tablist">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          isActive: child.props.value === value,
          onClick: () => onChange(child.props.value),
        })
      )}
    </div>
  );
}

export function Tab({ value, children, isActive, onClick, disabled = false }) {
  return (
    <button
      className={`tab ${isActive ? 'tab--active' : ''}`}
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}
