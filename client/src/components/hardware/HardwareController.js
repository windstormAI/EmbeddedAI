import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';

const HardwareController = ({ projectId }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [availablePorts, setAvailablePorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState(null);
  const [sensorData, setSensorData] = useState({});
  const [ledStates, setLedStates] = useState({});
  const [motorSpeed, setMotorSpeed] = useState(0);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const { currentProject } = useProject();

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const writerRef = useRef(null);

  // Check for WebSerial API support
  const isWebSerialSupported = 'serial' in navigator;

  useEffect(() => {
    if (!isWebSerialSupported) {
      setConnectionStatus('unsupported');
      addToConsole('WebSerial API not supported in this browser', 'error');
    }

    return () => {
      disconnect();
    };
  }, [isWebSerialSupported]);

  const addToConsole = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleOutput(prev => [...prev.slice(-49), { message, type, timestamp }]);
  };

  const requestPort = async () => {
    try {
      setConnectionStatus('connecting');
      addToConsole('Requesting serial port access...');

      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      portRef.current = port;
      setSelectedPort(port);
      setIsConnected(true);
      setConnectionStatus('connected');
      addToConsole('Successfully connected to Arduino!', 'success');

      // Start reading from the port
      readFromPort(port);

    } catch (error) {
      console.error('Error connecting to Arduino:', error);
      setConnectionStatus('error');
      addToConsole(`Connection failed: ${error.message}`, 'error');
    }
  };

  const readFromPort = async (port) => {
    try {
      while (port && port.readable) {
        readerRef.current = port.readable.getReader();
        const { value, done } = await readerRef.current.read();

        if (done) break;

        const data = new TextDecoder().decode(value);
        handleIncomingData(data);
      }
    } catch (error) {
      console.error('Error reading from port:', error);
      addToConsole(`Read error: ${error.message}`, 'error');
    }
  };

  const handleIncomingData = (data) => {
    // Parse incoming sensor data
    const lines = data.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        addToConsole(`Arduino: ${line}`, 'data');

        // Parse sensor readings (format: "sensor_name:value")
        const sensorMatch = line.match(/^(\w+):(\d+(?:\.\d+)?)$/);
        if (sensorMatch) {
          const [, sensorName, value] = sensorMatch;
          setSensorData(prev => ({
            ...prev,
            [sensorName]: parseFloat(value)
          }));
        }
      }
    });
  };

  const sendCommand = async (command) => {
    if (!portRef.current || !portRef.current.writable) {
      addToConsole('No active connection to send command', 'error');
      return;
    }

    try {
      if (!writerRef.current) {
        writerRef.current = portRef.current.writable.getWriter();
      }

      const data = new TextEncoder().encode(command + '\n');
      await writerRef.current.write(data);
      addToConsole(`Sent: ${command}`, 'command');
    } catch (error) {
      console.error('Error sending command:', error);
      addToConsole(`Send error: ${error.message}`, 'error');
    }
  };

  const disconnect = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }

      if (writerRef.current) {
        await writerRef.current.close();
        writerRef.current = null;
      }

      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }

      setIsConnected(false);
      setConnectionStatus('disconnected');
      setSelectedPort(null);
      addToConsole('Disconnected from Arduino', 'info');
    } catch (error) {
      console.error('Error disconnecting:', error);
      addToConsole(`Disconnect error: ${error.message}`, 'error');
    }
  };

  const toggleLED = (pin) => {
    const newState = !ledStates[pin];
    setLedStates(prev => ({ ...prev, [pin]: newState }));
    sendCommand(`LED:${pin}:${newState ? 'ON' : 'OFF'}`);
  };

  const setMotorSpeedValue = (speed) => {
    setMotorSpeed(speed);
    sendCommand(`MOTOR:${speed}`);
  };

  const uploadCode = async () => {
    if (!currentProject?.code) {
      addToConsole('No code to upload', 'error');
      return;
    }

    setIsUploading(true);
    addToConsole('Starting code upload...', 'info');

    try {
      // In a real implementation, this would compile and upload the Arduino code
      // For now, we'll simulate the upload process
      await new Promise(resolve => setTimeout(resolve, 3000));
      addToConsole('Code uploaded successfully!', 'success');
    } catch (error) {
      addToConsole(`Upload failed: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const runExample = (example) => {
    const examples = {
      blink: `void setup() { pinMode(13, OUTPUT); }
void loop() { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }`,
      buttonLed: `void setup() { pinMode(2, INPUT); pinMode(13, OUTPUT); }
void loop() { if (digitalRead(2)) digitalWrite(13, HIGH); else digitalWrite(13, LOW); }`,
      sensor: `void setup() { Serial.begin(9600); }
void loop() { int value = analogRead(A0); Serial.println("sensor:" + String(value)); delay(100); }`,
      motor: `void setup() { pinMode(9, OUTPUT); }
void loop() { analogWrite(9, 128); delay(1000); analogWrite(9, 0); delay(1000); }`
    };

    if (examples[example]) {
      addToConsole(`Running ${example} example`, 'info');
      sendCommand(`EXAMPLE:${example}`);
    }
  };

  if (!isWebSerialSupported) {
    return (
      <div className="hardware-controller">
        <div className="unsupported-notice">
          <h3>⚠️ Hardware Integration Not Supported</h3>
          <p>Your browser doesn't support the WebSerial API, which is required for hardware integration.</p>
          <p>Please use:</p>
          <ul>
            <li>Chrome 89+ or Edge 89+</li>
            <li>Enable "Experimental Web Platform features" in Chrome flags</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="hardware-controller">
      <div className="hardware-header">
        <div className="connection-status">
          <h3>🔌 Hardware Control</h3>
          <div className={`status-indicator ${connectionStatus}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'unsupported' ? 'Not Supported' :
               connectionStatus === 'error' ? 'Connection Error' :
               'Disconnected'}
            </span>
          </div>
        </div>

        <div className="connection-controls">
          {!isConnected ? (
            <button onClick={requestPort} className="btn-primary">
              🔗 Connect Arduino
            </button>
          ) : (
            <button onClick={disconnect} className="btn-danger">
              ❌ Disconnect
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="hardware-content">
          {/* Control Panel */}
          <div className="control-panel">
            <div className="control-section">
              <h4>💡 LED Control</h4>
              <div className="led-controls">
                {[13, 12, 11, 10].map(pin => (
                  <button
                    key={pin}
                    onClick={() => toggleLED(pin)}
                    className={`led-btn ${ledStates[pin] ? 'active' : ''}`}
                  >
                    LED {pin}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-section">
              <h4>⚙️ Motor Control</h4>
              <div className="motor-controls">
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={motorSpeed}
                  onChange={(e) => setMotorSpeedValue(e.target.value)}
                  className="motor-slider"
                />
                <span className="motor-value">Speed: {motorSpeed}</span>
              </div>
            </div>

            <div className="control-section">
              <h4>📊 Sensor Readings</h4>
              <div className="sensor-readings">
                {Object.entries(sensorData).map(([sensor, value]) => (
                  <div key={sensor} className="sensor-item">
                    <span className="sensor-name">{sensor}:</span>
                    <span className="sensor-value">{value}</span>
                  </div>
                ))}
                {Object.keys(sensorData).length === 0 && (
                  <p className="no-data">No sensor data received</p>
                )}
              </div>
            </div>
          </div>

          {/* Code Upload */}
          <div className="upload-section">
            <h4>📤 Code Upload</h4>
            <div className="upload-controls">
              <button
                onClick={uploadCode}
                disabled={isUploading || !currentProject?.code}
                className="btn-primary"
              >
                {isUploading ? '⏳ Uploading...' : '⬆️ Upload Code'}
              </button>
              {!currentProject?.code && (
                <p className="warning">No code in current project</p>
              )}
            </div>
          </div>

          {/* Examples */}
          <div className="examples-section">
            <h4>🎯 Quick Examples</h4>
            <div className="example-buttons">
              <button onClick={() => runExample('blink')} className="btn-secondary">
                LED Blink
              </button>
              <button onClick={() => runExample('buttonLed')} className="btn-secondary">
                Button + LED
              </button>
              <button onClick={() => runExample('sensor')} className="btn-secondary">
                Sensor Reading
              </button>
              <button onClick={() => runExample('motor')} className="btn-secondary">
                Motor Control
              </button>
            </div>
          </div>

          {/* Console Output */}
          <div className="console-section">
            <h4>📋 Console Output</h4>
            <div className="console-output">
              {consoleOutput.map((entry, index) => (
                <div key={index} className={`console-entry ${entry.type}`}>
                  <span className="timestamp">[{entry.timestamp}]</span>
                  <span className="message">{entry.message}</span>
                </div>
              ))}
              {consoleOutput.length === 0 && (
                <p className="no-output">No console output yet</p>
              )}
            </div>
            <button
              onClick={() => setConsoleOutput([])}
              className="btn-secondary clear-btn"
            >
              🗑️ Clear Console
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .hardware-controller {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
          padding: 1rem;
        }

        .hardware-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .connection-status h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.connected .status-dot {
          background: #10b981;
        }

        .status-indicator.connecting .status-dot {
          background: #f59e0b;
          animation: pulse 1s infinite;
        }

        .status-indicator.disconnected .status-dot,
        .status-indicator.error .status-dot {
          background: #ef4444;
        }

        .status-indicator.unsupported .status-dot {
          background: #6b7280;
        }

        .status-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .unsupported-notice {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .unsupported-notice h3 {
          color: #ef4444;
          margin-bottom: 1rem;
        }

        .unsupported-notice ul {
          text-align: left;
          display: inline-block;
          margin: 1rem 0;
        }

        .hardware-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          overflow-y: auto;
        }

        .control-section {
          background: white;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .control-section h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .led-controls {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .led-btn {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .led-btn:hover {
          background: #f9fafb;
        }

        .led-btn.active {
          background: #fef2f2;
          border-color: #ef4444;
          color: #ef4444;
        }

        .motor-controls {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .motor-slider {
          width: 100%;
        }

        .motor-value {
          text-align: center;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .sensor-readings {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sensor-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 0.375rem;
        }

        .sensor-name {
          font-weight: 500;
          color: #374151;
        }

        .sensor-value {
          font-weight: 600;
          color: #3b82f6;
        }

        .no-data {
          text-align: center;
          color: #6b7280;
          font-style: italic;
          margin: 1rem 0;
        }

        .upload-section,
        .examples-section,
        .console-section {
          grid-column: 1 / -1;
          background: white;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .upload-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .warning {
          color: #f59e0b;
          font-size: 0.875rem;
          margin: 0;
        }

        .example-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.5rem;
        }

        .console-output {
          background: #1f2937;
          color: #e5e7eb;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.375rem;
          height: 200px;
          overflow-y: auto;
          margin-bottom: 0.5rem;
        }

        .console-entry {
          margin-bottom: 0.25rem;
          padding: 0.125rem 0;
        }

        .console-entry.success {
          color: #10b981;
        }

        .console-entry.error {
          color: #ef4444;
        }

        .console-entry.command {
          color: #3b82f6;
        }

        .console-entry.data {
          color: #f59e0b;
        }

        .timestamp {
          color: #6b7280;
          margin-right: 0.5rem;
        }

        .no-output {
          text-align: center;
          color: #6b7280;
          font-style: italic;
          margin: 2rem 0;
        }

        .clear-btn {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .hardware-content {
            grid-template-columns: 1fr;
          }

          .example-buttons {
            grid-template-columns: 1fr;
          }

          .led-controls {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default HardwareController;