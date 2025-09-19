/**
 * Hardware Service Tests
 * Tests for WebSerial API integration and device communication
 */

const HardwareService = require('../services/hardwareService');

describe('HardwareService', () => {
  let hardwareService;

  beforeEach(() => {
    hardwareService = new HardwareService();
  });

  describe('Device Connection', () => {
    test('should initialize with empty device map', () => {
      expect(hardwareService.connectedDevices.size).toBe(0);
      expect(hardwareService.deviceBuffers.size).toBe(0);
    });

    test('should support Arduino Uno board type', () => {
      const boardConfig = hardwareService.supportedBoards['arduino-uno'];
      expect(boardConfig).toBeDefined();
      expect(boardConfig.name).toBe('Arduino Uno');
      expect(boardConfig.vid).toBe(0x2341);
      expect(boardConfig.defaultBaudRate).toBe(9600);
    });

    test('should support ESP32 board type', () => {
      const boardConfig = hardwareService.supportedBoards['esp32'];
      expect(boardConfig).toBeDefined();
      expect(boardConfig.name).toBe('ESP32');
      expect(boardConfig.vid).toBe(0x10c4);
      expect(boardConfig.defaultBaudRate).toBe(115200);
    });

    test('should initialize pins correctly for Arduino Uno', () => {
      const pins = hardwareService.initializePins('arduino-uno');
      expect(Object.keys(pins)).toHaveLength(20);
      expect(pins[0]).toEqual({
        mode: 'INPUT',
        value: 0,
        pwm: false,
        analog: false,
        connected: false
      });
      expect(pins[13]).toEqual({
        mode: 'INPUT',
        value: 0,
        pwm: false,
        analog: false,
        connected: false
      });
      expect(pins[14]).toEqual({
        mode: 'INPUT',
        value: 0,
        pwm: false,
        analog: true,
        connected: false
      });
    });

    test('should initialize pins correctly for ESP32', () => {
      const pins = hardwareService.initializePins('esp32');
      expect(Object.keys(pins)).toHaveLength(40);
      expect(pins[0].analog).toBe(false);
      expect(pins[34].analog).toBe(true);
    });
  });

  describe('Device Management', () => {
    test('should return empty device list when no devices connected', () => {
      const devices = hardwareService.getConnectedDevices();
      expect(devices).toEqual([]);
    });

    test('should return empty device status for non-existent device', () => {
      const status = hardwareService.getDeviceStatus('non-existent-device');
      expect(status).toEqual({
        connected: false,
        error: 'Device not found'
      });
    });

    test('should return supported board types', () => {
      const boards = Object.keys(hardwareService.supportedBoards).map(key => ({
        type: key,
        ...hardwareService.supportedBoards[key]
      }));

      expect(boards.length).toBeGreaterThan(0);
      expect(boards[0]).toHaveProperty('type');
      expect(boards[0]).toHaveProperty('name');
      expect(boards[0]).toHaveProperty('vid');
      expect(boards[0]).toHaveProperty('defaultBaudRate');
    });
  });

  describe('Data Processing', () => {
    test('should parse JSON device messages correctly', () => {
      const deviceId = 'test-device';
      const testMessage = JSON.stringify({
        type: 'sensor',
        pin: 'A0',
        value: 512
      });

      // Mock device
      hardwareService.connectedDevices.set(deviceId, {
        id: deviceId,
        connected: true,
        sensors: {},
        pins: hardwareService.initializePins('arduino-uno')
      });

      // Process message
      hardwareService.parseDeviceMessage(deviceId, testMessage);

      const device = hardwareService.connectedDevices.get(deviceId);
      expect(device.sensors['A0']).toEqual({
        value: 512,
        unit: undefined,
        timestamp: expect.any(Number)
      });
    });

    test('should handle pin state messages', () => {
      const deviceId = 'test-device';
      const testMessage = JSON.stringify({
        type: 'pin_state',
        pin: 13,
        value: 1
      });

      // Mock device
      hardwareService.connectedDevices.set(deviceId, {
        id: deviceId,
        connected: true,
        pins: hardwareService.initializePins('arduino-uno')
      });

      // Process message
      hardwareService.parseDeviceMessage(deviceId, testMessage);

      const device = hardwareService.connectedDevices.get(deviceId);
      expect(device.pins[13].value).toBe(1);
    });

    test('should handle analog read messages', () => {
      const deviceId = 'test-device';
      const testMessage = JSON.stringify({
        type: 'analog_read',
        pin: 14,
        value: 768
      });

      // Mock device
      hardwareService.connectedDevices.set(deviceId, {
        id: deviceId,
        connected: true,
        pins: hardwareService.initializePins('arduino-uno')
      });

      // Process message
      hardwareService.parseDeviceMessage(deviceId, testMessage);

      const device = hardwareService.connectedDevices.get(deviceId);
      expect(device.pins[14].analogValue).toBe(768);
    });

    test('should handle plain text messages', () => {
      const deviceId = 'test-device';

      // Mock device
      hardwareService.connectedDevices.set(deviceId, {
        id: deviceId,
        connected: true,
        lastSensorValue: 0
      });

      // Process numeric message
      hardwareService.parseDeviceMessage(deviceId, '456');

      const device = hardwareService.connectedDevices.get(deviceId);
      expect(device.lastSensorValue).toBe(456);
    });
  });

  describe('Command Generation', () => {
    test('should generate correct pin mode command', () => {
      const deviceId = 'test-device';

      // Mock device
      hardwareService.connectedDevices.set(deviceId, {
        id: deviceId,
        connected: true,
        pins: hardwareService.initializePins('arduino-uno')
      });

      // Test pin mode setting
      hardwareService.setPinMode(deviceId, 13, 'OUTPUT');

      const device = hardwareService.connectedDevices.get(deviceId);
      expect(device.pins[13].mode).toBe('OUTPUT');
    });

    test('should generate correct digital write command', () => {
      const deviceId = 'test-device';

      // Mock device
      hardwareService.connectedDevices.set(deviceId, {
        id: deviceId,
        connected: true,
        pins: hardwareService.initializePins('arduino-uno')
      });

      // Test digital write
      hardwareService.digitalWrite(deviceId, 13, true);

      const device = hardwareService.connectedDevices.get(deviceId);
      expect(device.pins[13].value).toBe(1);
    });

    test('should generate correct analog write command', () => {
      const deviceId = 'test-device';

      // Mock device
      hardwareService.connectedDevices.set(deviceId, {
        id: deviceId,
        connected: true,
        pins: hardwareService.initializePins('arduino-uno')
      });

      // Test analog write
      hardwareService.analogWrite(deviceId, 9, 128);

      const device = hardwareService.connectedDevices.get(deviceId);
      expect(device.pins[9].value).toBe(128);
      expect(device.pins[9].pwm).toBe(true);
    });

    test('should clamp analog values to valid range', () => {
      const deviceId = 'test-device';

      // Mock device
      hardwareService.connectedDevices.set(deviceId, {
        id: deviceId,
        connected: true,
        pins: hardwareService.initializePins('arduino-uno')
      });

      // Test value clamping
      hardwareService.analogWrite(deviceId, 9, 300); // Above max

      const device = hardwareService.connectedDevices.get(deviceId);
      expect(device.pins[9].value).toBe(255); // Should be clamped to max

      hardwareService.analogWrite(deviceId, 9, -50); // Below min

      expect(device.pins[9].value).toBe(0); // Should be clamped to min
    });
  });

  describe('Device Metrics', () => {
    test('should return null metrics for non-existent device', async () => {
      const metrics = await hardwareService.getDeviceMetrics('non-existent-device');
      expect(metrics).toBeNull();
    });

    test('should return device metrics for connected device', async () => {
      const deviceId = 'test-device';

      // Mock device
      hardwareService.connectedDevices.set(deviceId, {
        id: deviceId,
        connected: true,
        lastActivity: Date.now() - 5000, // 5 seconds ago
        memoryUsage: 45,
        cpuUsage: 12,
        temperature: 28,
        voltage: 5.1,
        currentDraw: 85
      });

      const metrics = await hardwareService.getDeviceMetrics(deviceId);

      expect(metrics).toEqual({
        uptime: expect.any(Number),
        memoryUsage: 45,
        cpuUsage: 12,
        temperature: 28,
        voltage: 5.1,
        currentDraw: 85
      });
      expect(metrics.uptime).toBeGreaterThan(4000); // At least 4 seconds
    });
  });

  describe('Cleanup', () => {
    test('should clean up all devices and buffers', () => {
      // Add mock devices
      hardwareService.connectedDevices.set('device1', { id: 'device1' });
      hardwareService.connectedDevices.set('device2', { id: 'device2' });
      hardwareService.deviceBuffers.set('device1', 'buffer1');
      hardwareService.deviceBuffers.set('device2', 'buffer2');

      // Verify devices exist
      expect(hardwareService.connectedDevices.size).toBe(2);
      expect(hardwareService.deviceBuffers.size).toBe(2);

      // Clean up
      hardwareService.cleanup();

      // Verify cleanup
      expect(hardwareService.connectedDevices.size).toBe(0);
      expect(hardwareService.deviceBuffers.size).toBe(0);
    });
  });
});