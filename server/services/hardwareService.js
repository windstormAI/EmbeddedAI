/**
 * Hardware Communication Service
 * WebSerial API integration for real Arduino/ESP32 device communication
 */

class HardwareService {
  constructor() {
    this.connectedDevices = new Map();
    this.deviceBuffers = new Map();
    this.supportedBoards = {
      'arduino-uno': {
        vid: 0x2341,
        pid: [0x0043, 0x0001],
        name: 'Arduino Uno',
        defaultBaudRate: 9600
      },
      'arduino-mega': {
        vid: 0x2341,
        pid: [0x0010, 0x0042],
        name: 'Arduino Mega',
        defaultBaudRate: 9600
      },
      'esp32': {
        vid: 0x10c4,
        pid: [0xea60],
        name: 'ESP32',
        defaultBaudRate: 115200
      },
      'esp8266': {
        vid: 0x10c4,
        pid: [0xea60],
        name: 'ESP8266',
        defaultBaudRate: 115200
      }
    };
  }

  /**
   * Request connection to a hardware device
   */
  async connectDevice(boardType = 'arduino-uno') {
    try {
      if (!navigator.serial) {
        throw new Error('WebSerial API not supported in this browser');
      }

      const boardConfig = this.supportedBoards[boardType];
      if (!boardConfig) {
        throw new Error(`Unsupported board type: ${boardType}`);
      }

      // Request a port
      const port = await navigator.serial.requestPort({
        filters: [{
          usbVendorId: boardConfig.vid,
          usbProductId: boardConfig.pid[0]
        }]
      });

      // Open the port
      await port.open({
        baudRate: boardConfig.defaultBaudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      const deviceId = `device_${Date.now()}`;
      const device = {
        id: deviceId,
        port,
        boardType,
        config: boardConfig,
        connected: true,
        lastActivity: Date.now(),
        buffer: '',
        pins: this.initializePins(boardType),
        sensors: {},
        actuators: {}
      };

      this.connectedDevices.set(deviceId, device);
      this.deviceBuffers.set(deviceId, '');

      // Start reading from the device
      this.startReading(deviceId);

      return {
        success: true,
        deviceId,
        boardType: boardConfig.name,
        message: `Connected to ${boardConfig.name}`
      };

    } catch (error) {
      console.error('Hardware connection failed:', error);
      throw new Error(`Failed to connect to ${boardType}: ${error.message}`);
    }
  }

  /**
   * Disconnect from a hardware device
   */
  async disconnectDevice(deviceId) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    try {
      await device.port.close();
      this.connectedDevices.delete(deviceId);
      this.deviceBuffers.delete(deviceId);

      return {
        success: true,
        message: 'Device disconnected successfully'
      };
    } catch (error) {
      console.error('Hardware disconnection failed:', error);
      throw new Error(`Failed to disconnect device: ${error.message}`);
    }
  }

  /**
   * Initialize pin states for a board
   */
  initializePins(boardType) {
    const pins = {};
    let pinCount = 0;

    switch (boardType) {
      case 'arduino-uno':
        pinCount = 20;
        break;
      case 'arduino-mega':
        pinCount = 54;
        break;
      case 'esp32':
        pinCount = 40;
        break;
      case 'esp8266':
        pinCount = 17;
        break;
      default:
        pinCount = 20;
    }

    for (let i = 0; i < pinCount; i++) {
      pins[i] = {
        mode: 'INPUT',
        value: 0,
        pwm: false,
        analog: i >= 14, // Analog pins start from A0 (pin 14 on Uno)
        connected: false
      };
    }

    return pins;
  }

  /**
   * Start reading data from the device
   */
  async startReading(deviceId) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return;

    try {
      const reader = device.port.readable.getReader();
      const decoder = new TextDecoder();

      while (device.connected) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        this.processIncomingData(deviceId, chunk);
      }

      reader.releaseLock();
    } catch (error) {
      console.error('Error reading from device:', error);
      device.connected = false;
    }
  }

  /**
   * Process incoming data from device
   */
  processIncomingData(deviceId, data) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return;

    // Add to buffer
    const buffer = this.deviceBuffers.get(deviceId) + data;
    this.deviceBuffers.set(deviceId, buffer);

    // Process complete messages (assuming newline-delimited)
    const lines = buffer.split('\n');
    if (lines.length > 1) {
      // Keep the last incomplete line in buffer
      this.deviceBuffers.set(deviceId, lines[lines.length - 1]);

      // Process complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        this.parseDeviceMessage(deviceId, lines[i].trim());
      }
    }

    device.lastActivity = Date.now();
  }

  /**
   * Parse messages from the device
   */
  parseDeviceMessage(deviceId, message) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return;

    try {
      // Try to parse as JSON first
      const data = JSON.parse(message);
      this.handleDeviceData(deviceId, data);
    } catch (e) {
      // Handle plain text messages
      this.handlePlainTextMessage(deviceId, message);
    }
  }

  /**
   * Handle structured data from device
   */
  handleDeviceData(deviceId, data) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return;

    if (data.type === 'sensor') {
      device.sensors[data.pin] = {
        value: data.value,
        unit: data.unit,
        timestamp: Date.now()
      };
    } else if (data.type === 'pin_state') {
      if (device.pins[data.pin]) {
        device.pins[data.pin].value = data.value;
      }
    } else if (data.type === 'analog_read') {
      if (device.pins[data.pin]) {
        device.pins[data.pin].analogValue = data.value;
      }
    }
  }

  /**
   * Handle plain text messages
   */
  handlePlainTextMessage(deviceId, message) {
    // Handle common Arduino serial messages
    if (message.includes('Ready') || message.includes('Setup complete')) {
      console.log(`Device ${deviceId}: ${message}`);
    } else if (message.match(/^\d+$/)) {
      // Numeric value, assume it's sensor data
      const device = this.connectedDevices.get(deviceId);
      if (device) {
        device.lastSensorValue = parseInt(message);
      }
    }
  }

  /**
   * Send command to device
   */
  async sendCommand(deviceId, command, params = {}) {
    const device = this.connectedDevices.get(deviceId);
    if (!device || !device.connected) {
      throw new Error('Device not connected');
    }

    try {
      const writer = device.port.writable.getWriter();
      const encoder = new TextEncoder();

      let message;
      if (typeof command === 'string') {
        message = command + '\n';
      } else {
        message = JSON.stringify({ ...command, ...params }) + '\n';
      }

      await writer.write(encoder.encode(message));
      writer.releaseLock();

      return { success: true, message: 'Command sent successfully' };
    } catch (error) {
      console.error('Failed to send command:', error);
      throw new Error(`Failed to send command: ${error.message}`);
    }
  }

  /**
   * Configure pin mode
   */
  async setPinMode(deviceId, pin, mode) {
    const validModes = ['INPUT', 'OUTPUT', 'INPUT_PULLUP'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid pin mode: ${mode}`);
    }

    const device = this.connectedDevices.get(deviceId);
    if (device && device.pins[pin]) {
      device.pins[pin].mode = mode;
    }

    return this.sendCommand(deviceId, {
      type: 'pin_mode',
      pin: parseInt(pin),
      mode
    });
  }

  /**
   * Write digital value to pin
   */
  async digitalWrite(deviceId, pin, value) {
    const device = this.connectedDevices.get(deviceId);
    if (device && device.pins[pin]) {
      device.pins[pin].value = value ? 1 : 0;
    }

    return this.sendCommand(deviceId, {
      type: 'digital_write',
      pin: parseInt(pin),
      value: value ? 1 : 0
    });
  }

  /**
   * Write analog value to pin (PWM)
   */
  async analogWrite(deviceId, pin, value) {
    const clampedValue = Math.max(0, Math.min(255, value));

    const device = this.connectedDevices.get(deviceId);
    if (device && device.pins[pin]) {
      device.pins[pin].value = clampedValue;
      device.pins[pin].pwm = true;
    }

    return this.sendCommand(deviceId, {
      type: 'analog_write',
      pin: parseInt(pin),
      value: clampedValue
    });
  }

  /**
   * Read digital value from pin
   */
  async digitalRead(deviceId, pin) {
    const result = await this.sendCommand(deviceId, {
      type: 'digital_read',
      pin: parseInt(pin)
    });

    // The response will come asynchronously through the data stream
    return result;
  }

  /**
   * Read analog value from pin
   */
  async analogRead(deviceId, pin) {
    const result = await this.sendCommand(deviceId, {
      type: 'analog_read',
      pin: parseInt(pin)
    });

    return result;
  }

  /**
   * Get device status
   */
  getDeviceStatus(deviceId) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      return { connected: false, error: 'Device not found' };
    }

    return {
      connected: device.connected,
      boardType: device.boardType,
      lastActivity: device.lastActivity,
      pins: device.pins,
      sensors: device.sensors,
      actuators: device.actuators,
      uptime: Date.now() - device.lastActivity
    };
  }

  /**
   * Get all connected devices
   */
  getConnectedDevices() {
    const devices = [];
    for (const [deviceId, device] of this.connectedDevices) {
      devices.push({
        id: deviceId,
        boardType: device.boardType,
        connected: device.connected,
        lastActivity: device.lastActivity
      });
    }
    return devices;
  }

  /**
   * Upload code to device
   */
  async uploadCode(deviceId, code, boardType) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    // This would integrate with a compiler service
    // For now, just send the code as-is
    return this.sendCommand(deviceId, {
      type: 'upload_code',
      code,
      boardType
    });
  }

  /**
   * Monitor device performance
   */
  async getDeviceMetrics(deviceId) {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      return null;
    }

    return {
      uptime: Date.now() - device.lastActivity,
      memoryUsage: device.memoryUsage || 0,
      cpuUsage: device.cpuUsage || 0,
      temperature: device.temperature || 25,
      voltage: device.voltage || 5.0,
      currentDraw: device.currentDraw || 50
    };
  }

  /**
   * Clean up all connections
   */
  async cleanup() {
    for (const [deviceId, device] of this.connectedDevices) {
      try {
        await device.port.close();
      } catch (error) {
        console.error(`Error closing device ${deviceId}:`, error);
      }
    }

    this.connectedDevices.clear();
    this.deviceBuffers.clear();
  }
}

module.exports = new HardwareService();