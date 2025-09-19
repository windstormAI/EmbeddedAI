/**
 * Hardware Connector Component
 * WebSerial API integration for direct hardware communication
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
  import {
    Usb,
    Wifi,
    Bluetooth,
    Zap,
    Play,
    Pause,
    RotateCcw,
    Download,
    Upload,
    Monitor,
    Cpu,
    Settings,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info,
    Terminal,
    Activity
  } from 'lucide-react';

  const HardwareConnector = ({ onHardwareData, onCodeUpload }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionType, setConnectionType] = useState(null); // 'serial', 'wifi', 'bluetooth'
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [port, setPort] = useState(null);
    const [isReading, setIsReading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [sensorData, setSensorData] = useState({});
    const [commandHistory, setCommandHistory] = useState([]);
    const [currentCommand, setCurrentCommand] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error

    const logsEndRef = useRef(null);
    const readerRef = useRef(null);
    const writerRef = useRef(null);

    // Auto-scroll logs
    useEffect(() => {
      if (autoScroll && logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [logs, autoScroll]);

    // Add log entry
    const addLog = useCallback((message, type = 'info') => {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = {
        id: Date.now(),
        timestamp,
        message,
        type
      };

      setLogs(prev => {
        const newLogs = [...prev, logEntry];
        // Keep only last 100 logs
        return newLogs.length > 100 ? newLogs.slice(-100) : newLogs;
      });
    }, []);

    // Check WebSerial API support
    const checkWebSerialSupport = () => {
      if (!('serial' in navigator)) {
        addLog('WebSerial API not supported in this browser', 'error');
        addLog('Please use Chrome 85+, Edge 85+, or Opera 71+', 'warning');
        return false;
      }
      addLog('WebSerial API supported', 'success');
      return true;
    };

    // Connect to serial device
    const connectSerial = async () => {
      if (!checkWebSerialSupport()) return;

      try {
        setConnectionStatus('connecting');
        addLog('Requesting serial port access...', 'info');

        const selectedPort = await navigator.serial.requestPort();
        setPort(selectedPort);

        // Open port with specific settings
        await selectedPort.open({
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none'
        });

        setIsConnected(true);
        setConnectionType('serial');
        setConnectionStatus('connected');

        // Get device info
        const info = await selectedPort.getInfo();
        setDeviceInfo({
          usbVendorId: info.usbVendorId,
          usbProductId: info.usbProductId,
          deviceName: getDeviceName(info.usbVendorId, info.usbProductId)
        });

        addLog(`Connected to ${getDeviceName(info.usbVendorId, info.usbProductId)}`, 'success');
        addLog('Serial connection established at 9600 baud', 'info');

        // Start reading data
        startReading();

      } catch (error) {
        setConnectionStatus('error');
        addLog(`Connection failed: ${error.message}`, 'error');
        console.error('Serial connection error:', error);
      }
    };

    // Get device name from USB IDs
    const getDeviceName = (vendorId, productId) => {
      // Arduino devices
      if (vendorId === 0x2341) { // Arduino
        switch (productId) {
          case 0x0043: return 'Arduino Uno';
          case 0x0001: return 'Arduino Mega';
          case 0x0036: return 'Arduino Leonardo';
          case 0x0037: return 'Arduino Micro';
          case 0x0038: return 'Arduino Robot Control';
          case 0x0039: return 'Arduino Robot Motor';
          case 0x0042: return 'Arduino Mega ADK';
          case 0x0044: return 'Arduino Mega 2560';
          case 0x8036: return 'Arduino Leonardo (bootloader)';
          case 0x8037: return 'Arduino Micro (bootloader)';
          default: return 'Arduino Device';
        }
      }

      // ESP32 devices
      if (vendorId === 0x10C4) { // Silicon Labs (common ESP32)
        return 'ESP32 Device';
      }

      return `USB Device (${vendorId.toString(16)}:${productId.toString(16)})`;
    };

    // Start reading serial data
    const startReading = async () => {
      if (!port) return;

      try {
        setIsReading(true);
        addLog('Starting data reading...', 'info');

        while (port.readable) {
          const reader = port.readable.getReader();
          readerRef.current = reader;

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;

              // Process incoming data
              const data = new TextDecoder().decode(value);
              processIncomingData(data);
            }
          } catch (error) {
            addLog(`Read error: ${error.message}`, 'error');
          } finally {
            reader.releaseLock();
          }
        }
      } catch (error) {
        addLog(`Reading failed: ${error.message}`, 'error');
        setIsReading(false);
      }
    };

    // Process incoming serial data
    const processIncomingData = (data) => {
      addLog(`Received: ${data.trim()}`, 'data');

      // Parse sensor data (assuming Arduino sends data in format: "temp:25.5,humidity:60")
      const dataParts = data.trim().split(',');
      const newSensorData = { ...sensorData };

      dataParts.forEach(part => {
        const [key, value] = part.split(':');
        if (key && value) {
          newSensorData[key.trim()] = parseFloat(value.trim()) || value.trim();
        }
      });

      setSensorData(newSensorData);

      // Send data to parent component
      if (onHardwareData) {
        onHardwareData({
          type: 'serial',
          data: newSensorData,
          raw: data.trim(),
          timestamp: new Date().toISOString()
        });
      }
    };

    // Send command to device
    const sendCommand = async (command) => {
      if (!port || !port.writable) {
        addLog('No writable port available', 'error');
        return;
      }

      try {
        const writer = port.writable.getWriter();
        writerRef.current = writer;

        const data = new TextEncoder().encode(command + '\n');
        await writer.write(data);

        addLog(`Sent: ${command}`, 'command');
        setCommandHistory(prev => [...prev.slice(-9), command]); // Keep last 10

      } catch (error) {
        addLog(`Send failed: ${error.message}`, 'error');
      } finally {
        if (writerRef.current) {
          writerRef.current.releaseLock();
        }
      }
    };

    // Disconnect from device
    const disconnect = async () => {
      try {
        if (readerRef.current) {
          await readerRef.current.cancel();
          readerRef.current.releaseLock();
        }

        if (writerRef.current) {
          writerRef.current.releaseLock();
        }

        if (port) {
          await port.close();
        }

        setIsConnected(false);
        setConnectionType(null);
        setDeviceInfo(null);
        setPort(null);
        setIsReading(false);
        setConnectionStatus('disconnected');

        addLog('Disconnected from device', 'info');

      } catch (error) {
        addLog(`Disconnect error: ${error.message}`, 'error');
      }
    };

    // Upload code to device (Arduino)
    const uploadCode = async (code) => {
      if (!isConnected || connectionType !== 'serial') {
        addLog('No serial connection available for upload', 'error');
        return;
      }

      try {
        addLog('Preparing code for upload...', 'info');

        // In a real implementation, this would:
        // 1. Compile the Arduino code
        // 2. Convert to hex format
        // 3. Use avrdude or similar to upload
        // 4. Send reset command to device

        addLog('Code upload not implemented in demo', 'warning');
        addLog('In production, this would compile and upload Arduino code', 'info');

        if (onCodeUpload) {
          onCodeUpload({
            success: false,
            message: 'Upload simulation - not implemented in demo'
          });
        }

      } catch (error) {
        addLog(`Upload failed: ${error.message}`, 'error');
        if (onCodeUpload) {
          onCodeUpload({
            success: false,
            message: error.message
          });
        }
      }
    };

    // Handle command input
    const handleCommandSubmit = (e) => {
      e.preventDefault();
      if (currentCommand.trim()) {
        sendCommand(currentCommand.trim());
        setCurrentCommand('');
      }
    };

    // Clear logs
    const clearLogs = () => {
      setLogs([]);
    };

    // Connection status indicator
    const getStatusIndicator = () => {
      switch (connectionStatus) {
        case 'connected':
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'connecting':
          return <Activity className="h-5 w-5 text-yellow-500 animate-pulse" />;
        case 'error':
          return <XCircle className="h-5 w-5 text-red-500" />;
        default:
          return <XCircle className="h-5 w-5 text-gray-400" />;
      }
    };

    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Hardware Connector</h2>
              <div className="flex items-center space-x-2">
                {getStatusIndicator()}
                <span className={`text-sm font-medium ${
                  connectionStatus === 'connected' ? 'text-green-600' :
                  connectionStatus === 'connecting' ? 'text-yellow-600' :
                  connectionStatus === 'error' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   connectionStatus === 'error' ? 'Connection Error' :
                   'Disconnected'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!isConnected ? (
                <button
                  onClick={connectSerial}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center space-x-2"
                >
                  <Usb className="h-4 w-4" />
                  <span>Connect Device</span>
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Disconnect</span>
                </button>
              )}

              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-3 py-2 rounded-lg font-medium ${
                  autoScroll ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                Auto-scroll {autoScroll ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Device Info */}
          {deviceInfo && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">{deviceInfo.deviceName}</div>
                  <div className="text-sm text-blue-700">
                    VID: {deviceInfo.usbVendorId?.toString(16)}, PID: {deviceInfo.usbProductId?.toString(16)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="w-80 border-r border-gray-200 bg-white p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Controls</h3>

            {/* Connection Options */}
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Connection Type</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={connectSerial}
                    disabled={isConnected}
                    className={`p-3 border rounded-lg flex flex-col items-center space-y-1 ${
                      connectionType === 'serial'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Usb className="h-5 w-5" />
                    <span className="text-xs">USB Serial</span>
                  </button>

                  <button
                    disabled
                    className="p-3 border border-gray-300 rounded-lg flex flex-col items-center space-y-1 opacity-50 cursor-not-allowed"
                    title="WiFi connection - Coming soon"
                  >
                    <Wifi className="h-5 w-5" />
                    <span className="text-xs">WiFi</span>
                  </button>

                  <button
                    disabled
                    className="p-3 border border-gray-300 rounded-lg flex flex-col items-center space-y-1 opacity-50 cursor-not-allowed"
                    title="Bluetooth connection - Coming soon"
                  >
                    <Bluetooth className="h-5 w-5" />
                    <span className="text-xs">Bluetooth</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sensor Data Display */}
            {Object.keys(sensorData).length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Sensor Data</h4>
                <div className="space-y-2">
                  {Object.entries(sensorData).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">{key}:</span>
                      <span className="text-sm text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device Actions */}
            {isConnected && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Device Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => sendCommand('ping')}
                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium"
                  >
                    Ping Device
                  </button>

                  <button
                    onClick={() => sendCommand('reset')}
                    className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded font-medium"
                  >
                    Reset Device
                  </button>

                  <button
                    onClick={() => sendCommand('status')}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium"
                  >
                    Get Status
                  </button>
                </div>
              </div>
            )}

            {/* Browser Support Check */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Browser Support</div>
                  <div className="text-gray-600 mt-1">
                    {navigator.serial ? (
                      '✅ WebSerial API supported'
                    ) : (
                      <>
                        ❌ WebSerial API not supported
                        <br />
                        <span className="text-xs">Use Chrome 85+, Edge 85+, or Opera 71+</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Terminal/Command Interface */}
          <div className="flex-1 bg-gray-900 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Terminal className="h-5 w-5" />
                <span>Device Terminal</span>
              </h3>

              <button
                onClick={clearLogs}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
              >
                Clear Logs
              </button>
            </div>

            {/* Command Input */}
            <form onSubmit={handleCommandSubmit} className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  placeholder="Enter command to send to device..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!isConnected || !currentCommand.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium"
                >
                  Send
                </button>
              </div>
            </form>

            {/* Command History */}
            {commandHistory.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Recent Commands:</div>
                <div className="flex flex-wrap gap-2">
                  {commandHistory.map((cmd, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCommand(cmd)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Logs Display */}
            <div className="flex-1 bg-black rounded-lg p-4 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500 italic">
                  {isConnected ? 'Waiting for device data...' : 'Connect a device to see logs'}
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="mb-1">
                    <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                    <span className={`${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warning' ? 'text-yellow-400' :
                      log.type === 'success' ? 'text-green-400' :
                      log.type === 'command' ? 'text-blue-400' :
                      log.type === 'data' ? 'text-purple-400' :
                      'text-gray-300'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Right Panel - Device Info & Stats */}
          <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Information</h3>

            {deviceInfo ? (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Device Name</div>
                  <div className="font-medium text-gray-900">{deviceInfo.deviceName}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">USB Vendor ID</div>
                  <div className="font-mono text-sm text-gray-900">
                    0x{deviceInfo.usbVendorId?.toString(16).toUpperCase()}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">USB Product ID</div>
                  <div className="font-mono text-sm text-gray-900">
                    0x{deviceInfo.usbProductId?.toString(16).toUpperCase()}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Connection Type</div>
                  <div className="font-medium text-gray-900 capitalize">{connectionType}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="flex items-center space-x-2">
                    {isReading ? (
                      <>
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">Reading Data</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Idle</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Usb className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">No device connected</p>
                <p className="text-xs text-gray-400 mt-1">
                  Connect a device to see information
                </p>
              </div>
            )}

            {/* Connection Instructions */}
            {!isConnected && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">How to Connect</div>
                    <ol className="text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                      <li>Click "Connect Device"</li>
                      <li>Select your Arduino/ESP32</li>
                      <li>Choose the correct port</li>
                      <li>Device will be ready for communication</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Troubleshooting */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-900">Troubleshooting</div>
                  <ul className="text-yellow-800 mt-2 space-y-1 text-xs">
                    <li>• Ensure device drivers are installed</li>
                    <li>• Try different USB ports</li>
                    <li>• Restart device if not responding</li>
                    <li>• Check device power supply</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default HardwareConnector;