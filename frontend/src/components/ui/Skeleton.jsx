/**
 * Skeleton Component
 * 
 * Loading state placeholder
 */

import React from 'react';
import './Skeleton.css';

export default function Skeleton({
  width,
  height,
  circle = false,
  className = '',
  count = 1,
}) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton ${circle ? 'skeleton--circle' : ''} ${className}`}
      style={{
        width: circle ? height || width : width,
        height,
      }}
    />
  ));

  return count > 1 ? <div className="skeleton-group">{skeletons}</div> : skeletons[0];
}
