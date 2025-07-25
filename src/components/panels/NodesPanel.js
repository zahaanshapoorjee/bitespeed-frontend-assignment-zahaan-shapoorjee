import React, { useState } from 'react';
import { NODE_CONFIGS } from '../../constants/nodeTypes';
import './NodesPanel.css';

/**
 * NodesPanel Component with Enhanced Mobile Support
 * 
 * Displays available node types that can be dragged onto the flow canvas.
 * Supports both mouse and touch interactions for mobile devices.
 */
const NodesPanel = () => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [touchStartPos, setTouchStartPos] = useState(null);

  /**
   * Handle drag start for mouse events
   */
  const onDragStart = (event, nodeType) => {
    console.log('Mouse drag start:', nodeType);
    setDraggedItem(nodeType);
    
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    }
  };

  /**
   * Handle drag end
   */
  const onDragEnd = () => {
    setDraggedItem(null);
  };

  /**
   * Handle touch start for mobile devices
   */
  const onTouchStart = (event, nodeType) => {
    console.log('Touch start:', nodeType);
    
    const touch = event.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedItem(nodeType);
    
    // Store data globally for mobile drag and drop
    window.mobileDragData = {
      nodeType: nodeType,
      startTime: Date.now(),
      startX: touch.clientX,
      startY: touch.clientY
    };

    // Don't prevent default - let normal scrolling work
  };

  /**
   * Handle touch move - removed preventDefault to avoid passive listener errors
   */
  const onTouchMove = (event) => {
    if (!draggedItem || !touchStartPos) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);

    // Only add visual feedback if we've moved enough
    if (deltaX > 10 || deltaY > 10) {
      const flowCanvas = document.querySelector('.flow-canvas');
      if (flowCanvas) {
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        if (flowCanvas.contains(elementUnderTouch) || flowCanvas === elementUnderTouch) {
          flowCanvas.classList.add('drag-over');
        } else {
          flowCanvas.classList.remove('drag-over');
        }
      }
    }
  };

  /**
   * Handle touch end for mobile drop
   */
  const onTouchEnd = (event) => {
    console.log('Touch end - checking for drop');
    
    // Clean up drag visual feedback
    const flowCanvas = document.querySelector('.flow-canvas');
    if (flowCanvas) {
      flowCanvas.classList.remove('drag-over');
    }

    if (!window.mobileDragData || !draggedItem) {
      console.log('No mobile drag data or dragged item');
      setDraggedItem(null);
      setTouchStartPos(null);
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch) {
      console.log('No touch data in changedTouches');
      setDraggedItem(null);
      setTouchStartPos(null);
      delete window.mobileDragData;
      return;
    }

    console.log('Touch end at:', touch.clientX, touch.clientY);

    // Find the element under the touch point
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    console.log('Element under touch:', elementUnderTouch);
    
    // Check if we're dropping on the flow canvas or its children
    if (flowCanvas && (flowCanvas.contains(elementUnderTouch) || flowCanvas === elementUnderTouch)) {
      console.log('Dropping on flow canvas - creating drop event');
      
      // Create a custom event for mobile drop
      const dropEvent = new CustomEvent('mobileDrop', {
        detail: {
          nodeType: window.mobileDragData.nodeType,
          clientX: touch.clientX,
          clientY: touch.clientY
        }
      });
      
      flowCanvas.dispatchEvent(dropEvent);
    } else {
      console.log('Not dropping on flow canvas');
    }

    // Clean up
    delete window.mobileDragData;
    setDraggedItem(null);
    setTouchStartPos(null);
  };

  return (
    <div className="nodes-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <h3>Node Types</h3>
        <p className="panel-description">
          Drag and drop these nodes onto the canvas to build your chatbot flow
        </p>
      </div>

      {/* Available Node Types */}
      <div className="nodes-list">
        {Object.values(NODE_CONFIGS).map((nodeConfig) => (
          <div
            key={nodeConfig.type}
            className={`node-item ${draggedItem === nodeConfig.type ? 'dragging' : ''}`}
            draggable
            onDragStart={(event) => onDragStart(event, nodeConfig.type)}
            onDragEnd={onDragEnd}
            // Mobile touch events
            onTouchStart={(event) => onTouchStart(event, nodeConfig.type)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            // Accessibility
            role="button"
            tabIndex={0}
            aria-label={`Drag ${nodeConfig.label} to canvas`}
          >
            <div className="node-item-icon">
              {nodeConfig.icon}
            </div>
            <div className="node-item-content">
              <div className="node-item-label">
                {nodeConfig.label}
              </div>
              <div className="node-item-description">
                {nodeConfig.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Future Nodes Hint */}
      <div className="future-nodes-hint">
        <p className="hint-text">
          More node types coming soon! 🚀
        </p>
      </div>
    </div>
  );
};

export default NodesPanel;
