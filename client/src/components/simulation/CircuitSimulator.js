/**
 * Circuit Simulator Component
 * Real-time circuit simulation with virtual hardware testing
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Activity,
  Zap,
  Thermometer,
  Eye,
  Volume2,
  Lightbulb,
  Square,
  Circle,
  BarChart3,
  Download,
  Upload,
  Monitor,
  Cpu,
  Wifi,
  Bluetooth,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const CircuitSimulator = ({ components = [], connections = [], onSimulationData }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [sensorValues, setSensorValues] = useState({});
  const [outputValues, setOutputValues] = useState({});
  const [logs, setLogs] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [simulationMode, setSimulationMode] = useState('realtime'); // realtime, step, fast
  const [breakpoints, setBreakpoints] = useState([]);

  // Server-side simulation state
  const [simulationId, setSimulationId] = useState(null);
  const [serverSimulation, setServerSimulation] = useState(null);
  const [useServerSimulation, setUseServerSimulation] = useState(true);
  const [warnings, setWarnings] = useState([]);
  const [errors, setErrors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const simulationRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize sensor values
  useEffect(() => {
    const initialSensors = {};
    components.forEach(component => {
      if (component.type.includes('sensor') || component.type.includes('potentiometer')) {
        initialSensors[component.id] = {
          value: getDefaultSensorValue(component.type),
          unit: getSensorUnit(component.type),
          min: 0,
          max: getMaxSensorValue(component.type)
        };
      }
    });
    setSensorValues(initialSensors);
  }, [components]);

  // Get default sensor values
  const getDefaultSensorValue = (type) => {
    switch (type) {
      case 'temperature-sensor': return 25; // Celsius
      case 'photoresistor': return 512; // Analog value
      case 'potentiometer': return 512; // Analog value
      default: return 0;
    }
  };

  const getMaxSensorValue = (type) => {
    switch (type) {
      case 'temperature-sensor': return 100;
      case 'photoresistor': return 1023;
      case 'potentiometer': return 1023;
      default: return 100;
    }
  };

  const getSensorUnit = (type) => {
    switch (type) {
      case 'temperature-sensor': return '°C';
      case 'photoresistor': return '';
      case 'potentiometer': return '';
      default: return '';
    }
  };

  // Simulation logic
  const runSimulation = useCallback(() => {
    if (!isRunning) return;

    const newOutputs = {};
    const newLogs = [...logs];

    // Process each component
    components.forEach(component => {
      switch (component.type) {
        case 'led':
          // LED brightness based on connected inputs
          const ledInputs = connections.filter(conn =>
            conn.to.componentId === component.id
          );
          const ledBrightness = ledInputs.length > 0 ? 255 : 0;
          newOutputs[component.id] = {
            type: 'led',
            brightness: ledBrightness,
            color: ledBrightness > 0 ? '#00ff00' : '#333333'
          };
          break;

        case 'buzzer':
          // Buzzer state based on inputs
          const buzzerInputs = connections.filter(conn =>
            conn.to.componentId === component.id
          );
          const buzzerActive = buzzerInputs.length > 0;
          newOutputs[component.id] = {
            type: 'buzzer',
            active: buzzerActive,
            frequency: buzzerActive ? 1000 : 0
          };
          break;

        case 'arduino-uno':
        case 'esp32':
          // Microcontroller simulation
          newOutputs[component.id] = {
            type: 'microcontroller',
            status: 'running',
            pins: simulateMicrocontrollerPins(component, connections),
            memory: {
              used: Math.floor(Math.random() * 1000) + 500,
              total: component.type === 'arduino-uno' ? 2048 : 4096
            }
          };
          break;

        default:
          newOutputs[component.id] = {
            type: component.type,
            status: 'idle'
          };
      }
    });

    setOutputValues(newOutputs);

    // Add simulation log
    if (newLogs.length > 50) newLogs.shift(); // Keep only last 50 logs
    newLogs.push({
      timestamp: new Date().toLocaleTimeString(),
      message: `Simulation step ${currentTime + 1} completed`,
      type: 'info'
    });

    setLogs(newLogs);
    setCurrentTime(prev => prev + 1);

    // Send data to parent
    if (onSimulationData) {
      onSimulationData({
        time: currentTime,
        sensors: sensorValues,
        outputs: newOutputs,
        logs: newLogs
      });
    }
  }, [isRunning, components, connections, sensorValues, logs, currentTime, onSimulationData]);

  // Simulate microcontroller pins
  const simulateMicrocontrollerPins = (component, connections) => {
    const pins = {};

    // Initialize all pins
    for (let i = 0; i <= 13; i++) {
      pins[i] = {
        mode: 'INPUT',
        value: 0,
        connected: false
      };
    }

    // Update based on connections
    connections.forEach(conn => {
      if (conn.from.componentId === component.id) {
        const pinNum = parseInt(conn.from.pin.replace('D', ''));
        if (!isNaN(pinNum)) {
          pins[pinNum] = {
            mode: 'OUTPUT',
            value: 1,
            connected: true
          };
        }
      }
    });

    return pins;
  };

  // Server-side simulation functions
  const startServerSimulation = async () => {
    try {
      const circuitData = { components, connections };
      const response = await axios.post('/api/simulation/start', { circuitData });

      if (response.data.success) {
        setSimulationId(response.data.data.simulationId);
        setServerSimulation(response.data.data.simulation);
        setIsRunning(true);

        // Get initial analysis
        await getSimulationAnalysis(response.data.data.simulationId);

        addLog('Server simulation started', 'info');
      }
    } catch (error) {
      console.error('Failed to start server simulation:', error);
      addLog('Failed to start server simulation', 'error');
    }
  };

  const stopServerSimulation = async () => {
    if (!simulationId) return;

    try {
      await axios.post(`/api/simulation/${simulationId}/stop`);
      setIsRunning(false);
      setSimulationId(null);
      setServerSimulation(null);
      addLog('Server simulation stopped', 'info');
    } catch (error) {
      console.error('Failed to stop server simulation:', error);
      addLog('Failed to stop server simulation', 'error');
    }
  };

  const stepServerSimulation = async () => {
    if (!simulationId || !isRunning) return;

    try {
      const response = await axios.post(`/api/simulation/${simulationId}/step`, {
        timeStep: 1000 / simulationSpeed
      });

      if (response.data.success) {
        const simulation = response.data.data.simulation;
        setServerSimulation(simulation);
        setCurrentTime(simulation.currentTime);
        setSensorValues(simulation.sensorValues);
        setOutputValues(simulation.outputValues);
        setWarnings(simulation.warnings || []);
        setErrors(simulation.errors || []);
      }
    } catch (error) {
      console.error('Failed to step server simulation:', error);
      addLog('Failed to step server simulation', 'error');
    }
  };

  const getSimulationAnalysis = async (simId) => {
    try {
      const response = await axios.get(`/api/simulation/${simId}/analysis`);
      if (response.data.success) {
        const analysis = response.data.data.analysis;
        setWarnings(analysis.warnings || []);
        setErrors(analysis.errors || []);
        setRecommendations(analysis.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to get simulation analysis:', error);
    }
  };

  const updateServerSensors = async (sensorUpdates) => {
    if (!simulationId) return;

    try {
      await axios.put(`/api/simulation/${simulationId}/sensors`, { sensorUpdates });
    } catch (error) {
      console.error('Failed to update server sensors:', error);
    }
  };

  // Helper function to add logs
  const addLog = (message, type = 'info') => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => {
      const updated = [...prev, newLog];
      return updated.length > 50 ? updated.slice(-50) : updated;
    });
  };

  // Start/stop simulation
  const toggleSimulation = async () => {
    if (useServerSimulation) {
      if (isRunning) {
        await stopServerSimulation();
      } else {
        await startServerSimulation();
      }
    } else {
      setIsRunning(!isRunning);
    }
  };

  const resetSimulation = async () => {
    if (useServerSimulation && simulationId) {
      await stopServerSimulation();
    }
    setIsRunning(false);
    setCurrentTime(0);
    setLogs([]);
    setOutputValues({});
    setWarnings([]);
    setErrors([]);
    setRecommendations([]);
  };

  // Update sensor values
  const updateSensorValue = async (componentId, value) => {
    const clampedValue = Math.max(sensorValues[componentId].min, Math.min(sensorValues[componentId].max, value));

    setSensorValues(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        value: clampedValue
      }
    }));

    // Update server-side simulation if enabled
    if (useServerSimulation && simulationId) {
      try {
        await updateServerSensors({ [componentId]: clampedValue });
      } catch (error) {
        console.error('Failed to update server sensor:', error);
      }
    }
  };

  // Simulation loop
  useEffect(() => {
    if (isRunning) {
      if (useServerSimulation && simulationId) {
        // Server-side simulation
        const interval = setInterval(stepServerSimulation, 1000 / simulationSpeed);
        return () => clearInterval(interval);
      } else {
        // Client-side simulation
        const interval = setInterval(runSimulation, 1000 / simulationSpeed);
        return () => clearInterval(interval);
      }
    }
  }, [isRunning, simulationSpeed, useServerSimulation, simulationId, runSimulation]);

  // Sensor control components
  const SensorControl = ({ component }) => {
    const sensor = sensorValues[component.id];
    if (!sensor) return null;

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {component.type === 'temperature-sensor' && <Thermometer className="h-5 w-5 text-red-500" />}
            {component.type === 'photoresistor' && <Eye className="h-5 w-5 text-purple-500" />}
            {component.type === 'potentiometer' && <Circle className="h-5 w-5 text-green-500" />}
            <span className="font-medium text-gray-900">{component.name}</span>
          </div>
          <span className="text-sm text-gray-500">{component.type}</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Value:</span>
            <span className="font-mono text-sm">
              {sensor.value} {sensor.unit}
            </span>
          </div>

          <input
            type="range"
            min={sensor.min}
            max={sensor.max}
            value={sensor.value}
            onChange={(e) => updateSensorValue(component.id, parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            disabled={isRunning && simulationMode === 'realtime'}
          />

          <div className="flex justify-between text-xs text-gray-500">
            <span>{sensor.min}{sensor.unit}</span>
            <span>{sensor.max}{sensor.unit}</span>
          </div>
        </div>
      </div>
    );
  };

  // Output display components
  const OutputDisplay = ({ component }) => {
    const output = outputValues[component.id];
    if (!output) return null;

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {component.type === 'led' && <Lightbulb className="h-5 w-5 text-yellow-500" />}
            {component.type === 'buzzer' && <Volume2 className="h-5 w-5 text-orange-500" />}
            {component.type.includes('arduino') && <Cpu className="h-5 w-5 text-blue-500" />}
            {component.type.includes('esp') && <Wifi className="h-5 w-5 text-red-500" />}
            <span className="font-medium text-gray-900">{component.name}</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            output.status === 'running' ? 'bg-green-100 text-green-800' :
            output.active ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {output.status || (output.active ? 'Active' : 'Inactive')}
          </div>
        </div>

        {/* Component-specific output display */}
        {component.type === 'led' && (
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: output.color }}
            />
            <div className="text-sm">
              <div>Brightness: {output.brightness}/255</div>
              <div className="text-gray-500">Voltage: {(output.brightness * 5 / 255).toFixed(2)}V</div>
            </div>
          </div>
        )}

        {component.type === 'buzzer' && (
          <div className="text-sm">
            <div>Frequency: {output.frequency} Hz</div>
            <div className="text-gray-500">
              Status: {output.active ? 'Playing' : 'Silent'}
            </div>
          </div>
        )}

        {(component.type.includes('arduino') || component.type.includes('esp')) && (
          <div className="space-y-2">
            <div className="text-sm">
              <div>Memory: {output.memory?.used}/{output.memory?.total} KB</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(output.memory?.used / output.memory?.total) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-8 gap-1 text-xs">
              {Object.entries(output.pins || {}).slice(0, 16).map(([pin, data]) => (
                <div key={pin} className="text-center">
                  <div className={`w-6 h-6 rounded border flex items-center justify-center text-xs ${
                    data.connected ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'
                  }`}>
                    {pin}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.mode === 'OUTPUT' ? 'OUT' : 'IN'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Circuit Simulator</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isRunning ? 'Running' : 'Stopped'}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Simulation Controls */}
            <button
              onClick={toggleSimulation}
              className={`px-4 py-2 rounded-lg font-medium ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? <Pause className="h-4 w-4 inline mr-2" /> : <Play className="h-4 w-4 inline mr-2" />}
              {isRunning ? 'Stop' : 'Start'}
            </button>

            <button
              onClick={resetSimulation}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
            >
              <RotateCcw className="h-4 w-4 inline mr-2" />
              Reset
            </button>

            {/* Speed Control */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Speed:</span>
              <select
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={5}>5x</option>
                <option value={10}>10x</option>
              </select>
            </div>

            {/* Simulation Mode Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Mode:</span>
              <button
                onClick={() => setUseServerSimulation(!useServerSimulation)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  useServerSimulation
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}
                title={useServerSimulation ? 'Using server simulation' : 'Using client simulation'}
              >
                {useServerSimulation ? 'Server' : 'Client'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Issues and Recommendations Panel */}
      {(warnings.length > 0 || errors.length > 0 || recommendations.length > 0) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Circuit Analysis
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                {errors.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      <span className="font-medium">Errors ({errors.length}):</span>
                    </div>
                    <ul className="ml-5 mt-1 list-disc">
                      {errors.slice(0, 3).map((error, index) => (
                        <li key={index}>{error.message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {warnings.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="font-medium">Warnings ({warnings.length}):</span>
                    </div>
                    <ul className="ml-5 mt-1 list-disc">
                      {warnings.slice(0, 3).map((warning, index) => (
                        <li key={index}>{warning.message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="font-medium">Recommendations ({recommendations.length}):</span>
                    </div>
                    <ul className="ml-5 mt-1 list-disc">
                      {recommendations.slice(0, 3).map((rec, index) => (
                        <li key={index}>
                          <span className={`font-medium ${
                            rec.priority === 'high' ? 'text-red-600' :
                            rec.priority === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            [{rec.priority}]
                          </span> {rec.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Sensors */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensor Controls</h3>

          {components.filter(comp =>
            comp.type.includes('sensor') || comp.type.includes('potentiometer')
          ).length > 0 ? (
            <div className="space-y-4">
              {components
                .filter(comp => comp.type.includes('sensor') || comp.type.includes('potentiometer'))
                .map(component => (
                  <SensorControl key={component.id} component={component} />
                ))
              }
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No sensors in your circuit</p>
              <p className="text-xs text-gray-400 mt-1">
                Add sensors to control their values during simulation
              </p>
            </div>
          )}
        </div>

        {/* Center - Circuit Visualization */}
        <div className="flex-1 bg-white p-4">
          <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Monitor className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Circuit Visualization
              </h3>
              <p className="text-gray-600 mb-4">
                Real-time circuit simulation will appear here
              </p>
              <div className="text-sm text-gray-500">
                Components: {components.length} | Connections: {connections.length}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Outputs */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Output Displays</h3>

          {components.filter(comp =>
            comp.type === 'led' || comp.type === 'buzzer' ||
            comp.type.includes('arduino') || comp.type.includes('esp')
          ).length > 0 ? (
            <div className="space-y-4">
              {components
                .filter(comp =>
                  comp.type === 'led' || comp.type === 'buzzer' ||
                  comp.type.includes('arduino') || comp.type.includes('esp')
                )
                .map(component => (
                  <OutputDisplay key={component.id} component={component} />
                ))
              }
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Zap className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No output components</p>
              <p className="text-xs text-gray-400 mt-1">
                Add LEDs, buzzers, or microcontrollers to see outputs
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Panel - Logs */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Simulation Logs</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Time: {currentTime}s</span>
            <button
              onClick={() => setLogs([])}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm max-h-32 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                <span className={`${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {log.message}
                </span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 italic">
              Simulation logs will appear here when running...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircuitSimulator;