import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import TextMessageNode from './components/nodes/TextMessageNode';
import NodesPanel from './components/panels/NodesPanel';
import SettingsPanel from './components/panels/SettingsPanel';
import Modal from './components/Modal';

// Hooks and utilities
import { useFlowManager } from './hooks/useFlowManager';
import { NODE_CONFIGS } from './constants/nodeTypes';
import { generateId } from './utils/flowUtils'; 
import FlowStorageManager from './utils/storageManager';

import './App.css';

/**
 * Custom node types registry for React Flow
 * Extensible mapping of node type strings to their corresponding React components
 */
const nodeTypes = {
  textMessage: TextMessageNode,
  // Future node types can be added here:
  // conditional: ConditionalNode,
  // apiCall: ApiCallNode,
  // userInput: UserInputNode,
};

/**
 * Enhanced Flow Builder Component
 * 
 * The core application component that orchestrates the entire chatbot flow builder experience.
 * Implements modern React patterns, comprehensive error handling, and intuitive user interactions.
 * 
 * Key Features:
 * - Persistent storage with automatic save/load functionality
 * - Professional drag & drop interface with visual feedback
 * - Real-time flow validation with clear error messaging
 * - Inline node editing with double-click activation
 * - Responsive design optimized for various screen sizes
 * - Comprehensive accessibility support
 * - Modal-based success/error notifications
 * 
 * Architecture Decisions:
 * - Separation of concerns with custom hooks for flow management
 * - Centralized state management for optimal performance
 * - Utility-based architecture for code reusability
 * - Component composition for maintainability
 * 
 * @component
 */
function FlowBuilder() {
  // ========================================================================================
  // STATE MANAGEMENT
  // ========================================================================================
  
  // Core flow data state
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // UI state management
  const [selectedNode, setSelectedNode] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Modal state for user feedback
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });
  
  // Loading states for better UX
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ========================================================================================
  // REFS AND REACT FLOW INTEGRATION
  // ========================================================================================
  
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useReactFlow();

  // ========================================================================================
  // CUSTOM HOOKS FOR FLOW MANAGEMENT
  // ========================================================================================
  
  // Comprehensive flow management with validation and connection rules
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    updateNodeData,
    validateFlow,
  } = useFlowManager(nodes, edges, setNodes, setEdges);

  // ========================================================================================
  // INITIALIZATION AND DATA LOADING
  // ========================================================================================
  
  /**
   * Initialize application with saved flow data
   * Loads previously saved flow from localStorage on component mount
   */
  useEffect(() => {
    const initializeFlow = async () => {
      try {
        setIsLoading(true);
        
        // Attempt to load existing flow data
        const loadResult = FlowStorageManager.getCurrentFlow();
        
        if (loadResult.success && loadResult.data) {
          // Successfully loaded existing flow
          setNodes(loadResult.data.nodes || []);
          setEdges(loadResult.data.edges || []);
          
          // Show success message if loaded from backup
          if (loadResult.warning) {
            showModal('warning', 'Flow Restored', 
              'Your flow was restored from backup. The original data may have been corrupted.');
          }
        } else if (loadResult.error && loadResult.code !== 'NO_SAVED_FLOW') {
          console.error('Failed to load flow:', loadResult.error);
          showModal('error', 'Loading Error', 
            `Failed to load your saved flow: ${loadResult.error}`);
        }
        
        // Initialize React Flow after loading data
        setTimeout(() => {
          if (reactFlowInstance) {
            reactFlowInstance.fitView();
          }
        }, 100);
        
      } catch (error) {
        console.error('Error during initialization:', error);
        showModal('error', 'Initialization Error', 
          'Failed to initialize the application. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeFlow();
  }, [reactFlowInstance]);

  // ========================================================================================
  // MODAL MANAGEMENT
  // ========================================================================================
  
  /**
   * Show modal with specified configuration
   * Centralized modal management for consistent user feedback
   * 
   * @param {string} type - Modal type ('success', 'error', 'warning', 'info', 'confirm')
   * @param {string} title - Modal title
   * @param {string} message - Modal message content
   * @param {Object} options - Additional options for confirm modals
   */
  const showModal = useCallback((type, title, message, options = {}) => {
    console.log('showModal called:', { type, title, message, options });
    setModalState({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel
    });
  }, []);

  /**
   * Close modal and reset state
   */
  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      type: 'info',
      title: '',
      message: ''
    });
  }, []);

  // ========================================================================================
  // NODE INTERACTION HANDLERS
  // ========================================================================================
  
  /**
   * Handle node selection with enhanced UX
   * Provides visual feedback and updates settings panel
   * 
   * @param {Event} event - Click event
   * @param {Object} node - Selected node object
   */
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setShowSettings(true);
    setSaveError(null); // Clear any existing save errors
    
    // Add visual feedback class (can be used for animations)
    event.target.classList.add('node-clicked');
    setTimeout(() => {
      event.target.classList.remove('node-clicked');
    }, 200);
  }, []);

  /**
   * Handle canvas clicks (deselect nodes)
   * Provides clean interaction model for node deselection
   */
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowSettings(false);
    setSaveError(null);
  }, []);

  // ========================================================================================
  // NODE CREATION AND MANAGEMENT
  // ========================================================================================
  
  /**
   * Create a new node with proper configuration
   * Generates nodes with unique IDs and proper positioning
   * 
   * @param {string} nodeType - Type of node to create
   * @param {Object} position - Position coordinates {x, y}
   * @returns {Object|null} New node object or null if invalid
   */
  const createNewNode = useCallback((nodeType, position) => {
    if (!NODE_CONFIGS[nodeType]) {
      console.error('Invalid node type:', nodeType);
      return null;
    }

    const nodeConfig = NODE_CONFIGS[nodeType];
    const nodeId = generateId('node');

    const newNode = {
      id: nodeId,
      type: nodeType,
      position: {
        x: Math.round(position.x),
        y: Math.round(position.y)
      },
      data: {
        ...nodeConfig.defaultData,
        id: nodeId,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      },
      draggable: true,
      selectable: true,
      // Add source and target handles
      sourcePosition: 'right',
      targetPosition: 'left'
    };

    console.log('Created new node:', newNode);
    return newNode;
  }, []);

  /**
   * Add a new node to the flow
   * Updates the nodes state and provides user feedback
   * 
   * @param {Object} newNode - Node object to add
   */
  const addNode = useCallback((newNode) => {
    if (!newNode) {
      console.error('Cannot add null node');
      return;
    }

    setNodes((prevNodes) => {
      const updatedNodes = [...prevNodes, newNode];
      return updatedNodes;
    });

    // Clear any existing save errors when adding nodes
    setSaveError(null);
  }, []);

  // ========================================================================================
  // DRAG AND DROP FUNCTIONALITY
  // ========================================================================================
  
  /**
   * Handle drag over events for proper drop zone behavior
   * Essential for HTML5 drag and drop API
   */
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback class for drag over state
    if (reactFlowWrapper.current) {
      reactFlowWrapper.current.classList.add('drag-over');
    }
  }, []);

  /**
   * Handle drop events with enhanced mobile support
   * Creates new nodes from dragged items with proper positioning
   * 
   * @param {DragEvent} event - Drop event containing node type data
   */
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      // Remove visual feedback
      if (reactFlowWrapper.current) {
        reactFlowWrapper.current.classList.remove('drag-over');
      }

      // Get the dragged node type
      const nodeType = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeType || !reactFlowInstance) {
        console.warn('Invalid drop: missing node type or React Flow instance');
        return;
      }

      // Calculate position with mobile viewport consideration
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      
      // Handle both mouse and touch events
      let clientX, clientY;
      if (event.touches && event.touches.length > 0) {
        // Touch event
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if (event.changedTouches && event.changedTouches.length > 0) {
        // Touch end event
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      } else {
        // Mouse event
        clientX = event.clientX;
        clientY = event.clientY;
      }

      const position = reactFlowInstance.project({
        x: clientX - reactFlowBounds.left,
        y: clientY - reactFlowBounds.top,
      });

      const newNode = createNewNode(nodeType, position);
      
      if (newNode) {
        console.log('Adding new node:', newNode);
        addNode(newNode);
      }
    },
    [reactFlowInstance, createNewNode, addNode] 
  );

  /**
   * Handle drag leave events
   * Removes visual feedback when drag leaves the drop zone
   */
  const onDragLeave = useCallback((event) => {
    // Only remove feedback if leaving the main container
    if (!event.currentTarget.contains(event.relatedTarget)) {
      if (reactFlowWrapper.current) {
        reactFlowWrapper.current.classList.remove('drag-over');
      }
    }
  }, []);

  // ========================================================================================
  // SAVE FUNCTIONALITY
  // ========================================================================================
  
  /**
   * Manual save with comprehensive validation and user feedback
   * Provides detailed error messages and success confirmation
   */
  const handleSave = useCallback(async () => {
    try {
      console.log('handleSave called');
      setIsSaving(true);
      setSaveError(null);

      // Validate flow before saving
      const validation = validateFlow();
      if (!validation.isValid) {
        console.log('Manual save validation failed, showing modal');
        // Show the actual validation error message
        showModal('error', 'Cannot Save Flow', validation.error);
        return { success: false, message: validation.error };
      }

      const flowData = {
        nodes,
        edges,
        metadata: {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          nodeCount: nodes.length,
          edgeCount: edges.length,
        }
      };
      
      const result = await FlowStorageManager.saveCurrentFlow(flowData);
      
      if (result.success) {
        showModal('success', 'Flow Saved Successfully', 'Your chatbot flow has been saved successfully! You can continue editing or come back later to make changes.');
        return { success: true };
      } else {
        const errorMessage = result.error || 'Failed to save flow';
        showModal('error', 'Save Failed', errorMessage);
        console.error('Save failed:', errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred while saving';
      console.error('Save error:', error);
      showModal('error', 'Save Error', errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsSaving(false);
    }
  }, [validateFlow, nodes, edges, showModal]);

  // ========================================================================================
  // RESET FUNCTIONALITY
  // ========================================================================================
  
  /**
   * Reset all nodes and edges with confirmation
   * Provides a clean slate for users to start over
   */
  const handleResetAll = useCallback(() => {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    
    if (nodeCount === 0 && edgeCount === 0) {
      showModal('info', 'Nothing to Reset', 'Your flow is already empty. There are no nodes or connections to remove.');
      return;
    }
    
    const confirmMessage = `Are you sure you want to remove all ${nodeCount} node${nodeCount !== 1 ? 's' : ''} and ${edgeCount} connection${edgeCount !== 1 ? 's' : ''}? This action cannot be undone.`;
    
    showModal('confirm', 'Reset All Nodes', confirmMessage, {
      onConfirm: () => {
        // Clear all nodes and edges
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setShowSettings(false);
        setSaveError(null);
        
        // Show success message
        showModal('success', 'Flow Reset Complete', 'All nodes and connections have been removed. You can now start building your flow from scratch.');
        
        console.log('Flow reset: cleared all nodes and edges');
      },
      onCancel: () => {
        console.log('Reset cancelled by user');
      }
    });
  }, [nodes, edges, showModal]);

  // ========================================================================================
  // TEXT EDITING FUNCTIONALITY
  // ========================================================================================
  
  /**
   * Global function for inline text editing
   * Attached to window object for access from TextMessageNode components
   */
  useEffect(() => {
    window.updateNodeText = (nodeId, newText) => {
      updateNodeData(nodeId, { 
        text: newText,
        lastModified: new Date().toISOString()
      });
    };

    // Cleanup on unmount
    return () => {
      delete window.updateNodeText;
    };
  }, [updateNodeData]);

  /**
   * Set up mobile touch drop event handler
   * Listens for custom mobile drop events from the NodesPanel
   */
  useEffect(() => {
    const handleMobileDrop = (event) => {
      console.log('Mobile drop event received:', event.detail);
      
      const { nodeType, clientX, clientY } = event.detail;
      
      if (!nodeType || !reactFlowInstance) {
        console.warn('Invalid mobile drop: missing node type or React Flow instance');
        return;
      }

      // Calculate position relative to the flow canvas
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: clientX - reactFlowBounds.left,
        y: clientY - reactFlowBounds.top,
      });

      console.log('Creating node at position:', position);
      
      const newNode = createNewNode(nodeType, position);
      
      if (newNode) {
        console.log('Adding new node from mobile touch:', newNode);
        addNode(newNode);
      }
    };

    // Add event listener to the flow canvas
    const canvas = reactFlowWrapper.current;
    if (canvas) {
      canvas.addEventListener('mobileDrop', handleMobileDrop);
      
      return () => {
        canvas.removeEventListener('mobileDrop', handleMobileDrop);
      };
    }
  }, [reactFlowInstance, createNewNode, addNode]);

  // ========================================================================================
  // SETTINGS PANEL HANDLERS
  // ========================================================================================
  
  /**
   * Handle returning to nodes panel from settings
   * Maintains clean navigation state
   */
  const handleBackToNodes = useCallback(() => {
    setShowSettings(false);
    setSelectedNode(null);
  }, []);

  /**
   * Handle node updates from settings panel
   * Provides seamless integration between settings and flow state
   * 
   * @param {string} nodeId - ID of node to update
   * @param {Object} newData - Updated node data
   */
  const handleNodeUpdate = useCallback((nodeId, newData) => {
    updateNodeData(nodeId, {
      ...newData,
      lastModified: new Date().toISOString()
    });
  }, [updateNodeData]);

  // ========================================================================================
  // RENDER LOADING STATE
  // ========================================================================================
  
  if (isLoading) {
    return (
      <div className="flow-builder">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your chatbot flow...</p>
        </div>
      </div>
    );
  }

  // ========================================================================================
  // MAIN COMPONENT RENDER
  // ========================================================================================
  
  return (
    <div className="flow-builder">
      {/* Enhanced Header with Status Indicators */}
      <header className="flow-header">
        <div className="header-left">
          <h1 className="flow-title">
           Chatbot Flow Builder by Zahaan Shapoorjee for BiteSpeed
          </h1>
          <div className="flow-stats">
            <span className="stat-item">
              <span className="stat-label">Nodes:</span>
              <span className="stat-value">{nodes.length}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Connections:</span>
              <span className="stat-value">{edges.length}</span>
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          {/* Error Display */}
          {saveError && (
            <div className="save-error">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{saveError}</span>
            </div>
          )}
          
          {/* Reset All Button */}
          <button 
            className="reset-button"
            onClick={handleResetAll}
            type="button"
            aria-label="Reset all nodes and connections"
            title="Remove all nodes and connections"
          >
            <span className="reset-icon">🗑️</span>
            Reset All
          </button>
          
          {/* Save Button with Loading State */}
          <button 
            className={`save-button ${isSaving ? 'saving' : ''}`}
            onClick={() => handleSave()}
            disabled={isSaving}
            type="button"
            aria-label={isSaving ? 'Saving flow...' : 'Save flow'}
          >
            {isSaving ? (
              <>
                <span className="button-spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <span className="save-icon">💾</span>
                Save Changes
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flow-content">
        {/* React Flow Canvas with Enhanced Configuration */}
        <div className="flow-canvas" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            minZoom={0.5}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            snapToGrid={true}
            snapGrid={[15, 15]}
            connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
            defaultEdgeOptions={{ 
              style: { stroke: '#6b7280', strokeWidth: 2 },
              type: 'smoothstep' 
            }}
            // Enable touch interactions for mobile
            panOnDrag={true}
            selectionOnDrag={false}
            panOnScroll={false}
            zoomOnScroll={true}
            zoomOnPinch={true}
            panOnScrollSpeed={0.5}
            zoomOnDoubleClick={false}
            // Mobile-specific settings
            deleteKeyCode={null} // Disable delete key on mobile
            multiSelectionKeyCode={null} // Disable multi-selection on mobile
          >
            {/* Enhanced Background */}
            <Background 
              color="#cbd5e1" 
              gap={20} 
              size={1}
              variant="dots"
            />
            
            {/* Controls with Custom Styling */}
            <Controls 
              showInteractive={false}
              style={{
                button: {
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  color: '#374151'
                }
              }}
            />
            
            {/* Mini Map with Custom Styling */}
            <MiniMap 
              nodeStrokeColor="#374151"
              nodeColor="#10b981"
              nodeBorderRadius={8}
              maskColor="rgba(0, 0, 0, 0.1)"
              style={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0'
              }}
            />
          </ReactFlow>
        </div>

        {/* Dynamic Side Panel */}
        <div className="side-panel">
          {showSettings ? (
            <SettingsPanel
              selectedNode={selectedNode}
              onNodeUpdate={updateNodeData}
              onBack={() => setSelectedNode(null)}
            />
          ) : (
            <NodesPanel />
          )}
        </div>
      </div>

      {/* Success/Error Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      >
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          {modalState.message}
        </p>
      </Modal>
    </div>
  );
}

/**
 * Main App Component with React Flow Provider
 * 
 * Wraps the FlowBuilder component with necessary providers for React Flow functionality.
 * This separation allows for clean provider management and potential future provider additions.
 * 
 * @component
 */
function App() {
  return (
    <ReactFlowProvider>
      <FlowBuilder />
    </ReactFlowProvider>
  );
}

export default App;
