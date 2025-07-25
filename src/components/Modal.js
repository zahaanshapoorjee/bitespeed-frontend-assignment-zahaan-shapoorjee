import React from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  type = 'info',
  className = '',
  onConfirm,
  onCancel
}) => {
  // Handle escape key press for closing modal
  React.useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle clicking on backdrop
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Get icon based on modal type
  const getModalIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'confirm':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className={`modal-backdrop ${isOpen ? 'modal-backdrop--open' : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`modal-content modal-content--${type} ${className}`}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <span className="modal-icon" aria-hidden="true">
              {getModalIcon()}
            </span>
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>
          </div>
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {children}
        </div>

        {/* Modal Footer with Better Button Layout */}
        <div className="modal-footer">
          {type === 'confirm' ? (
            // Confirmation modal with proper button hierarchy
            <>
              <button 
                className="modal-button modal-button--cancel"
                onClick={() => {
                  if (onCancel) onCancel();
                  onClose();
                }}
                type="button"
              >
                Cancel
              </button>
              <button 
                className="modal-button modal-button--confirm"
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                type="button"
              >
                Reset All
              </button>
            </>
          ) : (
            // Regular modal with single primary button
            <button 
              className="modal-button modal-button--primary"
              onClick={onClose}
              type="button"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
