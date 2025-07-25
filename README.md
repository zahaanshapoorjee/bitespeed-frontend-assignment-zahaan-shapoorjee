# Chatbot Flow Builder

A React-based visual flow builder for creating chatbot conversation flows with drag-and-drop functionality.

**[View Live Application](https://bitespeed-frontend-zahaan-shapoorjee.netlify.app/)**

## Features

- Drag & drop text message nodes onto canvas
- Connect nodes to create conversation flows
- Inline text editing (click to edit)
- Real-time flow validation
- Mobile touch support

## Usage

1. Drag "Text Message" nodes from left panel to canvas
2. Click nodes to edit text inline
3. Connect nodes by dragging from output handle to another node
4. Save button validates flow (nodes need exactly one outgoing connection)

## Tech Stack

- React 18 + React Flow
- CSS3 with custom styling
- localStorage for persistence

## Project Structure

```
src/
├── components/
│   ├── nodes/TextMessageNode.js
│   └── panels/NodesPanel.js, SettingsPanel.js
├── constants/nodeTypes.js
├── hooks/useFlowValidation.js
└── App.js
```

## Mobile Support

Touch drag & drop implemented with custom event handling for mobile devices.

## Adding New Node Types

1. Create component in `components/nodes/`
2. Add to `constants/nodeTypes.js`
3. Register in `App.js` nodeTypes object

## Known Issues

- Mobile Safari may need double-tap for text editing
- No undo/redo yet

Built for the BiteSpeed