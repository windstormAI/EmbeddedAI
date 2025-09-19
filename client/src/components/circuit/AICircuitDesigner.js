/**
 * AI-Powered Circuit Designer
 * Canva-style drag-and-drop with AI circuit generation from natural language
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
  Sparkles,
  Wand2,
  Brain,
  MessageSquare,
  Palette,
  Layout,
  Box,
  GitBranch
} from 'lucide-react';

const AICircuitDesigner = ({
  project,
  onCircuitChange,
  onCodeGenerate,
  onAIDesign
}) => {
  const canvasRef = useRef(null);
  const [designPrompt, setDesignPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState(null);
  const [viewMode, setViewMode] = useState('2d'); // '2d', '3d', 'split'
  const [selectedTool, setSelectedTool] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [designHistory, setDesignHistory] = useState([]);
  const [currentDesignIndex, setCurrentDesignIndex] = useState(-1);

  // Circuit state
  const [components, setComponents] = useState(project?.circuitData?.components || []);
  const [connections, setConnections] = useState(project?.circuitData?.connections || []);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [draggedComponent, setDraggedComponent] = useState(null);

  // AI Design Templates
  const designTemplates = [
    {
      name: "LED Blinker",
      prompt: "Create a simple LED blinking circuit with Arduino Uno",
      category: "beginner"
    },
    {
      name: "Temperature Monitor",
      prompt: "Design a temperature monitoring system with LCD display",
      category: "sensor"
    },
    {
      name: "IoT Weather Station",
      prompt: "Build a complete IoT weather station with ESP32 and multiple sensors",
      category: "iot"
    },
    {
      name: "Robotic Arm Controller",
      prompt: "Design a 4-servo robotic arm controller with joystick input",
      category: "robotics"
    },
    {
      name: "Smart Home Hub",
      prompt: "Create a central smart home control hub with multiple relays",
      category: "automation"
    }
  ];

  // Generate circuit from AI prompt
  const generateCircuitFromAI = useCallback(async (prompt) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-circuit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          boardType: 'arduino-uno',
          complexity: 'intermediate',
          include3d: true,
          generateCode: true
        })
      });

      const result = await response.json();

      if (result.success) {
        const newDesign = {
          components: result.data.components,
          connections: result.data.connections,
          code: result.data.code,
          explanation: result.data.explanation,
          timestamp: new Date().toISOString(),
          prompt: prompt
        };

        setGeneratedDesign(newDesign);
        setComponents(result.data.components);
        setConnections(result.data.connections);

        // Add to history
        const newHistory = [...designHistory, newDesign];
        setDesignHistory(newHistory);
        setCurrentDesignIndex(newHistory.length - 1);

        // Notify parent
        if (onCircuitChange) {
          onCircuitChange({
            components: result.data.components,
            connections: result.data.connections
          });
        }

        if (onCodeGenerate) {
          onCodeGenerate(result.data.code);
        }

        if (onAIDesign) {
          onAIDesign(newDesign);
        }
      }
    } catch (error) {
      console.error('AI circuit generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [designHistory, onCircuitChange, onCodeGenerate, onAIDesign]);

  // Enhanced drag and drop with Canva-style interactions
  const handleDragStart = useCallback((e, component) => {
    setDraggedComponent(component);
    e.dataTransfer.effectAllowed = 'copy';

    // Add visual feedback
    e.dataTransfer.setData('application/json', JSON.stringify(component));
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();

    if (!draggedComponent) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    // Snap to grid
    const snappedX = Math.round(x / 20) * 20;
    const snappedY = Math.round(y / 20) * 20;

    const newComponent = {
      id: `${draggedComponent.id}_${Date.now()}`,
      type: draggedComponent.id,
      name: draggedComponent.name,
      x: snappedX,
      y: snappedY,
      rotation: 0,
      properties: {},
      color: draggedComponent.color,
      size: draggedComponent.size,
      pins: draggedComponent.pins,
      // Enhanced properties for Canva-style editing
      style: {
        opacity: 1,
        scale: 1,
        shadow: false,
        glow: false
      },
      animations: [],
      effects: []
    };

    const updatedComponents = [...components, newComponent];
    setComponents(updatedComponents);

    if (onCircuitChange) {
      onCircuitChange({
        components: updatedComponents,
        connections
      });
    }

    setDraggedComponent(null);
  }, [draggedComponent, components, connections, panOffset, zoom, onCircuitChange]);

  // Canva-style component manipulation
  const handleComponentSelect = useCallback((componentId, e) => {
    e.stopPropagation();

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
    }
  }, []);

  const handleComponentTransform = useCallback((componentId, transform) => {
    const updatedComponents = components.map(comp => {
      if (comp.id === componentId) {
        return {
          ...comp,
          ...transform,
          style: {
            ...comp.style,
            ...transform.style
          }
        };
      }
      return comp;
    });

    setComponents(updatedComponents);

    if (onCircuitChange) {
      onCircuitChange({
        components: updatedComponents,
        connections
      });
    }
  }, [components, connections, onCircuitChange]);

  // AI-powered design refinement
  const refineDesignWithAI = useCallback(async (refinementPrompt) => {
    if (!generatedDesign) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/refine-circuit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          originalDesign: generatedDesign,
          refinementPrompt,
          currentComponents: components,
          currentConnections: connections
        })
      });

      const result = await response.json();

      if (result.success) {
        const refinedDesign = {
          ...generatedDesign,
          components: result.data.components,
          connections: result.data.connections,
          refinements: [...(generatedDesign.refinements || []), {
            prompt: refinementPrompt,
            changes: result.data.changes,
            timestamp: new Date().toISOString()
          }]
        };

        setGeneratedDesign(refinedDesign);
        setComponents(result.data.components);
        setConnections(result.data.connections);

        // Add to history
        const newHistory = [...designHistory.slice(0, currentDesignIndex + 1), refinedDesign];
        setDesignHistory(newHistory);
        setCurrentDesignIndex(newHistory.length - 1);
      }
    } catch (error) {
      console.error('AI design refinement failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [generatedDesign, components, connections, designHistory, currentDesignIndex]);

  // Design history navigation
  const navigateDesignHistory = useCallback((direction) => {
    const newIndex = currentDesignIndex + direction;

    if (newIndex >= 0 && newIndex < designHistory.length) {
      const historicalDesign = designHistory[newIndex];
      setGeneratedDesign(historicalDesign);
      setComponents(historicalDesign.components);
      setConnections(historicalDesign.connections);
      setCurrentDesignIndex(newIndex);

      if (onCircuitChange) {
        onCircuitChange({
          components: historicalDesign.components,
          connections: historicalDesign.connections
        });
      }
    }
  }, [currentDesignIndex, designHistory, onCircuitChange]);

  return (
    <div className="h-full flex bg-gray-50">
      {/* AI Design Panel */}
      {showAIPanel && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* AI Prompt Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">AI Circuit Designer</h3>
            </div>

            <textarea
              value={designPrompt}
              onChange={(e) => setDesignPrompt(e.target.value)}
              placeholder="Describe your circuit design... e.g., 'Create a smart irrigation system with moisture sensors and water pump'"
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => generateCircuitFromAI(designPrompt)}
                disabled={!designPrompt.trim() || isGenerating}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Design
                  </>
                )}
              </button>

              <button
                onClick={() => setShowAIPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Layout className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Design Templates */}
          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="font-medium text-gray-900 mb-3">Quick Templates</h4>
            <div className="space-y-2">
              {designTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDesignPrompt(template.prompt);
                    generateCircuitFromAI(template.prompt);
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">{template.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{template.prompt}</div>
                  <div className="text-xs text-purple-600 mt-1 capitalize">{template.category}</div>
                </button>
              ))}
            </div>

            {/* Design History */}
            {designHistory.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Design History</h4>
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigateDesignHistory(-1)}
                      disabled={currentDesignIndex <= 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                      <Undo className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigateDesignHistory(1)}
                      disabled={currentDesignIndex >= designHistory.length - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                      <Redo className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {designHistory.slice().reverse().map((design, index) => (
                    <button
                      key={design.timestamp}
                      onClick={() => {
                        const actualIndex = designHistory.length - 1 - index;
                        navigateDesignHistory(actualIndex - currentDesignIndex);
                      }}
                      className={`w-full text-left p-2 rounded text-sm ${
                        designHistory.length - 1 - index === currentDesignIndex
                          ? 'bg-purple-100 border-purple-300'
                          : 'hover:bg-gray-50'
                      } border`}
                    >
                      <div className="truncate">{design.prompt}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(design.timestamp).toLocaleTimeString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Design Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === '2d' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
                  }`}
                >
                  2D View
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === '3d' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
                  }`}
                >
                  3D View
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    viewMode === 'split' ? 'bg-white shadow text-purple-600' : 'text-gray-600'
                  }`}
                >
                  Split View
                </button>
              </div>

              {/* Design Tools */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTool('select')}
                  className={`p-2 rounded ${selectedTool === 'select' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
                  title="Select Tool"
                >
                  <Move className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedTool('connect')}
                  className={`p-2 rounded ${selectedTool === 'connect' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
                  title="Connect Tool"
                >
                  <Link className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedTool('pan')}
                  className={`p-2 rounded ${selectedTool === 'pan' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
                  title="Pan Tool"
                >
                  <Move className="h-4 w-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(Math.max(0.3, zoom - 0.1))} className="p-2 hover:bg-gray-100 rounded">
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="p-2 hover:bg-gray-100 rounded">
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Panel Toggle */}
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`p-2 rounded ${showAIPanel ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
                title="AI Design Panel"
              >
                <Brain className="h-4 w-4" />
              </button>

              {/* Generate Code */}
              <button
                onClick={() => onCodeGenerate && onCodeGenerate(generatedDesign?.code)}
                disabled={!generatedDesign?.code}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded-lg flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Generate Code
              </button>

              {/* Export */}
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full relative"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              backgroundImage: `
                radial-gradient(circle, #e5e7eb 1px, transparent 1px),
                linear-gradient(to right, #f3f4f6 1px, transparent 1px),
                linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px, ${20 * zoom}px ${20 * zoom}px, ${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
            }}
          >
            {/* Render components */}
            {components.map((component) => (
              <div
                key={component.id}
                className={`absolute cursor-move transition-transform ${
                  selectedComponents.includes(component.id) ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                }`}
                style={{
                  left: (component.x * zoom) + panOffset.x,
                  top: (component.y * zoom) + panOffset.y,
                  transform: `scale(${zoom}) rotate(${component.rotation || 0}deg)`,
                  transformOrigin: 'center'
                }}
                onClick={(e) => handleComponentSelect(component.id, e)}
                draggable
                onDragStart={(e) => handleDragStart(e, component)}
              >
                {/* Component visualization */}
                <div
                  className="w-16 h-16 rounded-lg border-2 border-gray-300 bg-white shadow-lg flex items-center justify-center"
                  style={{
                    backgroundColor: component.color ? `${component.color}20` : '#ffffff',
                    borderColor: component.color || '#d1d5db'
                  }}
                >
                  <component.icon className="h-8 w-8" style={{ color: component.color }} />
                </div>

                {/* Component label */}
                <div className="text-xs text-center mt-1 font-medium text-gray-700 max-w-20 truncate">
                  {component.name}
                </div>
              </div>
            ))}

            {/* Connection lines */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              {connections.map((connection) => {
                const fromComp = components.find(c => c.id === connection.from?.componentId);
                const toComp = components.find(c => c.id === connection.to?.componentId);

                if (!fromComp || !toComp) return null;

                const x1 = (fromComp.x + 8) * zoom + panOffset.x;
                const y1 = (fromComp.y + 8) * zoom + panOffset.y;
                const x2 = (toComp.x + 8) * zoom + panOffset.x;
                const y2 = (toComp.y + 8) * zoom + panOffset.y;

                return (
                  <line
                    key={connection.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#6366f1"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7"
                        refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* AI Generation Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Circuit Design</h3>
                <p className="text-gray-600">AI is analyzing your requirements and creating the perfect circuit...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component Library Sidebar */}
      <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Components</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'arduino-uno', name: 'Arduino Uno', icon: Cpu, color: '#00979C' },
              { id: 'esp32', name: 'ESP32', icon: Wifi, color: '#E7352C' },
              { id: 'led', name: 'LED', icon: Lightbulb, color: '#FFD700' },
              { id: 'push-button', name: 'Button', icon: Square, color: '#4A90E2' },
              { id: 'temperature-sensor', name: 'Temp Sensor', icon: Thermometer, color: '#D0021B' },
              { id: 'buzzer', name: 'Buzzer', icon: Volume2, color: '#F5A623' }
            ].map((component) => (
              <div
                key={component.id}
                draggable
                onDragStart={(e) => handleDragStart(e, component)}
                className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-move transition-colors"
              >
                <div className="flex flex-col items-center text-center">
                  <component.icon className="h-6 w-6 mb-2" style={{ color: component.color }} />
                  <span className="text-xs font-medium text-gray-700">{component.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICircuitDesigner;