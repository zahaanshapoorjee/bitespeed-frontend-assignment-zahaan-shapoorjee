/**
 * Local Storage Manager for Chatbot Flow Builder
 * 
 * Provides persistent storage functionality for saving and loading chatbot flows.
 * Uses browser's localStorage API with proper error handling and data validation.
 * 
 * Features:
 * - Automatic serialization/deserialization of flow data
 * - Error handling for storage quota and parsing issues
 * - Data validation to ensure flow integrity
 * - Versioning support for future migrations
 * - Backup and restore capabilities
 * 
 * Industry Best Practices:
 * - Comprehensive error handling with fallback strategies
 * - Data validation to prevent corruption
 * - Clear API with descriptive method names
 * - Extensive documentation for maintainability
 * - Performance optimized with minimal overhead
 */

// Storage keys for different data types
const STORAGE_KEYS = {
  CURRENT_FLOW: 'chatbot_flow_current',
  SAVED_FLOWS: 'chatbot_flow_saved_list',
  USER_PREFERENCES: 'chatbot_flow_preferences',
  BACKUP_FLOW: 'chatbot_flow_backup'
};

// Current storage version for migration support
const STORAGE_VERSION = '1.0.0';

// In-memory fallback storage for when localStorage is not available
let memoryStorage = {};

/**
 * Utility function to check if localStorage is available and accessible
 * @returns {boolean} True if localStorage is available
 */
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Wrapper for storage operations with fallback to memory storage
 */
const storageWrapper = {
  setItem: (key, value) => {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
    } else {
      memoryStorage[key] = value;
    }
  },
  
  getItem: (key) => {
    if (isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    } else {
      return memoryStorage[key] || null;
    }
  },
  
  removeItem: (key) => {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    } else {
      delete memoryStorage[key];
    }
  }
};

/**
 * FlowStorageManager Class
 * 
 * Centralized manager for all flow storage operations.
 * Handles localStorage interactions with proper error handling.
 */
class FlowStorageManager {
  /**
   * Save current flow to localStorage
   * 
   * Automatically creates a backup before saving new data to prevent data loss.
   * Includes metadata for better flow management and debugging.
   * 
   * @param {Object} flowData - Complete flow data object
   * @param {Array} flowData.nodes - Array of node objects
   * @param {Array} flowData.edges - Array of edge objects
   * @param {Object} flowData.metadata - Additional flow metadata
   * @returns {Object} Result object with success status and any error message
   */
  static saveCurrentFlow(flowData) {
    try {
      // Create backup of existing flow before overwriting
      const existingFlow = this.getCurrentFlow();
      if (existingFlow.success && existingFlow.data) {
        this.createBackup(existingFlow.data);
      }

      // Prepare enhanced flow data with metadata
      const enhancedFlowData = {
        ...flowData,
        metadata: {
          ...flowData.metadata,
          version: STORAGE_VERSION,
          savedAt: new Date().toISOString(),
          nodeCount: flowData.nodes?.length || 0,
          edgeCount: flowData.edges?.length || 0,
          lastModified: new Date().toISOString()
        }
      };

      // Validate flow data before saving
      const validation = this.validateFlowData(enhancedFlowData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Flow validation failed: ${validation.error}`,
          code: 'VALIDATION_ERROR'
        };
      }

      // Check if localStorage is available
      if (!isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'Local storage is not available in your browser. Changes will be lost when you close the tab.',
          code: 'STORAGE_NOT_SUPPORTED'
        };
      }

      // Serialize and save using storage wrapper
      const serializedData = JSON.stringify(enhancedFlowData);
      storageWrapper.setItem(STORAGE_KEYS.CURRENT_FLOW, serializedData);

      // Verify the save operation
      const verificationData = storageWrapper.getItem(STORAGE_KEYS.CURRENT_FLOW);
      if (!verificationData) {
        throw new Error('Failed to verify saved data');
      }

      return {
        success: true,
        data: enhancedFlowData,
        message: 'Flow saved successfully'
      };

    } catch (error) {
      console.error('Error saving flow:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Determine error type for better user feedback
      let errorCode = 'UNKNOWN_ERROR';
      let userMessage = 'Failed to save flow due to an unknown error';

      if (error.name === 'QuotaExceededError') {
        errorCode = 'STORAGE_QUOTA_EXCEEDED';
        userMessage = 'Storage quota exceeded. Please clear some data and try again.';
      } else if (error.message.includes('JSON')) {
        errorCode = 'SERIALIZATION_ERROR';
        userMessage = 'Failed to prepare flow data for saving';
      } else if (error.message.includes('localStorage') || error.name === 'SecurityError') {
        errorCode = 'STORAGE_ACCESS_ERROR';
        userMessage = 'Cannot access storage. This may be due to private browsing mode or browser security settings.';
      }

      return {
        success: false,
        error: userMessage,
        code: errorCode,
        details: error.message,
        originalError: error
      };
    }
  }

  /**
   * Load current flow from localStorage
   * 
   * Retrieves and validates stored flow data with comprehensive error handling.
   * Returns a consistent result object for easy error handling in UI components.
   * 
   * @returns {Object} Result object with flow data or error information
   */
  static getCurrentFlow() {
    try {
      const storedData = storageWrapper.getItem(STORAGE_KEYS.CURRENT_FLOW);
      
      // Handle case where no flow exists
      if (!storedData) {
        return {
          success: true,
          data: null,
          message: 'No saved flow found'
        };
      }

      // Parse stored JSON data
      const flowData = JSON.parse(storedData);

      // Validate loaded data
      const validation = this.validateFlowData(flowData);
      if (!validation.isValid) {
        console.warn('Loaded flow data is invalid:', validation.error);
        
        // Attempt to load backup if primary data is corrupted
        const backupResult = this.loadBackup();
        if (backupResult.success) {
          return {
            success: true,
            data: backupResult.data,
            message: 'Loaded from backup due to corrupted primary data',
            warning: 'Primary flow data was corrupted'
          };
        }

        return {
          success: false,
          error: `Invalid flow data: ${validation.error}`,
          code: 'INVALID_DATA'
        };
      }

      return {
        success: true,
        data: flowData,
        message: 'Flow loaded successfully'
      };

    } catch (error) {
      console.error('Error loading flow:', error);

      // Handle specific error types
      if (error instanceof SyntaxError) {
        return {
          success: false,
          error: 'Saved flow data is corrupted and cannot be loaded',
          code: 'PARSE_ERROR',
          details: error.message
        };
      }

      return {
        success: false,
        error: 'Failed to load flow due to an unknown error',
        code: 'UNKNOWN_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Create a backup of flow data
   * 
   * Maintains a single backup copy for recovery purposes.
   * Automatically overwrites previous backup to manage storage usage.
   * 
   * @param {Object} flowData - Flow data to backup
   * @returns {boolean} Success status
   */
  static createBackup(flowData) {
    try {
      const backupData = {
        ...flowData,
        backupCreatedAt: new Date().toISOString(),
        isBackup: true
      };

      storageWrapper.setItem(STORAGE_KEYS.BACKUP_FLOW, JSON.stringify(backupData));
      return true;
    } catch (error) {
      console.warn('Failed to create backup:', error);
      return false;
    }
  }

  /**
   * Load backup flow data
   * 
   * Retrieves backup data for recovery scenarios.
   * Used when primary flow data is corrupted or unavailable.
   * 
   * @returns {Object} Result object with backup data or error
   */
  static loadBackup() {
    try {
      const backupData = storageWrapper.getItem(STORAGE_KEYS.BACKUP_FLOW);
      
      if (!backupData) {
        return {
          success: false,
          error: 'No backup available',
          code: 'NO_BACKUP'
        };
      }

      const parsedBackup = JSON.parse(backupData);
      
      return {
        success: true,
        data: parsedBackup,
        message: 'Backup loaded successfully'
      };

    } catch (error) {
      console.error('Error loading backup:', error);
      return {
        success: false,
        error: 'Failed to load backup data',
        code: 'BACKUP_ERROR',
        details: error.message
      };
    }
  }

  /**
   * Clear all stored flow data
   * 
   * Removes all flow-related data from localStorage.
   * Useful for reset functionality and clearing corrupted data.
   * 
   * @returns {boolean} Success status
   */
  static clearAllData() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        storageWrapper.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  /**
   * Validate flow data structure
   * 
   * Ensures flow data meets expected format and contains required fields.
   * Prevents saving/loading of corrupted or incomplete data.
   * 
   * @private
   * @param {Object} flowData - Flow data to validate
   * @returns {Object} Validation result with success status and error details
   */
  static validateFlowData(flowData) {
    try {
      // Check if flowData exists and is an object
      if (!flowData || typeof flowData !== 'object') {
        return {
          isValid: false,
          error: 'Flow data must be a valid object'
        };
      }

      // Validate nodes array
      if (!Array.isArray(flowData.nodes)) {
        return {
          isValid: false,
          error: 'Nodes must be an array'
        };
      }

      // Validate edges array
      if (!Array.isArray(flowData.edges)) {
        return {
          isValid: false,
          error: 'Edges must be an array'
        };
      }

      // Validate individual nodes
      for (let i = 0; i < flowData.nodes.length; i++) {
        const node = flowData.nodes[i];
        if (!node.id || !node.type || !node.position) {
          return {
            isValid: false,
            error: `Node at index ${i} is missing required fields (id, type, position)`
          };
        }

        if (typeof node.position !== 'object' || 
            typeof node.position.x !== 'number' || 
            typeof node.position.y !== 'number') {
          return {
            isValid: false,
            error: `Node at index ${i} has invalid position data`
          };
        }
      }

      // Validate individual edges
      for (let i = 0; i < flowData.edges.length; i++) {
        const edge = flowData.edges[i];
        if (!edge.id || !edge.source || !edge.target) {
          return {
            isValid: false,
            error: `Edge at index ${i} is missing required fields (id, source, target)`
          };
        }
      }

      return {
        isValid: true,
        error: null
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Get storage usage statistics
   * 
   * Provides information about current storage usage for debugging
   * and user information purposes.
   * 
   * @returns {Object} Storage statistics
   */
  static getStorageStats() {
    try {
      const stats = {
        totalKeys: 0,
        totalSize: 0,
        flowData: {},
        lastError: null
      };

      Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
        const data = storageWrapper.getItem(key);
        if (data) {
          stats.totalKeys++;
          stats.totalSize += data.length;
          stats.flowData[name] = {
            size: data.length,
            lastModified: (() => {
              try {
                const parsed = JSON.parse(data);
                return parsed.metadata?.lastModified || 'Unknown';
              } catch {
                return 'Unknown';
              }
            })()
          };
        }
      });

      return stats;
    } catch (error) {
      return {
        totalKeys: 0,
        totalSize: 0,
        flowData: {},
        lastError: error.message
      };
    }
  }
}

// Export individual methods for easier importing
export const {
  saveCurrentFlow,
  getCurrentFlow,
  createBackup,
  loadBackup,
  clearAllData,
  getStorageStats
} = FlowStorageManager;

// Export the full class as default
export default FlowStorageManager;
