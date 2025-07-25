import React, { useState, useEffect, useRef } from 'react';
import './SettingsPanel.css';

/**
 * SettingsPanel Component
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.selectedNode - Currently selected node object
 * @param {Function} props.onNodeUpdate - Callback to update node data
 * @param {Function} props.onBack - Callback to return to nodes panel
 */
const SettingsPanel = ({ selectedNode, onNodeUpdate, onBack }) => {
  // State management for enhanced functionality
  const [text, setText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Refs for better UX
  const textareaRef = useRef(null);

  /**
   * Initialize component state when selected node changes
   * Focuses the textarea for immediate editing capability
   */
  useEffect(() => {
    if (selectedNode?.data?.text !== undefined) {
      const nodeText = selectedNode.data.text;
      setText(nodeText);
      setOriginalText(nodeText);
      setHasUnsavedChanges(false);
      
      // Auto-focus textarea for immediate editing 
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Place cursor at end of text for natural editing flow
          textareaRef.current.setSelectionRange(nodeText.length, nodeText.length);
        }
      }, 100);
    } else {
      setText('');
      setOriginalText('');
      setHasUnsavedChanges(false);
    }
  }, [selectedNode]);

  /**
   * Handle text changes
   * Updates the node data immediately for real-time preview
   * 
   * @param {Event} event - Input change event
   */
  const handleTextChange = (event) => {
    const newText = event.target.value;
    setText(newText);
    
    // Track unsaved changes for user feedback
    setHasUnsavedChanges(newText !== originalText);
    
    // Update the node data immediately for real-time preview
    if (selectedNode && onNodeUpdate) {
      onNodeUpdate(selectedNode.id, {
        ...selectedNode.data,
        text: newText,
        lastModified: new Date().toISOString()
      });
    }
  };

  /**
   * Handle keyboard shortcuts for power users
   * Escape for back
   * 
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyboardShortcuts = (event) => {
    // Escape to go back (common UX pattern)
    if (event.key === 'Escape') {
      onBack();
    }
  };

  /**
   * Handle back navigation with unsaved changes protection
   * Prevents accidental loss of user work
   */
  const handleBackWithConfirmation = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. The changes are already applied to the node but will only be permanently saved when you click "Save Changes" in the header. Continue?'
      );
      
      if (confirmLeave) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  /**
   * Get contextual node type display name
   * Provides clear labeling for different node types
   * 
   * @param {string} nodeType - The node type identifier
   * @returns {string} Human-readable display name
   */
  const getNodeTypeDisplayName = (nodeType) => {
    const typeMap = {
      textMessage: 'Message Node',
      conditional: 'Conditional Node',
      apiCall: 'API Call Node',
      userInput: 'User Input Node',
    };
    
    return typeMap[nodeType] || 'Unknown Node';
  };

  // Show empty state when no node is selected
  if (!selectedNode) {
    return (
      <div className="settings-panel">
        <div className="panel-header">
          <h3 className="panel-title">Settings Panel</h3>
          <p className="panel-description">
            Select a node to edit its properties and content
          </p>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">⚙️</div>
          <p className="empty-state-text">
            Click on any node in the flow to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-panel" onKeyDown={handleKeyboardShortcuts}>
      {/* Enhanced Header */}
      <div className="panel-header">
        <div className="header-main">
          <button 
            className="back-button"
            onClick={handleBackWithConfirmation}
            aria-label="Go back to nodes panel"
            title="Go back (or press Escape)"
          >
            <span className="back-icon">←</span>
          </button>
          <div className="title-section">
            <h3 className="panel-title">
              {getNodeTypeDisplayName(selectedNode.type)}
            </h3>
            <div className="node-id-badge">
              ID: {selectedNode.id.substring(0, 8)}...
            </div>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="save-status">
          {hasUnsavedChanges && (
            <div className="status-indicator unsaved">
              <span className="status-dot"></span>
              Click "Save Changes" to persist
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Settings Content */}
      <div className="settings-content">
        {selectedNode.type === 'textMessage' && (
          <div className="setting-section">
            <div className="setting-group">
              <label htmlFor="node-text" className="setting-label">
                Message Content
                <span className="label-hint">The text that will be sent to users</span>
              </label>
              
              <div className="text-input-wrapper">
                <textarea
                  ref={textareaRef}
                  id="node-text"
                  className="text-input enhanced"
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Enter your message here..."
                  rows={6}
                  maxLength={500}
                />
                
                {/* Character Counter with Visual Feedback */}
                <div className={`character-count ${text.length > 450 ? 'warning' : ''} ${text.length === 500 ? 'error' : ''}`}>
                  <span className="count-text">
                    {text.length}/500 characters
                  </span>
                  {text.length > 450 && (
                    <span className="count-warning">
                      {text.length > 490 ? 'Character limit almost reached' : 'Approaching character limit'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Node Metadata Section */}
        <div className="setting-section">
          <h4 className="section-title">Node Information</h4>
          <div className="node-metadata">
            <div className="metadata-item">
              <span className="metadata-label">Node Type</span>
              <span className="metadata-value type-badge">
                {getNodeTypeDisplayName(selectedNode.type)}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Node ID</span>
              <span className="metadata-value code">
                {selectedNode.id}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Position</span>
              <span className="metadata-value code">
                x: {Math.round(selectedNode.position?.x || 0)}, 
                y: {Math.round(selectedNode.position?.y || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Future Extensions Placeholder */}
        {selectedNode.type !== 'textMessage' && (
          <div className="setting-section">
            <div className="unsupported-node">
              <div className="unsupported-icon">🚧</div>
              <p className="unsupported-text">
                Advanced settings for this node type are coming soon!
              </p>
              <p className="unsupported-subtext">
                This node type is supported in the flow but additional 
                configuration options are still being developed.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
