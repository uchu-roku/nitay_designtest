/**
 * Input Component
 * 
 * States: default | focus | error | disabled
 * Sizes: sm | base | lg
 */

import React from 'react';
import AppIcon from '../AppIcon';
import './Input.css';

export default function Input({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  size = 'base',
  fullWidth = false,
  className = '',
  ...props
}) {
  const inputClasses = [
    'input',
    `input--${size}`,
    error && 'input--error',
    icon && `input--icon-${iconPosition}`,
    fullWidth && 'input--full-width',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full-width' : ''}`}>
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <div className="input-container">
        {icon && iconPosition === 'left' && (
          <div className="input-icon input-icon--left">
            <AppIcon name={icon} size={size === 'sm' ? 'sm' : 'md'} />
          </div>
        )}
        <input
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="input-icon input-icon--right">
            <AppIcon name={icon} size={size === 'sm' ? 'sm' : 'md'} />
          </div>
        )}
      </div>
      {(error || helperText) && (
        <div className={`input-message ${error ? 'input-message--error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
}
