/**
 * Badge Component
 * 
 * Variants: default | neutral | success | warning | error | info
 * Sizes: sm | base
 */

import React from 'react';
import './Badge.css';

export default function Badge({
  children,
  variant = 'default',
  size = 'base',
  className = '',
}) {
  const classes = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
}
