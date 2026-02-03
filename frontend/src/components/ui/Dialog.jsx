/**
 * Dialog Component
 * 
 * Modal dialog with overlay
 * 
 * Usage:
 * <Dialog open={isOpen} onClose={handleClose}>
 *   <DialogHeader>タイトル</DialogHeader>
 *   <DialogBody>内容</DialogBody>
 *   <DialogFooter>
 *     <Button onClick={handleClose}>キャンセル</Button>
 *     <Button variant="primary">OK</Button>
 *   </DialogFooter>
 * </Dialog>
 */

import React, { useEffect } from 'react';
import AppIcon from '../AppIcon';
import './Dialog.css';

export function Dialog({ children, open, onClose, size = 'base', className = '' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className={`dialog dialog--${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, onClose }) {
  return (
    <div className="dialog-header">
      <h2 className="dialog-title">{children}</h2>
      {onClose && (
        <button
          className="dialog-close"
          onClick={onClose}
          aria-label="閉じる"
          type="button"
        >
          <AppIcon name="close" size="md" />
        </button>
      )}
    </div>
  );
}

export function DialogBody({ children }) {
  return <div className="dialog-body">{children}</div>;
}

export function DialogFooter({ children }) {
  return <div className="dialog-footer">{children}</div>;
}
