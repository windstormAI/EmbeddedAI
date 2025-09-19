/**
 * Integration Service Layer
 * Manages all external tool integrations for the AI-Embedded platform
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');

class IntegrationService {
  constructor() {
    this.integrations = new Map();
    this.activeProcesses = new Map();
    this.cache = new Map();

    // Initialize integration configurations
    this.initIntegrations();
  }

  /**
   * Initialize all integration configurations
   */
  initIntegrations() {
    this.integrations.set('circuitjs', {
      name: 'CircuitJS',
      type: 'simulation',
      path: path.join(__dirname, '../../integrations/circuitjs'),
      config: {
        version: '2.8.0',
        port: 8080,
        timeout: 30000
      }
    });

    this.integrations.set('platformio', {
      name: 'PlatformIO',
      type: 'build',
      path: path.join(__dirname, '../../integrations/platformio'),
      config: {
        version: '6.1.0',
        timeout: 60000
      }
    });

    this.integrations.set('openocd', {
      name: 'OpenOCD',
      type: 'debugging',
      path: path.join(__dirname, '../../integrations/openocd'),
      config: {
        version: '0.12.0',
        timeout: 30000
      }
    });

    this.integrations.set('kicad', {
      name: 'KiCad',
      type: 'pcb',
      path: path.join(__dirname, '../../integrations/kicad'),
      config: {
        version: '7.0',
        timeout: 120000
      }
    });

    this.integrations.set('tflite', {
      name: 'TensorFlow Lite',
      type: 'ai',
      path: path.join(__dirname, '../../integrations/tflite'),
      config: {
        version: '2.13.0',
        timeout: 60000
      }
    });
  }

  /**
   * Execute external tool command
   */
  async executeCommand(integrationName, command, args = [], options = {}) {
    const integration = this.integrations.get(integrationName);
    if (!integration) {
      throw new Error(`Integration ${integrationName} not found`);
    }

    const {
      cwd = integration.path,
      timeout = integration.config.timeout,
      env = { ...process.env }
    } = options;

    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const processId = `${integrationName}_${Date.now()}`;
      this.activeProcesses.set(processId, process);

      let stdout = '';
      let stderr = '';

      // Set timeout
      const timeoutId = setTimeout(() => {
        process.kill('SIGTERM');
        this.activeProcesses.delete(processId);
        reject(new Error(`Command timeout after ${timeout}ms`));
      }, timeout);

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timeoutId);
        this.activeProcesses.delete(processId);

        resolve({
          code,
          stdout,
          stderr,
          success: code === 0
        });
      });

      process.on('error', (error) => {
        clearTimeout(timeoutId);
        this.activeProcesses.delete(processId);
        reject(error);
      });
    });
  }

  /**
   * Check if integration is available
   */
  async checkIntegration(integrationName) {
    try {
      const integration = this.integrations.get(integrationName);
      if (!integration) return false;

      // Check if integration directory exists
      await fs.access(integration.path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Install integration if not available
   */
  async installIntegration(integrationName) {
    const integration = this.integrations.get(integrationName);
    if (!integration) {
      throw new Error(`Integration ${integrationName} not found`);
    }

    // Create integration directory
    await fs.mkdir(integration.path, { recursive: true });

    // Download and install based on integration type
    switch (integration.type) {
      case 'simulation':
        return await this.installCircuitJS(integration);
      case 'build':
        return await this.installPlatformIO(integration);
      case 'debugging':
        return await this.installOpenOCD(integration);
      case 'pcb':
        return await this.installKiCad(integration);
      case 'ai':
        return await this.installTensorFlowLite(integration);
      default:
        throw new Error(`Unknown integration type: ${integration.type}`);
    }
  }

  /**
   * Install CircuitJS
   */
  async installCircuitJS(integration) {
    // Download CircuitJS from CDN or GitHub
    const circuitjsUrl = 'https://www.falstad.com/circuit/circuitjs1.jar';

    try {
      const response = await axios.get(circuitjsUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      const jarPath = path.join(integration.path, 'circuitjs.jar');
      await fs.writeFile(jarPath, response.data);

      // Create launch script
      const launchScript = `java -jar circuitjs.jar`;
      await fs.writeFile(
        path.join(integration.path, 'launch.sh'),
        launchScript,
        { mode: 0o755 }
      );

      return { success: true, message: 'CircuitJS installed successfully' };
    } catch (error) {
      throw new Error(`Failed to install CircuitJS: ${error.message}`);
    }
  }

  /**
   * Install PlatformIO
   */
  async installPlatformIO(integration) {
    try {
      // Install PlatformIO using pip
      const result = await this.executeCommand('platformio', 'pip', [
        'install', '-U', 'platformio'
      ]);

      if (result.success) {
        // Initialize PlatformIO
        await this.executeCommand('platformio', 'platformio', [
          'settings', 'set', 'enable_telemetry', 'false'
        ]);

        return { success: true, message: 'PlatformIO installed successfully' };
      } else {
        throw new Error(`PlatformIO installation failed: ${result.stderr}`);
      }
    } catch (error) {
      throw new Error(`Failed to install PlatformIO: ${error.message}`);
    }
  }

  /**
   * Install OpenOCD
   */
  async installOpenOCD(integration) {
    try {
      // For Linux/macOS, use package manager
      // For Windows, download from GitHub releases
      const platform = process.platform;
      let installCommand;

      if (platform === 'linux') {
        installCommand = ['apt-get', 'update', '&&', 'apt-get', 'install', '-y', 'openocd'];
      } else if (platform === 'darwin') {
        installCommand = ['brew', 'install', 'openocd'];
      } else {
        // Windows - download from GitHub
        const openocdUrl = 'https://github.com/openocd-org/openocd/releases/latest/download/openocd-0.12.0.zip';
        const response = await axios.get(openocdUrl, {
          responseType: 'arraybuffer',
          timeout: 60000
        });

        const zipPath = path.join(integration.path, 'openocd.zip');
        await fs.writeFile(zipPath, response.data);

        // Extract zip (would need unzip utility)
        return { success: true, message: 'OpenOCD downloaded, manual extraction required' };
      }

      const result = await this.executeCommand('openocd', installCommand[0], installCommand.slice(1));
      return {
        success: result.success,
        message: result.success ? 'OpenOCD installed successfully' : `OpenOCD installation failed: ${result.stderr}`
      };
    } catch (error) {
      throw new Error(`Failed to install OpenOCD: ${error.message}`);
    }
  }

  /**
   * Install KiCad
   */
  async installKiCad(integration) {
    try {
      const platform = process.platform;
      let installCommand;

      if (platform === 'linux') {
        installCommand = ['apt-get', 'update', '&&', 'apt-get', 'install', '-y', 'kicad'];
      } else if (platform === 'darwin') {
        installCommand = ['brew', 'install', 'kicad'];
      } else {
        // Windows - complex installation
        return { success: false, message: 'KiCad Windows installation requires manual setup' };
      }

      const result = await this.executeCommand('kicad', installCommand[0], installCommand.slice(1));
      return {
        success: result.success,
        message: result.success ? 'KiCad installed successfully' : `KiCad installation failed: ${result.stderr}`
      };
    } catch (error) {
      throw new Error(`Failed to install KiCad: ${error.message}`);
    }
  }

  /**
   * Install TensorFlow Lite
   */
  async installTensorFlowLite(integration) {
    try {
      // Install TensorFlow Lite for Microcontrollers
      const result = await this.executeCommand('tflite', 'pip', [
        'install', 'tensorflow-cpu'
      ]);

      if (result.success) {
        // Download TFLite Micro
        const tflmUrl = 'https://github.com/tensorflow/tflite-micro/archive/main.zip';
        const response = await axios.get(tflmUrl, {
          responseType: 'arraybuffer',
          timeout: 60000
        });

        const zipPath = path.join(integration.path, 'tflite-micro.zip');
        await fs.writeFile(zipPath, response.data);

        return { success: true, message: 'TensorFlow Lite installed successfully' };
      } else {
        throw new Error(`TensorFlow Lite installation failed: ${result.stderr}`);
      }
    } catch (error) {
      throw new Error(`Failed to install TensorFlow Lite: ${error.message}`);
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus() {
    const status = {};

    for (const [name, integration] of this.integrations) {
      status[name] = {
        name: integration.name,
        type: integration.type,
        available: await this.checkIntegration(name),
        version: integration.config.version,
        path: integration.path
      };
    }

    return status;
  }

  /**
   * Clean up active processes
   */
  cleanup() {
    for (const [id, process] of this.activeProcesses) {
      try {
        process.kill('SIGTERM');
      } catch (error) {
        console.error(`Failed to kill process ${id}:`, error);
      }
    }
    this.activeProcesses.clear();
  }
}

// Export singleton instance
module.exports = new IntegrationService();