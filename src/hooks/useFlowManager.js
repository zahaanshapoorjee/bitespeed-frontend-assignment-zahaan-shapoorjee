import { useCallback } from 'react';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';

/**
 * Custom hook for managing React Flow state and operations
 * 
 * Provides centralized flow management with validation logic
 * for the chatbot flow builder requirements.
 * 
 * @param {Array} nodes - Current nodes in the flow
 * @param {Array} edges - Current edges in the flow
 * @param {Function} setNodes - Function to update nodes
 * @param {Function} setEdges - Function to update edges
 * @returns {Object} Flow management functions
 */
export const useFlowManager = (nodes, edges, setNodes, setEdges) => {
  
  /**
   * Handle node changes (position, selection, etc.)
   */
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  /**
   * Handle edge changes (creation, deletion, etc.)
   */
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  /**
   * Handle new edge connections with validation
   * 
   * Business Rule: Source handles can only have ONE outgoing connection
   */
  const onConnect = useCallback(
    (connection) => {
      // Check if source already has an outgoing connection
      const existingEdgeFromSource = edges.find(
        (edge) => edge.source === connection.source && edge.sourceHandle === connection.sourceHandle
      );

      if (existingEdgeFromSource) {
        // Remove existing edge before adding new one
        setEdges((eds) => {
          const filteredEdges = eds.filter((edge) => edge.id !== existingEdgeFromSource.id);
          return addEdge(connection, filteredEdges);
        });
      } else {
        // Add new edge normally
        setEdges((eds) => addEdge(connection, eds));
      }
    },
    [edges, setEdges]
  );

  /**
   * Update specific node data
   * 
   * @param {string} nodeId - ID of the node to update
   * @param {Object} newData - New data for the node
   */
  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: newData }
            : node
        )
      );
    },
    [setNodes]
  );

  /**
   * Add a new node to the flow
   * 
   * @param {Object} nodeData - Data for the new node
   * @param {Object} position - Position for the new node
   */
  const addNode = useCallback(
    (nodeData, position) => {
      const newNode = {
        id: `node-${Date.now()}`,
        type: nodeData.type,
        position,
        data: nodeData.defaultData,
      };
      
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  /**
   * Delete a node and its connected edges
   * 
   * @param {string} nodeId - ID of the node to delete
   */
  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => 
        edge.source !== nodeId && edge.target !== nodeId
      ));
    },
    [setNodes, setEdges]
  );

  /**
   * Validate the flow according to business rules
   * 
   * Rule: More than one node AND more than one node has empty target handles = Error
   * 
   * @returns {Object} Validation result with isValid boolean and error message
   */
  const validateFlow = useCallback(() => {
    console.log('Validating flow with nodes:', nodes.length, 'edges:', edges.length);
    
    if (nodes.length <= 1) {
      console.log('Validation passed: single node or empty flow');
      return { isValid: true, error: null };
    }

    // Find nodes that have no incoming connections (empty target handles)
    const nodesWithoutTargets = nodes.filter((node) => {
      const hasIncomingEdge = edges.some((edge) => edge.target === node.id);
      console.log(`Node ${node.id} has incoming edge:`, hasIncomingEdge);
      return !hasIncomingEdge;
    });

    console.log('Nodes without targets:', nodesWithoutTargets.length);

    if (nodesWithoutTargets.length > 1) {
      console.log('Validation failed: multiple nodes without targets');
      return {
        isValid: false,
        error: 'Your flow has disconnected nodes that need to be connected. Please make sure all nodes (except the starting node) have incoming connections before saving.',
        message: 'Your flow has disconnected nodes that need to be connected. Please make sure all nodes (except the starting node) have incoming connections before saving.'
      };
    }

    console.log('Validation passed');
    return { isValid: true, error: null };
  }, [nodes, edges]);

  return {
    onNodesChange,
    onEdgesChange,
    onConnect,
    updateNodeData,
    addNode,
    deleteNode,
    validateFlow,
  };
};
