/**
 * Tooltip Component
 * 
 * Simple tooltip on hover
 * 
 * Usage:
 * <Tooltip content="補足説明">
 *   <button>ホバーしてください</button>
 * </Tooltip>
 */

import React, { useState } from 'react';
import './Tooltip.css';

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
}) {
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setVisible(false);
  };

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && content && (
        <div className={`tooltip tooltip--${position}`} role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
}
