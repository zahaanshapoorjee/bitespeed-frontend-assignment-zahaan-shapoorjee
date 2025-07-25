/**
 * Utility functions for the chatbot flow builder
 * 
 * These functions provide common operations and helpers
 * used throughout the application.
 */

/**
 * Generate a unique ID for nodes and edges
 * 
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateId = (prefix = 'item') => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomString}`;
};

/**
 * Calculate position for a new node to avoid overlap
 * 
 * @param {Array} existingNodes - Array of existing nodes
 * @param {Object} defaultPosition - Default position if no nodes exist
 * @returns {Object} Position object with x and y coordinates
 */
export const calculateNewNodePosition = (existingNodes, defaultPosition = { x: 100, y: 100 }) => {
  if (existingNodes.length === 0) {
    return defaultPosition;
  }

  // Find the rightmost node and place new node to its right
  const rightmostNode = existingNodes.reduce((rightmost, node) => {
    return node.position.x > rightmost.position.x ? node : rightmost;
  }, existingNodes[0]);

  return {
    x: rightmostNode.position.x + 250, // 250px spacing
    y: rightmostNode.position.y + (Math.random() - 0.5) * 100, // Small random Y offset
  };
};

/**
 * Check if a position is valid for dropping a node
 * 
 * @param {Object} position - Position to check
 * @param {Object} containerBounds - Bounds of the drop container
 * @returns {boolean} Whether the position is valid
 */
export const isValidDropPosition = (position, containerBounds) => {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x <= containerBounds.width - 200 && // Assuming min node width of 200
    position.y <= containerBounds.height - 100    // Assuming min node height of 100
  );
};

/**
 * Convert a drag event to flow coordinates
 * 
 * @param {DragEvent} event - The drag event
 * @param {Object} reactFlowBounds - React Flow container bounds
 * @param {Object} reactFlowInstance - React Flow instance for coordinate conversion
 * @returns {Object} Position in flow coordinates
 */
export const getDropPosition = (event, reactFlowBounds, reactFlowInstance) => {
  const position = reactFlowInstance.project({
    x: event.clientX - reactFlowBounds.left,
    y: event.clientY - reactFlowBounds.top,
  });
  
  return {
    x: Math.round(position.x),
    y: Math.round(position.y)
  };
};

/**
 * Format flow data for saving/export
 * 
 * @param {Array} nodes - Flow nodes
 * @param {Array} edges - Flow edges
 * @returns {Object} Formatted flow data
 */
export const formatFlowData = (nodes, edges) => {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    })),
    metadata: {
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    },
  };
};

/**
 * Parse flow data from saved/imported format
 * 
 * @param {Object} flowData - Saved flow data
 * @returns {Object} Parsed nodes and edges
 */
export const parseFlowData = (flowData) => {
  try {
    const { nodes = [], edges = [] } = flowData;
    
    return {
      nodes: nodes.map((node) => ({
        ...node,
        // Ensure all required properties exist
        position: node.position || { x: 0, y: 0 },
        data: node.data || {},
      })),
      edges: edges.map((edge) => ({
        ...edge,
        // Ensure required properties exist
        id: edge.id || generateId('edge'),
      })),
    };
  } catch (error) {
    console.error('Error parsing flow data:', error);
    return { nodes: [], edges: [] };
  }
};

/**
 * Debounce function for performance optimization
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Deep clone an object (for state management)
 * 
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};
