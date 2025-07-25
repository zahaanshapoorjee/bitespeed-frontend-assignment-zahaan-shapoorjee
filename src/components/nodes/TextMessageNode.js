import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import './TextMessageNode.css';

/**
 * TextMessageNode Component
 * 
 * Enhanced text message node with intuitive inline editing capabilities.
 * Provides a smooth, professional user experience for chatbot flow creation.
 * 
 * Key Features:
 * - Inline text editing with double-click activation
 * - Auto-save functionality on blur/enter
 * - Visual feedback for different states (normal, selected, editing)
 * - Smart text truncation with full preview on hover
 * - Professional design with smooth animations
 * - Single source handle (enforces one outgoing connection)
 * - Multiple target connections supported
 * 
 * UX Improvements:
 * - Double-click to edit makes editing discoverable yet non-intrusive
 * - Escape key cancels editing (standard UX pattern)
 * - Enter key saves and exits edit mode
 * - Visual state indicators help users understand current mode
 * - Smooth transitions between states feel premium
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.data - Node data containing text and metadata
 * @param {boolean} props.selected - Whether node is currently selected
 * @param {string} props.id - Unique node identifier
 */
const TextMessageNode = ({ data, selected, id }) => {
  // Local state for inline editing functionality
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.text || '');
  const [isHovered, setIsHovered] = useState(false);

  /**
   * Handle double-click to enter edit mode
   * Double-click is intuitive for users familiar with desktop applications
   */
  const handleDoubleClick = (event) => {
    // Prevent event bubbling to avoid triggering parent handlers
    event.stopPropagation();
    setIsEditing(true);
    setEditText(data.text || '');
  };

  /**
   * Handle saving changes and exiting edit mode
   * Triggers when user presses Enter or clicks outside
   */
  const handleSave = () => {
    setIsEditing(false);
    
    // Update node data through React Flow's update mechanism
    // This will be handled by the parent component's update function
    if (window.updateNodeText && editText.trim() !== data.text) {
      window.updateNodeText(id, editText.trim());
    }
  };

  /**
   * Handle canceling edit mode without saving
   * Activated by Escape key for standard UX behavior
   */
  const handleCancel = () => {
    setIsEditing(false);
    setEditText(data.text || ''); // Reset to original text
  };

  /**
   * Handle keyboard events during editing
   * Supports Enter to save and Escape to cancel
   */
  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'Enter':
        // Shift+Enter allows multi-line text, plain Enter saves
        if (!event.shiftKey) {
          event.preventDefault();
          handleSave();
        }
        break;
      case 'Escape':
        event.preventDefault();
        handleCancel();
        break;
      default:
        // Allow normal typing
        break;
    }
  };

  /**
   * Smart text truncation with different lengths based on context
   * Shows more text when hovered to provide better preview
   */
  const getDisplayText = () => {
    const text = data.text || '';
    
    // If no text, show placeholder
    if (!text.trim()) {
      return 'Double-click to edit message...';
    }
    
    const maxLength = isHovered ? 100 : 60;
    
    if (text.length <= maxLength) {
      return text;
    }
    
    return `${text.substring(0, maxLength)}...`;
  };

  /**
   * Get placeholder text that guides user interaction
   */
  const getPlaceholderText = () => {
    return data.text ? data.text : 'Double-click to edit message...';
  };

  /**
   * Calculate dynamic node classes for styling
   */
  const getNodeClasses = () => {
    const classes = ['text-message-node'];
    
    if (selected) classes.push('selected');
    if (isEditing) classes.push('editing');
    if (isHovered) classes.push('hovered');
    if (!data.text || data.text.trim() === '') classes.push('empty');
    
    return classes.join(' ');
  };

  return (
    <div 
      className={getNodeClasses()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Target Handle - Allows multiple incoming connections - Made larger and more prominent */}
      <Handle
        type="target"
        position={Position.Left}
        className="node-handle target-handle"
        isConnectable={true}
        style={{ 
          background: '#10b981',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '3px solid #fff',
          left: '-10px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}
      />
      
      {/* Node Header with improved visual hierarchy */}
      <div className="node-header">
        <span className="node-icon" role="img" aria-label="Message icon">
          💬
        </span>
        <span className="node-title">Send Message</span>
        {isEditing && (
          <span className="edit-indicator" title="Editing mode active">
            ✏️
          </span>
        )}
      </div>
      
      {/* Node Content with conditional rendering for edit/display modes */}
      <div className="node-content">
        {isEditing ? (
          /* Edit Mode: Inline textarea for comfortable editing */
          <textarea
            className="message-editor"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Enter your message here..."
            autoFocus
            rows={3}
            maxLength={500}
          />
        ) : (
          /* Display Mode: Shows message with edit hint */
          <div 
            className="message-preview"
            onDoubleClick={handleDoubleClick}
            title={isHovered ? "Double-click to edit" : getPlaceholderText()}
          >
            <div className="message-text">
              {getDisplayText()}
            </div>
            {!data.text && (
              <div className="edit-hint">
                Double-click to edit
              </div>
            )}
          </div>
        )}
        
        {/* Character count indicator during editing */}
        {isEditing && (
          <div className="character-count">
            {editText.length}/500
          </div>
        )}
      </div>
      
      {/* Source Handle - Enforces single outgoing connection - Made larger and more prominent */}
      <Handle
        type="source"
        position={Position.Right}
        className="node-handle source-handle"
        isConnectable={true}
        style={{ 
          background: '#3b82f6',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '3px solid #fff',
          right: '-10px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}
      />
      
      {/* Hover tooltip for better UX guidance */}
      {isHovered && !isEditing && (
        <div className="node-tooltip">
          Double-click to edit message
        </div>
      )}
    </div>
  );
};

export default TextMessageNode;
