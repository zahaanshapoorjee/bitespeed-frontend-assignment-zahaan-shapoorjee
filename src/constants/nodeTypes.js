/**
 * Node type constants for the chatbot flow builder
 * This file centralizes all node type definitions for easy maintenance and extensibility
 */

// Available node types in the flow builder
export const NODE_TYPES = {
  TEXT_MESSAGE: 'textMessage',
  // Future node types can be added here
  // CONDITIONAL: 'conditional',
  // API_CALL: 'apiCall',
  // USER_INPUT: 'userInput',
};

// Node configuration for the nodes panel
export const NODE_CONFIGS = {
  textMessage: {
    type: 'textMessage',
    label: 'Send Message',
    description: 'Send a text message to the user',
    icon: '💬',
    defaultData: {
      text: '', // Change from "Enter your message here..." to empty string
      lastModified: new Date().toISOString()
    }
  }
};

// Default node styling
export const DEFAULT_NODE_STYLE = {
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '12px',
  fontFamily: 'Arial, sans-serif',
  minWidth: '150px',
  minHeight: '40px',
};
