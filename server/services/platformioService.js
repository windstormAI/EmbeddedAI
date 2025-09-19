/**
 * PlatformIO Service
 * Professional build system and hardware flashing for embedded development
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class PlatformIOService {
  constructor() {
    this.buildsDir = path.join(process.cwd(), 'builds');
    this.templatesDir = path.join(process.cwd(), 'templates');
    this.initializeDirectories();
  }

  /**
   * Initialize required directories
   */
  async initializeDirectories() {
    try {
      await fs.mkdir(this.buildsDir, { recursive: true });
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create PlatformIO directories:', error);
    }
  }

  /**
   * Initialize PlatformIO project
   */
  async initializeProject(projectId, boardType = 'arduino-uno') {
    try {
      const projectDir = path.join(this.buildsDir, projectId);

      // Create project directory
      await fs.mkdir(projectDir, { recursive: true });

      // Generate platformio.ini
      const platformioConfig = this.generatePlatformIOConfig(boardType);
      await fs.writeFile(path.join(projectDir, 'platformio.ini'), platformioConfig);

      // Create src directory
      await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });

      // Create lib directory
      await fs.mkdir(path.join(projectDir, 'lib'), { recursive: true });

      console.log(`PlatformIO project initialized: ${projectId}`);
      return { success: true, projectDir };

    } catch (error) {
      console.error('Failed to initialize PlatformIO project:', error);
      throw new Error(`Project initialization failed: ${error.message}`);
    }
  }

  /**
   * Generate platformio.ini configuration
   */
  generatePlatformIOConfig(boardType) {
    const boardConfigs = {
      'arduino-uno': {
        platform: 'atmelavr',
        board: 'uno',
        framework: 'arduino'
      },
      'arduino-nano': {
        platform: 'atmelavr',
        board: 'nanoatmega328',
        framework: 'arduino'
      },
      'arduino-mega': {
        platform: 'atmelavr',
        board: 'megaatmega2560',
        framework: 'arduino'
      },
      'esp32': {
        platform: 'espressif32',
        board: 'esp32dev',
        framework: 'arduino'
      },
      'esp8266': {
        platform: 'espressif8266',
        board: 'nodemcuv2',
        framework: 'arduino'
      },
      'raspberry-pi-pico': {
        platform: 'raspberrypi',
        board: 'pico',
        framework: 'arduino'
      }
    };

    const config = boardConfigs[boardType] || boardConfigs['arduino-uno'];

    return `[env:${boardType}]
platform = ${config.platform}
board = ${config.board}
framework = ${config.framework}

; Build options
build_flags =
    -DDEBUG
    -std=c++11

; Library dependencies
lib_deps =

; Serial Monitor options
monitor_speed = 115200
monitor_filters = time, log2file, esp32_exception_decoder

; Upload options
upload_speed = 921600
`;
  }

  /**
   * Build project
   */
  async buildProject(projectId, code) {
    try {
      const projectDir = path.join(this.buildsDir, projectId);

      // Write main.cpp
      const srcDir = path.join(projectDir, 'src');
      await fs.writeFile(path.join(srcDir, 'main.cpp'), code);

      // Run PlatformIO build
      const buildResult = await this.runPlatformIOCommand(projectDir, ['run']);

      console.log(`Build completed for project: ${projectId}`);
      return {
        success: true,
        output: buildResult,
        firmwarePath: path.join(projectDir, '.pio', 'build', this.getBoardType(projectId), 'firmware.bin')
      };

    } catch (error) {
      console.error('Build failed:', error);
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  /**
   * Upload firmware to device
   */
  async uploadFirmware(projectId, port = null) {
    try {
      const projectDir = path.join(this.buildsDir, projectId);

      // Detect port if not provided
      const uploadPort = port || await this.detectSerialPort();

      if (!uploadPort) {
        throw new Error('No serial port detected. Please connect your device.');
      }

      // Run PlatformIO upload
      const uploadCommand = ['run', '--target', 'upload'];
      if (uploadPort) {
        uploadCommand.push('--upload-port', uploadPort);
      }

      const uploadResult = await this.runPlatformIOCommand(projectDir, uploadCommand);

      console.log(`Firmware uploaded to project: ${projectId}`);
      return {
        success: true,
        output: uploadResult,
        port: uploadPort
      };

    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Monitor serial output
   */
  async startSerialMonitor(projectId, port = null, baudRate = 115200) {
    try {
      const monitorPort = port || await this.detectSerialPort();

      if (!monitorPort) {
        throw new Error('No serial port detected');
      }

      const projectDir = path.join(this.buildsDir, projectId);

      // Start serial monitor
      const monitorProcess = spawn('pio', ['device', 'monitor', '--port', monitorPort, '--baud', baudRate.toString()], {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return {
        success: true,
        process: monitorProcess,
        port: monitorPort,
        baudRate
      };

    } catch (error) {
      console.error('Serial monitor failed:', error);
      throw new Error(`Serial monitor failed: ${error.message}`);
    }
  }

  /**
   * Run PlatformIO command
   */
  async runPlatformIOCommand(projectDir, args) {
    return new Promise((resolve, reject) => {
      const pioProcess = spawn('pio', args, {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pioProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pioProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pioProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`PlatformIO command failed with code ${code}: ${stderr}`));
        }
      });

      pioProcess.on('error', (error) => {
        reject(new Error(`PlatformIO command error: ${error.message}`));
      });
    });
  }

  /**
   * Detect available serial ports
   */
  async detectSerialPort() {
    try {
      // Use platform-specific commands to detect serial ports
      let command, args;

      if (os.platform() === 'win32') {
        command = 'powershell';
        args = ['-Command', 'Get-WMIObject Win32_SerialPort | Select-Object DeviceID'];
      } else if (os.platform() === 'darwin') {
        command = 'ls';
        args = ['/dev/tty.*', '/dev/cu.*'];
      } else {
        command = 'ls';
        args = ['/dev/ttyUSB*', '/dev/ttyACM*'];
      }

      return new Promise((resolve) => {
        exec(`${command} ${args.join(' ')}`, (error, stdout) => {
          if (error) {
            resolve(null);
            return;
          }

          const ports = stdout.trim().split('\n').filter(port => port.trim());
          // Return first available port
          resolve(ports.length > 0 ? ports[0].trim() : null);
        });
      });

    } catch (error) {
      console.error('Serial port detection failed:', error);
      return null;
    }
  }

  /**
   * Get board type from project
   */
  getBoardType(projectId) {
    // This would be stored in project metadata
    // For now, return default
    return 'arduino-uno';
  }

  /**
   * Clean up project build files
   */
  async cleanupProject(projectId) {
    try {
      const projectDir = path.join(this.buildsDir, projectId);

      // Remove .pio build directory
      const pioDir = path.join(projectDir, '.pio');
      await fs.rm(pioDir, { recursive: true, force: true });

      console.log(`Cleaned up project: ${projectId}`);
      return { success: true };

    } catch (error) {
      console.error('Cleanup failed:', error);
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Get project build status
   */
  async getBuildStatus(projectId) {
    try {
      const projectDir = path.join(this.buildsDir, projectId);
      const firmwarePath = path.join(projectDir, '.pio', 'build', this.getBoardType(projectId), 'firmware.bin');

      const firmwareExists = await fs.access(firmwarePath).then(() => true).catch(() => false);

      return {
        success: true,
        built: firmwareExists,
        firmwarePath: firmwareExists ? firmwarePath : null,
        projectDir
      };

    } catch (error) {
      console.error('Status check failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Install PlatformIO library
   */
  async installLibrary(projectId, libraryName) {
    try {
      const projectDir = path.join(this.buildsDir, projectId);

      const result = await this.runPlatformIOCommand(projectDir, ['lib', 'install', libraryName]);

      console.log(`Library installed: ${libraryName} for project ${projectId}`);
      return { success: true, output: result };

    } catch (error) {
      console.error('Library installation failed:', error);
      throw new Error(`Library installation failed: ${error.message}`);
    }
  }

  /**
   * Get available boards
   */
  getAvailableBoards() {
    return {
      'arduino-uno': {
        name: 'Arduino Uno',
        platform: 'atmelavr',
        mcu: 'atmega328p',
        frequency: '16MHz',
        flash: '32KB',
        sram: '2KB',
        eeprom: '1KB'
      },
      'arduino-nano': {
        name: 'Arduino Nano',
        platform: 'atmelavr',
        mcu: 'atmega328p',
        frequency: '16MHz',
        flash: '32KB',
        sram: '2KB',
        eeprom: '1KB'
      },
      'arduino-mega': {
        name: 'Arduino Mega',
        platform: 'atmelavr',
        mcu: 'atmega2560',
        frequency: '16MHz',
        flash: '256KB',
        sram: '8KB',
        eeprom: '4KB'
      },
      'esp32': {
        name: 'ESP32 Dev Module',
        platform: 'espressif32',
        mcu: 'esp32',
        frequency: '240MHz',
        flash: '4MB',
        sram: '520KB',
        psram: '4MB'
      },
      'esp8266': {
        name: 'ESP8266 NodeMCU',
        platform: 'espressif8266',
        mcu: 'esp8266',
        frequency: '80MHz',
        flash: '4MB',
        sram: '80KB'
      },
      'raspberry-pi-pico': {
        name: 'Raspberry Pi Pico',
        platform: 'raspberrypi',
        mcu: 'rp2040',
        frequency: '133MHz',
        flash: '2MB',
        sram: '264KB'
      }
    };
  }
}

module.exports = new PlatformIOService();