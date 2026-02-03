/**
 * Button Component
 * 
 * Variants: primary | secondary | ghost | danger
 * Sizes: sm | base | lg
 * States: default | hover | active | disabled | loading
 * 
 * Usage:
 * <Button variant="primary" size="base" onClick={handler}>
 *   Submit
 * </Button>
 */

import React from 'react';
import AppIcon from '../AppIcon';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'base',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    loading && 'btn--loading',
    className,
  ].filter(Boolean).join(' ');

  // AppIconのサイズをマッピング（baseはサポートされていないのでmdに変換）
  const getIconSize = (buttonSize) => {
    if (buttonSize === 'sm') return 'sm'
    if (buttonSize === 'lg') return 'lg'
    return 'md' // base -> md
  }

  const iconSize = getIconSize(size)

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn__spinner" aria-hidden="true">
          <AppIcon name="refresh" size={iconSize} />
        </span>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <AppIcon name={icon} size={iconSize} />
      )}
      <span className="btn__label">{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <AppIcon name={icon} size={iconSize} />
      )}
    </button>
  );
}
