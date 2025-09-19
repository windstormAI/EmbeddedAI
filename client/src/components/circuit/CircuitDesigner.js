/**
 * Circuit Designer Component
 * Advanced 2D circuit design interface with enhanced features
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Zap,
  Cpu,
  Lightbulb,
  Volume2,
  Thermometer,
  Eye,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Square,
  Circle,
  Minus,
  Save,
  Download,
  Upload,
  Undo,
  Redo,
  Grid,
  Layers,
  Settings,
  Play,
  Pause,
  RotateCw,
  Copy,
  Trash2,
  Link,
  Unlink,
  X
} from 'lucide-react';

const CircuitDesigner = ({ project, onCircuitChange, onCodeGenerate }) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedTool, setSelectedTool] = useState('select');
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [clipboard, setClipboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Circuit state
  const [components, setComponents] = useState(project?.circuitData?.components || []);
  const [connections, setConnections] = useState(project?.circuitData?.connections || []);
  const [selectedComponent, setSelectedComponent] = useState(null);

  // Grid and snapping
  const GRID_SIZE = 20;
  const SNAP_THRESHOLD = 10;

  // Snap to grid function
  const snapToGridFunction = useCallback((x, y) => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE
    };
  }, [snapToGrid]);

  // Save state to history
  const saveToHistory = useCallback((newComponents, newConnections) => {
    const state = { components: newComponents, connections: newConnections };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo/Redo functions
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setComponents(prevState.components);
      setConnections(prevState.connections);
      setHistoryIndex(historyIndex - 1);
      onCircuitChange(prevState);
    }
  }, [history, historyIndex, onCircuitChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setComponents(nextState.components);
      setConnections(nextState.connections);
      setHistoryIndex(historyIndex + 1);
      onCircuitChange(nextState);
    }
  }, [history, historyIndex, onCircuitChange]);

  // Initialize history
  useEffect(() => {
    if (components.length > 0 || connections.length > 0) {
      saveToHistory(components, connections);
    }
  }, []); // Only on mount

  // Available components with enhanced properties
  const componentLibrary = [
    {
      id: 'arduino-uno',
      name: 'Arduino Uno',
      icon: Cpu,
      category: 'board',
      pins: 14,
      color: '#00979C',
      size: { width: 120, height: 80 }
    },
    {
      id: 'esp32',
      name: 'ESP32',
      icon: Cpu,
      category: 'board',
      pins: 38,
      color: '#E7352C',
      size: { width: 100, height: 60 }
    },
    {
      id: 'led',
      name: 'LED',
      icon: Lightbulb,
      category: 'output',
      pins: 2,
      color: '#FFD700',
      size: { width: 40, height: 40 }
    },
    {
      id: 'push-button',
      name: 'Push Button',
      icon: Square,
      category: 'input',
      pins: 2,
      color: '#4A90E2',
      size: { width: 50, height: 50 }
    },
    {
      id: 'potentiometer',
      name: 'Potentiometer',
      icon: Circle,
      category: 'input',
      pins: 3,
      color: '#7ED321',
      size: { width: 60, height: 40 }
    },
    {
      id: 'buzzer',
      name: 'Buzzer',
      icon: Volume2,
      category: 'output',
      pins: 2,
      color: '#F5A623',
      size: { width: 45, height: 45 }
    },
    {
      id: 'temperature-sensor',
      name: 'Temp Sensor',
      icon: Thermometer,
      category: 'input',
      pins: 3,
      color: '#D0021B',
      size: { width: 55, height: 35 }
    },
    {
      id: 'photoresistor',
      name: 'Photoresistor',
      icon: Eye,
      category: 'input',
      pins: 2,
      color: '#BD10E0',
      size: { width: 50, height: 30 }
    }
  ];

  // Handle component drag start
  const handleDragStart = (e, component) => {
    setDraggedComponent(component);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle drop on canvas
  const handleDrop = useCallback((e) => {
    e.preventDefault();

    if (!draggedComponent) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    const snapped = snapToGridFunction(x, y);

    const newComponent = {
      id: `${draggedComponent.id}_${Date.now()}`,
      type: draggedComponent.id,
      name: draggedComponent.name,
      x: snapped.x,
      y: snapped.y,
      rotation: 0,
      properties: {},
      color: draggedComponent.color,
      size: draggedComponent.size,
      pins: draggedComponent.pins
    };

    const updatedComponents = [...components, newComponent];
    setComponents(updatedComponents);
    saveToHistory(updatedComponents, connections);

    // Notify parent of changes
    onCircuitChange({
      components: updatedComponents,
      connections
    });

    setDraggedComponent(null);
  }, [draggedComponent, components, connections, panOffset, zoom, snapToGrid, saveToHistory, onCircuitChange]);

  // Handle component selection
  const handleComponentClick = (componentId, e) => {
    e.stopPropagation();

    if (selectedTool === 'select') {
      if (e.ctrlKey || e.metaKey) {
        // Multi-select
        setSelectedComponents(prev =>
          prev.includes(componentId)
            ? prev.filter(id => id !== componentId)
            : [...prev, componentId]
        );
      } else {
        // Single select
        setSelectedComponents([componentId]);
        setSelectedComponent(componentId);
      }
    } else if (selectedTool === 'connect') {
      handleConnectionClick(componentId);
    }
  };

  // Handle connections
  const handleConnectionClick = (componentId) => {
    if (!isConnecting) {
      setIsConnecting(true);
      setConnectionStart(componentId);
    } else {
      if (connectionStart !== componentId) {
        createConnection(connectionStart, componentId);
      }
      setIsConnecting(false);
      setConnectionStart(null);
    }
  };

  const createConnection = (fromId, toId) => {
    const newConnection = {
      id: `conn_${Date.now()}`,
      from: { componentId: fromId, pin: 'out' },
      to: { componentId: toId, pin: 'in' },
      type: 'wire',
      color: '#000000'
    };

    const updatedConnections = [...connections, newConnection];
    setConnections(updatedConnections);
    saveToHistory(components, updatedConnections);

    onCircuitChange({
      components,
      connections: updatedConnections
    });
  };

  // Handle canvas pan
  const handleMouseDown = (e) => {
    if (selectedTool === 'pan' || e.altKey) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && (selectedTool === 'pan' || e.altKey)) {
      setPanOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev * 0.8, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Component management
  const handleDeleteComponent = () => {
    const updatedComponents = components.filter(comp => !selectedComponents.includes(comp.id));
    const updatedConnections = connections.filter(conn =>
      !selectedComponents.includes(conn.from.componentId) &&
      !selectedComponents.includes(conn.to.componentId)
    );

    setComponents(updatedComponents);
    setConnections(updatedConnections);
    setSelectedComponents([]);
    setSelectedComponent(null);
    saveToHistory(updatedComponents, updatedConnections);

    onCircuitChange({
      components: updatedComponents,
      connections: updatedConnections
    });
  };

  const handleCopyComponents = () => {
    const componentsToCopy = components.filter(comp => selectedComponents.includes(comp.id));
    setClipboard(componentsToCopy);
  };

  const handlePasteComponents = () => {
    if (clipboard.length === 0) return;

    const pastedComponents = clipboard.map(comp => ({
      ...comp,
      id: `${comp.id}_copy_${Date.now()}`,
      x: comp.x + 50,
      y: comp.y + 50
    }));

    const updatedComponents = [...components, ...pastedComponents];
    setComponents(updatedComponents);
    saveToHistory(updatedComponents, connections);

    onCircuitChange({
      components: updatedComponents,
      connections
    });
  };

  // Generate code from circuit
  const handleGenerateCode = () => {
    if (onCodeGenerate && components.length > 0) {
      const circuitDescription = generateCircuitDescription();
      onCodeGenerate(circuitDescription);
    }
  };

  const generateCircuitDescription = () => {
    const board = components.find(comp => comp.type.includes('arduino') || comp.type.includes('esp'));
    const sensors = components.filter(comp => comp.type.includes('sensor'));
    const actuators = components.filter(comp => comp.type.includes('led') || comp.type.includes('buzzer'));

    let description = `Create Arduino code for a circuit with:`;

    if (board) {
      description += `\n- ${board.name} as the microcontroller`;
    }

    if (sensors.length > 0) {
      description += `\n- Sensors: ${sensors.map(s => s.name).join(', ')}`;
    }

    if (actuators.length > 0) {
      description += `\n- Actuators: ${actuators.map(a => a.name).join(', ')}`;
    }

    if (connections.length > 0) {
      description += `\n- ${connections.length} connections between components`;
    }

    description += `\n\nPlease generate complete Arduino code with proper setup, loop, and pin configurations.`;

    return description;
  };

  // Export circuit as JSON
  const handleExportCircuit = () => {
    const circuitData = {
      components,
      connections,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        projectName: project?.name || 'Untitled Circuit'
      }
    };

    const blob = new Blob([JSON.stringify(circuitData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name || 'circuit'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import circuit from JSON
  const handleImportCircuit = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const circuitData = JSON.parse(e.target.result);
          if (circuitData.components && circuitData.connections) {
            setComponents(circuitData.components);
            setConnections(circuitData.connections);
            saveToHistory(circuitData.components, circuitData.connections);

            onCircuitChange({
              components: circuitData.components,
              connections: circuitData.connections
            });
          }
        } catch (error) {
          console.error('Failed to import circuit:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Circuit Designer</h3>

            {/* Tool Selection */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedTool('select')}
                className={`p-2 rounded ${selectedTool === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="Select Tool"
              >
                <Move className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedTool('pan')}
                className={`p-2 rounded ${selectedTool === 'pan' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="Pan Tool"
              >
                <Move className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedTool('connect')}
                className={`p-2 rounded ${selectedTool === 'connect' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="Connect Tool"
              >
                <Link className="h-4 w-4" />
              </button>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded ${showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="Toggle Grid"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`p-2 rounded ${snapToGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="Toggle Snap to Grid"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded" title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded" title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </button>
              <button onClick={handleResetView} className="p-2 hover:bg-gray-100 rounded" title="Reset View">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* History Controls */}
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>

            {/* Actions */}
            {selectedComponents.length > 0 && (
              <>
                <button
                  onClick={handleCopyComponents}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Copy"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDeleteComponent}
                  className="p-2 hover:bg-red-100 text-red-600 rounded"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}

            <button
              onClick={handlePasteComponents}
              disabled={clipboard.length === 0}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
              title="Paste"
            >
              <Square className="h-4 w-4" />
            </button>

            <button
              onClick={handleGenerateCode}
              disabled={components.length === 0}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded disabled:opacity-50"
              title="Generate Code"
            >
              <Zap className="h-4 w-4 inline mr-1" />
              Generate Code
            </button>

            <button
              onClick={handleExportCircuit}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
              title="Export Circuit"
            >
              <Download className="h-4 w-4 inline mr-1" />
              Export
            </button>

            <label className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded cursor-pointer">
              <Upload className="h-4 w-4 inline mr-1" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImportCircuit}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Component Library Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Component Library</h4>

          {/* Categories */}
          <div className="space-y-4">
            {['board', 'input', 'output'].map(category => (
              <div key={category}>
                <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                  {category}
                </h5>
                <div className="space-y-2">
                  {componentLibrary
                    .filter(comp => comp.category === category)
                    .map(component => {
                      const Icon = component.icon;
                      return (
                        <div
                          key={component.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, component)}
                          className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-move transition-all"
                        >
                          <div
                            className="p-2 rounded"
                            style={{ backgroundColor: component.color + '20' }}
                          >
                            <Icon
                              className="h-5 w-5"
                              style={{ color: component.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {component.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {component.pins} pins
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-100 overflow-hidden relative">
          <div
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            style={{
              backgroundImage: showGrid ? `
                radial-gradient(circle, #e5e7eb 1px, transparent 1px),
                linear-gradient(to right, #f3f4f6 1px, transparent 1px),
                linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
              ` : 'none',
              backgroundSize: showGrid ? `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px` : 'auto',
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => {
              setSelectedComponents([]);
              setSelectedComponent(null);
            }}
          >
            {/* Render connections first (behind components) */}
            {connections.map(connection => {
              const fromComp = components.find(c => c.id === connection.from.componentId);
              const toComp = components.find(c => c.id === connection.to.componentId);

              if (!fromComp || !toComp) return null;

              const fromX = fromComp.x + (fromComp.size?.width || 60) / 2;
              const fromY = fromComp.y + (fromComp.size?.height || 40) / 2;
              const toX = toComp.x + (toComp.size?.width || 60) / 2;
              const toY = toComp.y + (toComp.size?.height || 40) / 2;

              return (
                <svg
                  key={connection.id}
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: 1 }}
                >
                  <line
                    x1={(fromX + panOffset.x) * zoom}
                    y1={(fromY + panOffset.y) * zoom}
                    x2={(toX + panOffset.x) * zoom}
                    y2={(toY + panOffset.y) * zoom}
                    stroke={connection.color}
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={connection.color}
                      />
                    </marker>
                  </defs>
                </svg>
              );
            })}

            {/* Render components */}
            {components.map(component => {
              const libraryComponent = componentLibrary.find(c => c.id === component.type);
              if (!libraryComponent) return null;

              const Icon = libraryComponent.icon;
              const isSelected = selectedComponents.includes(component.id);

              return (
                <div
                  key={component.id}
                  className={`absolute cursor-move border-2 rounded-lg p-3 bg-white shadow-sm transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                  }`}
                  style={{
                    left: (component.x * zoom) + panOffset.x,
                    top: (component.y * zoom) + panOffset.y,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    minWidth: component.size?.width || 60,
                    minHeight: component.size?.height || 40
                  }}
                  onClick={(e) => handleComponentClick(component.id, e)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="p-1 rounded"
                      style={{ backgroundColor: component.color + '20' }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: component.color }}
                      />
                    </div>
                    {isSelected && (
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Rotate component
                            const updatedComponents = components.map(comp =>
                              comp.id === component.id
                                ? { ...comp, rotation: (comp.rotation + 90) % 360 }
                                : comp
                            );
                            setComponents(updatedComponents);
                            saveToHistory(updatedComponents, connections);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <RotateCw className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-center text-gray-700 font-medium truncate">
                    {component.name}
                  </div>

                  {/* Connection points */}
                  <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                    <div
                      className={`w-3 h-3 rounded-full border-2 cursor-pointer transition-colors ${
                        isConnecting && connectionStart === component.id
                          ? 'bg-blue-500 border-blue-600'
                          : 'bg-white border-gray-400 hover:border-blue-400'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectionClick(component.id);
                      }}
                    />
                  </div>
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
                    <div
                      className={`w-3 h-3 rounded-full border-2 cursor-pointer transition-colors ${
                        isConnecting && connectionStart === component.id
                          ? 'bg-blue-500 border-blue-600'
                          : 'bg-white border-gray-400 hover:border-blue-400'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectionClick(component.id);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Canvas overlay for empty state */}
          {components.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Zap className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start Designing Your Circuit
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag components from the sidebar to begin building your circuit
                </p>
                <div className="text-sm text-gray-500">
                  Tip: Use the pan tool to navigate and zoom controls to adjust view
                </div>
              </div>
            </div>
          )}

          {/* Connection mode indicator */}
          {isConnecting && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <Link className="h-4 w-4" />
                <span className="text-sm">Click on another component to create connection</span>
                <button
                  onClick={() => {
                    setIsConnecting(false);
                    setConnectionStart(null);
                  }}
                  className="ml-2 hover:bg-blue-700 p-1 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Properties</h4>

          {selectedComponent ? (
            <div className="space-y-4">
              {(() => {
                const component = components.find(c => c.id === selectedComponent);
                if (!component) return null;

                return (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      {component.name}
                    </h5>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Position X
                        </label>
                        <input
                          type="number"
                          value={Math.round(component.x)}
                          onChange={(e) => {
                            const updatedComponents = components.map(comp =>
                              comp.id === component.id
                                ? { ...comp, x: parseInt(e.target.value) || 0 }
                                : comp
                            );
                            setComponents(updatedComponents);
                            saveToHistory(updatedComponents, connections);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Position Y
                        </label>
                        <input
                          type="number"
                          value={Math.round(component.y)}
                          onChange={(e) => {
                            const updatedComponents = components.map(comp =>
                              comp.id === component.id
                                ? { ...comp, y: parseInt(e.target.value) || 0 }
                                : comp
                            );
                            setComponents(updatedComponents);
                            saveToHistory(updatedComponents, connections);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Rotation
                        </label>
                        <input
                          type="number"
                          value={component.rotation || 0}
                          onChange={(e) => {
                            const updatedComponents = components.map(comp =>
                              comp.id === component.id
                                ? { ...comp, rotation: parseInt(e.target.value) || 0 }
                                : comp
                            );
                            setComponents(updatedComponents);
                            saveToHistory(updatedComponents, connections);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Square className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Select a component to view its properties</p>
            </div>
          )}

          {/* Circuit Statistics */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Circuit Stats</h5>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Components:</span>
                <span className="font-medium">{components.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Connections:</span>
                <span className="font-medium">{connections.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Zoom:</span>
                <span className="font-medium">{Math.round(zoom * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircuitDesigner;