/**
 * IoT Platform Integration Service
 * Connect embedded projects to major IoT platforms
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class IoTService {
  constructor() {
    this.connections = new Map();
    this.devices = new Map();
    this.platforms = new Map();

    this.initializePlatforms();
  }

  /**
   * Initialize supported IoT platforms
   */
  initializePlatforms() {
    // AWS IoT Core
    this.platforms.set('aws-iot', {
      name: 'AWS IoT Core',
      baseUrl: 'https://iot.us-east-1.amazonaws.com',
      features: ['device shadows', 'rules engine', 'jobs', 'fleet indexing'],
      protocols: ['MQTT', 'HTTP', 'WebSocket'],
      pricing: { freeTier: 250000, pricePerMillion: 1.25 }
    });

    // Google Cloud IoT
    this.platforms.set('google-iot', {
      name: 'Google Cloud IoT',
      baseUrl: 'https://cloudiot.googleapis.com',
      features: ['device manager', 'pub/sub', 'cloud functions', 'bigquery'],
      protocols: ['MQTT', 'HTTP'],
      pricing: { freeTier: 4000000, pricePerMillion: 0.50 }
    });

    // Microsoft Azure IoT Hub
    this.platforms.set('azure-iot', {
      name: 'Azure IoT Hub',
      baseUrl: 'https://management.azure.com',
      features: ['device twins', 'direct methods', 'device streams', 'edge computing'],
      protocols: ['MQTT', 'AMQP', 'HTTP'],
      pricing: { freeTier: 8000, pricePerDay: 0.10 }
    });

    // IBM Watson IoT
    this.platforms.set('ibm-iot', {
      name: 'IBM Watson IoT',
      baseUrl: 'https://internetofthings.ibmcloud.com',
      features: ['device management', 'analytics', 'blockchain', 'edge analytics'],
      protocols: ['MQTT', 'HTTP'],
      pricing: { freeTier: 500000, pricePerMillion: 2.00 }
    });

    // Adafruit IO
    this.platforms.set('adafruit-io', {
      name: 'Adafruit IO',
      baseUrl: 'https://io.adafruit.com',
      features: ['feeds', 'dashboards', 'triggers', 'webhooks'],
      protocols: ['MQTT', 'HTTP', 'WebSocket'],
      pricing: { freeTier: 30, pricePerMonth: 9.95 }
    });

    // Blynk
    this.platforms.set('blynk', {
      name: 'Blynk',
      baseUrl: 'https://blynk.cloud',
      features: ['mobile app', 'web dashboard', 'automations', 'energy monitoring'],
      protocols: ['MQTT', 'WebSocket'],
      pricing: { freeTier: 5, pricePerMonth: 4.99 }
    });

    // ThingsBoard
    this.platforms.set('thingsboard', {
      name: 'ThingsBoard',
      baseUrl: 'https://thingsboard.cloud',
      features: ['device management', 'real-time dashboards', 'rule engine', 'data visualization'],
      protocols: ['MQTT', 'CoAP', 'HTTP'],
      pricing: { freeTier: 10, pricePerMonth: 10.00 }
    });
  }

  /**
   * Connect to IoT platform
   */
  async connectPlatform(platformId, credentials) {
    const platform = this.platforms.get(platformId);
    if (!platform) {
      throw new Error(`Platform ${platformId} not supported`);
    }

    const connectionId = uuidv4();

    try {
      // Test connection
      const isConnected = await this.testConnection(platformId, credentials);

      if (!isConnected) {
        throw new Error('Failed to connect to platform');
      }

      const connection = {
        id: connectionId,
        platformId,
        credentials: this.encryptCredentials(credentials),
        status: 'connected',
        connectedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        devices: [],
        usage: {
          messages: 0,
          dataTransferred: 0,
          uptime: 0
        }
      };

      this.connections.set(connectionId, connection);

      return connection;

    } catch (error) {
      const connection = {
        id: connectionId,
        platformId,
        status: 'failed',
        error: error.message,
        connectedAt: new Date().toISOString()
      };

      this.connections.set(connectionId, connection);
      throw error;
    }
  }

  /**
   * Register device with IoT platform
   */
  async registerDevice(connectionId, deviceData) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const { deviceId, name, type, sensors = [], actuators = [] } = deviceData;
    const platform = this.platforms.get(connection.platformId);

    const device = {
      id: deviceId,
      connectionId,
      name,
      type,
      platform: connection.platformId,
      sensors,
      actuators,
      status: 'registering',
      registeredAt: new Date().toISOString(),
      lastSeen: null,
      telemetry: [],
      configuration: this.generateDeviceConfig(platform, deviceData)
    };

    try {
      // Register device with platform
      const registrationResult = await this.registerWithPlatform(platform, connection, device);

      device.status = 'registered';
      device.registrationResult = registrationResult;
      device.credentials = registrationResult.credentials;

      this.devices.set(deviceId, device);
      connection.devices.push(deviceId);

      return device;

    } catch (error) {
      device.status = 'failed';
      device.error = error.message;
      this.devices.set(deviceId, device);
      throw error;
    }
  }

  /**
   * Send telemetry data
   */
  async sendTelemetry(deviceId, data) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const connection = this.connections.get(device.connectionId);
    const platform = this.platforms.get(connection.platformId);

    const telemetryData = {
      deviceId,
      timestamp: new Date().toISOString(),
      data,
      platform: platform.name
    };

    try {
      // Send to platform
      await this.sendToPlatform(platform, connection, device, telemetryData);

      // Update device telemetry history
      device.telemetry.push(telemetryData);
      if (device.telemetry.length > 100) {
        device.telemetry.shift(); // Keep last 100 readings
      }

      device.lastSeen = telemetryData.timestamp;
      connection.lastActivity = telemetryData.timestamp;
      connection.usage.messages++;
      connection.usage.dataTransferred += JSON.stringify(data).length;

      return { success: true, messageId: uuidv4() };

    } catch (error) {
      console.error('Telemetry send failed:', error);
      throw new Error(`Failed to send telemetry: ${error.message}`);
    }
  }

  /**
   * Receive commands from platform
   */
  async receiveCommands(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const connection = this.connections.get(device.connectionId);
    const platform = this.platforms.get(connection.platformId);

    try {
      const commands = await this.receiveFromPlatform(platform, connection, device);
      return commands;
    } catch (error) {
      console.error('Command receive failed:', error);
      throw new Error(`Failed to receive commands: ${error.message}`);
    }
  }

  /**
   * Create dashboard for device
   */
  async createDashboard(deviceId, dashboardConfig) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const connection = this.connections.get(device.connectionId);
    const platform = this.platforms.get(connection.platformId);

    const dashboard = {
      id: uuidv4(),
      deviceId,
      platform: connection.platformId,
      config: dashboardConfig,
      url: await this.createPlatformDashboard(platform, connection, device, dashboardConfig),
      createdAt: new Date().toISOString()
    };

    device.dashboard = dashboard;

    return dashboard;
  }

  /**
   * Set up device shadows/twins
   */
  async setupDeviceShadow(deviceId, shadowConfig) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    const connection = this.connections.get(device.connectionId);
    const platform = this.platforms.get(connection.platformId);

    const shadow = {
      id: uuidv4(),
      deviceId,
      platform: connection.platformId,
      config: shadowConfig,
      state: {
        reported: {},
        desired: {},
        delta: {}
      },
      createdAt: new Date().toISOString()
    };

    try {
      await this.initializeShadow(platform, connection, device, shadow);
      device.shadow = shadow;
      return shadow;
    } catch (error) {
      console.error('Shadow setup failed:', error);
      throw new Error(`Failed to setup device shadow: ${error.message}`);
    }
  }

  /**
   * Update device shadow
   */
  async updateShadow(deviceId, state) {
    const device = this.devices.get(deviceId);
    if (!device || !device.shadow) {
      throw new Error(`Device shadow not found for ${deviceId}`);
    }

    const connection = this.connections.get(device.connectionId);
    const platform = this.platforms.get(connection.platformId);

    try {
      await this.updatePlatformShadow(platform, connection, device, state);

      device.shadow.state.reported = { ...device.shadow.state.reported, ...state };
      device.shadow.lastUpdated = new Date().toISOString();

      return device.shadow;
    } catch (error) {
      console.error('Shadow update failed:', error);
      throw new Error(`Failed to update shadow: ${error.message}`);
    }
  }

  /**
   * Get device shadow
   */
  async getShadow(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device || !device.shadow) {
      throw new Error(`Device shadow not found for ${deviceId}`);
    }

    const connection = this.connections.get(device.connectionId);
    const platform = this.platforms.get(connection.platformId);

    try {
      const shadowState = await this.getPlatformShadow(platform, connection, device);
      device.shadow.state = shadowState;
      return device.shadow;
    } catch (error) {
      console.error('Shadow get failed:', error);
      throw new Error(`Failed to get shadow: ${error.message}`);
    }
  }

  // Platform-specific implementations

  async testConnection(platformId, credentials) {
    // Mock connection test - in real implementation, test actual API endpoints
    return Math.random() > 0.1; // 90% success rate
  }

  async registerWithPlatform(platform, connection, device) {
    // Mock device registration
    return {
      credentials: {
        clientId: device.id,
        username: `device_${device.id}`,
        password: uuidv4(),
        endpoint: platform.baseUrl
      },
      certificates: {
        deviceCert: 'mock_device_cert',
        privateKey: 'mock_private_key',
        caCert: 'mock_ca_cert'
      }
    };
  }

  async sendToPlatform(platform, connection, device, data) {
    // Mock telemetry send
    console.log(`Sending telemetry to ${platform.name}:`, data);
  }

  async receiveFromPlatform(platform, connection, device) {
    // Mock command receive
    return [
      {
        id: uuidv4(),
        command: 'set_led',
        parameters: { state: 'on' },
        timestamp: new Date().toISOString()
      }
    ];
  }

  async createPlatformDashboard(platform, connection, device, config) {
    // Mock dashboard creation
    return `https://${platform.baseUrl.replace('https://', '')}/dashboard/${device.id}`;
  }

  async initializeShadow(platform, connection, device, shadow) {
    // Mock shadow initialization
    console.log(`Initializing shadow for ${device.id} on ${platform.name}`);
  }

  async updatePlatformShadow(platform, connection, device, state) {
    // Mock shadow update
    console.log(`Updating shadow for ${device.id}:`, state);
  }

  async getPlatformShadow(platform, connection, device) {
    // Mock shadow get
    return {
      reported: { temperature: 25, humidity: 60 },
      desired: { led_state: 'on' },
      delta: {}
    };
  }

  generateDeviceConfig(platform, deviceData) {
    return {
      platform: platform.name,
      protocols: platform.protocols,
      security: {
        tls: true,
        certificates: true,
        authentication: 'certificate'
      },
      qos: 1,
      keepAlive: 60,
      reconnectDelay: 5000
    };
  }

  encryptCredentials(credentials) {
    // Mock encryption - in real implementation, use proper encryption
    return Buffer.from(JSON.stringify(credentials)).toString('base64');
  }

  decryptCredentials(encryptedCredentials) {
    // Mock decryption
    return JSON.parse(Buffer.from(encryptedCredentials, 'base64').toString());
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  /**
   * Get all connections
   */
  getAllConnections() {
    return Array.from(this.connections.values());
  }

  /**
   * Get all devices
   */
  getAllDevices() {
    return Array.from(this.devices.values());
  }

  /**
   * Get platform by ID
   */
  getPlatform(platformId) {
    return this.platforms.get(platformId);
  }

  /**
   * Get all platforms
   */
  getAllPlatforms() {
    return Array.from(this.platforms.values());
  }

  /**
   * Disconnect from platform
   */
  async disconnectPlatform(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      // Disconnect devices
      for (const deviceId of connection.devices) {
        const device = this.devices.get(deviceId);
        if (device) {
          device.status = 'disconnected';
        }
      }

      connection.status = 'disconnected';
      connection.disconnectedAt = new Date().toISOString();

    } catch (error) {
      console.error('Platform disconnect failed:', error);
    }
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) return;

    const connection = this.connections.get(device.connectionId);
    if (connection) {
      connection.devices = connection.devices.filter(id => id !== deviceId);
    }

    this.devices.delete(deviceId);
  }
}

module.exports = new IoTService();