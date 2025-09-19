import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Settings, Zap, Activity, Cpu, Thermometer } from 'lucide-react';

const SimulationPanel = ({ circuitData, onSimulationUpdate }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [voltageReadings, setVoltageReadings] = useState({});
  const [currentReadings, setCurrentReadings] = useState({});
  const [temperature, setTemperature] = useState(25);
  const [powerConsumption, setPowerConsumption] = useState(0);
  const [simulationData, setSimulationData] = useState([]);
  const intervalRef = useRef(null);

  // Simulation parameters
  const [simulationParams, setSimulationParams] = useState({
    timeStep: 0.001, // seconds
    maxTime: 10, // seconds
    voltageSource: 5.0, // volts
    resistance: 1000, // ohms
    capacitance: 0.000001, // farads
  });

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + simulationParams.timeStep * simulationSpeed;
          if (newTime >= simulationParams.maxTime) {
            setIsRunning(false);
            return simulationParams.maxTime;
          }
          return newTime;
        });
      }, 50); // Update every 50ms for smooth animation
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, simulationSpeed, simulationParams.timeStep, simulationParams.maxTime]);

  // Calculate simulation values based on circuit components
  useEffect(() => {
    if (circuitData && circuitData.components) {
      // Simple RC circuit simulation
      const time = currentTime;
      const V_source = simulationParams.voltageSource;
      const R = simulationParams.resistance;
      const C = simulationParams.capacitance;

      // Capacitor voltage in RC circuit: Vc = V_source * (1 - e^(-t/RC))
      const Vc = V_source * (1 - Math.exp(-time / (R * C)));
      const Vr = V_source - Vc; // Resistor voltage
      const I = Vr / R; // Current through circuit

      // Update readings
      setVoltageReadings({
        source: V_source,
        resistor: Vr,
        capacitor: Vc,
      });

      setCurrentReadings({
        circuit: I,
      });

      setPowerConsumption(V_source * I);

      // Simulate temperature increase based on power
      setTemperature(25 + (powerConsumption * 10));

      // Add data point for plotting
      setSimulationData(prev => {
        const newData = [...prev, {
          time,
          voltage: Vc,
          current: I,
          power: powerConsumption,
        }];
        // Keep only last 1000 points for performance
        return newData.slice(-1000);
      });

      // Notify parent component
      if (onSimulationUpdate) {
        onSimulationUpdate({
          time,
          voltageReadings: { source: V_source, resistor: Vr, capacitor: Vc },
          currentReadings: { circuit: I },
          powerConsumption,
          temperature: 25 + (powerConsumption * 10),
        });
      }
    }
  }, [currentTime, circuitData, simulationParams, powerConsumption, onSimulationUpdate]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setCurrentTime(0);
    setSimulationData([]);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentTime(0);
    setSimulationData([]);
    setVoltageReadings({});
    setCurrentReadings({});
    setPowerConsumption(0);
    setTemperature(25);
  };

  const handleSpeedChange = (speed) => {
    setSimulationSpeed(speed);
  };

  const handleParamChange = (param, value) => {
    setSimulationParams(prev => ({
      ...prev,
      [param]: parseFloat(value) || 0,
    }));
  };

  return (
    <div className="simulation-panel bg-white rounded-lg shadow-lg p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Circuit Simulation</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-2 mb-6">
        <button
          onClick={handleStart}
          disabled={isRunning}
          className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          <span>Start</span>
        </button>

        <button
          onClick={handlePause}
          disabled={!isRunning}
          className="flex items-center space-x-1 px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Pause className="w-4 h-4" />
          <span>Pause</span>
        </button>

        <button
          onClick={handleStop}
          className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          <Square className="w-4 h-4" />
          <span>Stop</span>
        </button>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>

        <div className="flex items-center space-x-2 ml-4">
          <span className="text-sm text-gray-600">Speed:</span>
          <select
            value={simulationSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value={0.1}>0.1x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </div>
      </div>

      {/* Simulation Parameters */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Voltage Source (V)
          </label>
          <input
            type="number"
            value={simulationParams.voltageSource}
            onChange={(e) => handleParamChange('voltageSource', e.target.value)}
            className="w-full px-3 py-2 border rounded"
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resistance (Ω)
          </label>
          <input
            type="number"
            value={simulationParams.resistance}
            onChange={(e) => handleParamChange('resistance', e.target.value)}
            className="w-full px-3 py-2 border rounded"
            step="100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacitance (F)
          </label>
          <input
            type="number"
            value={simulationParams.capacitance}
            onChange={(e) => handleParamChange('capacitance', e.target.value)}
            className="w-full px-3 py-2 border rounded"
            step="0.000001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Time (s)
          </label>
          <input
            type="number"
            value={simulationParams.maxTime}
            onChange={(e) => handleParamChange('maxTime', e.target.value)}
            className="w-full px-3 py-2 border rounded"
            step="1"
          />
        </div>
      </div>

      {/* Real-time Readings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Voltage</span>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-blue-600">
              {voltageReadings.source?.toFixed(2) || '0.00'}V
            </div>
            <div className="text-xs text-gray-600">
              Source: {voltageReadings.source?.toFixed(2) || '0.00'}V
            </div>
            <div className="text-xs text-gray-600">
              Capacitor: {voltageReadings.capacitor?.toFixed(2) || '0.00'}V
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Current</span>
          </div>
          <div className="text-lg font-bold text-green-600">
            {(currentReadings.circuit * 1000)?.toFixed(2) || '0.00'}mA
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Cpu className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Power</span>
          </div>
          <div className="text-lg font-bold text-purple-600">
            {powerConsumption?.toFixed(3) || '0.000'}W
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Thermometer className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-700">Temperature</span>
          </div>
          <div className="text-lg font-bold text-red-600">
            {temperature?.toFixed(1) || '25.0'}°C
          </div>
        </div>
      </div>

      {/* Progress and Time */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Simulation Time</span>
          <span className="text-sm text-gray-600">
            {currentTime.toFixed(3)}s / {simulationParams.maxTime}s
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentTime / simulationParams.maxTime) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Simulation Data Points */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Data Points</h3>
        <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
          {simulationData.slice(-10).map((point, index) => (
            <div key={index} className="flex justify-between py-1 border-b border-gray-200 last:border-b-0">
              <span>t={point.time.toFixed(3)}s</span>
              <span>V={point.voltage.toFixed(3)}V</span>
              <span>I={(point.current * 1000).toFixed(3)}mA</span>
              <span>P={point.power.toFixed(3)}W</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;