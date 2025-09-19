/**
 * PlatformIO Integration Service
 * Professional embedded development and build system
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class PlatformIOService {
  constructor() {
    this.projects = new Map();
    this.builds = new Map();
    this.templates = new Map();

    this.loadTemplates();
  }

  /**
   * Load project templates for different boards
   */
  async loadTemplates() {
    // Arduino Uno template
    this.templates.set('arduino-uno', {
      platform: 'atmelavr',
      board: 'uno',
      framework: 'arduino',
      libraries: ['Servo', 'Wire'],
      mainCode: `#include <Arduino.h>

void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}`
    });

    // ESP32 template
    this.templates.set('esp32', {
      platform: 'espressif32',
      board: 'esp32dev',
      framework: 'arduino',
      libraries: ['WiFi', 'HTTPClient'],
      mainCode: `#include <Arduino.h>
#include <WiFi.h>

const char* ssid = "your-ssid";
const char* password = "your-password";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
  }

  Serial.println("Connected to WiFi");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Your code here
  delay(1000);
}`
    });

    // Raspberry Pi Pico template
    this.templates.set('raspberry-pi-pico', {
      platform: 'raspberrypi',
      board: 'pico',
      framework: 'arduino',
      libraries: ['SPI', 'Wire'],
      mainCode: `#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}`
    });
  }

  /**
   * Initialize PlatformIO project
   */
  async initializeProject(projectData) {
    const { name, boardType, description } = projectData;
    const projectId = uuidv4();

    const template = this.templates.get(boardType);
    if (!template) {
      throw new Error(`Unsupported board type: ${boardType}`);
    }

    const projectPath = path.join(__dirname, '../../projects', projectId);

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // Create platformio.ini
    const platformioIni = this.generatePlatformIOConfig(template, name, description);
    await fs.writeFile(path.join(projectPath, 'platformio.ini'), platformioIni);

    // Create src directory and main file
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
    await fs.writeFile(path.join(projectPath, 'src', 'main.cpp'), template.mainCode);

    // Create lib directory for custom libraries
    await fs.mkdir(path.join(projectPath, 'lib'), { recursive: true });

    // Create include directory
    await fs.mkdir(path.join(projectPath, 'include'), { recursive: true });

    const project = {
      id: projectId,
      name,
      boardType,
      path: projectPath,
      template,
      created: new Date().toISOString(),
      status: 'initialized'
    };

    this.projects.set(projectId, project);

    return project;
  }

  /**
   * Generate platformio.ini configuration
   */
  generatePlatformIOConfig(template, projectName, description) {
    return `; PlatformIO Project Configuration File
;
;   Build options: build flags, source filter
;   Upload options: custom upload port, speed and extra flags
;   Library options: dependencies, extra library storages
;   Advanced options: extra scripting
;
; Please visit documentation for the other options and examples
; https://docs.platformio.org/page/projectconf.html

[env:${template.board}]
platform = ${template.platform}
board = ${template.board}
framework = ${template.framework}

; Build options
build_flags =
    -D PROJECT_NAME="${projectName}"
    -D PROJECT_DESCRIPTION="${description || ''}"

; Serial Monitor options
monitor_speed = 115200
monitor_filters = esp32_exception_decoder

; Library dependencies
lib_deps =
${template.libraries.map(lib => `    ${lib}`).join('\n')}

; Upload options
upload_speed = 921600

; Testing
test_ignore = test_desktop

[platformio]
description = ${description || projectName}
`;
  }

  /**
   * Build project
   */
  async buildProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const buildId = uuidv4();

    try {
      // Run platformio run command
      const result = await this.runPlatformIOCommand(project.path, ['run']);

      const build = {
        id: buildId,
        projectId,
        status: result.success ? 'success' : 'failed',
        output: result.stdout,
        errors: result.stderr,
        size: result.success ? await this.getBuildSize(project.path) : null,
        timestamp: new Date().toISOString()
      };

      this.builds.set(buildId, build);

      // Update project status
      project.lastBuild = build;
      project.status = result.success ? 'built' : 'build_failed';

      return build;

    } catch (error) {
      const build = {
        id: buildId,
        projectId,
        status: 'error',
        output: '',
        errors: error.message,
        size: null,
        timestamp: new Date().toISOString()
      };

      this.builds.set(buildId, build);
      project.status = 'build_error';

      throw error;
    }
  }

  /**
   * Upload firmware to device
   */
  async uploadFirmware(projectId, port) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const uploadId = uuidv4();

    try {
      const args = ['run', '--target', 'upload'];
      if (port) {
        args.push('--upload-port', port);
      }

      const result = await this.runPlatformIOCommand(project.path, args);

      const upload = {
        id: uploadId,
        projectId,
        status: result.success ? 'success' : 'failed',
        output: result.stdout,
        errors: result.stderr,
        port: port || 'auto',
        timestamp: new Date().toISOString()
      };

      // Update project status
      project.lastUpload = upload;
      project.status = result.success ? 'uploaded' : 'upload_failed';

      return upload;

    } catch (error) {
      const upload = {
        id: uploadId,
        projectId,
        status: 'error',
        output: '',
        errors: error.message,
        port: port || 'auto',
        timestamp: new Date().toISOString()
      };

      project.status = 'upload_error';

      throw error;
    }
  }

  /**
   * Run PlatformIO command
   */
  async runPlatformIOCommand(projectPath, args) {
    const { execCommand } = require('../services/integrationService');

    return await execCommand('platformio', 'platformio', args, {
      cwd: projectPath,
      timeout: 120000 // 2 minutes timeout for builds
    });
  }

  /**
   * Get build size information
   */
  async getBuildSize(projectPath) {
    try {
      const result = await this.runPlatformIOCommand(projectPath, ['run', '--target', 'size']);

      // Parse size output
      const sizeMatch = result.stdout.match(/Program:\s+(\d+)/);
      const dataMatch = result.stdout.match(/Data:\s+(\d+)/);

      return {
        program: sizeMatch ? parseInt(sizeMatch[1]) : 0,
        data: dataMatch ? parseInt(dataMatch[1]) : 0,
        total: (sizeMatch ? parseInt(sizeMatch[1]) : 0) + (dataMatch ? parseInt(dataMatch[1]) : 0)
      };
    } catch (error) {
      console.error('Failed to get build size:', error);
      return null;
    }
  }

  /**
   * Install library
   */
  async installLibrary(projectId, libraryName) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    try {
      const result = await this.runPlatformIOCommand(project.path, ['lib', 'install', libraryName]);

      if (result.success) {
        // Update project libraries
        if (!project.libraries) project.libraries = [];
        if (!project.libraries.includes(libraryName)) {
          project.libraries.push(libraryName);
        }

        return { success: true, message: `Library ${libraryName} installed successfully` };
      } else {
        throw new Error(`Failed to install library: ${result.stderr}`);
      }
    } catch (error) {
      throw new Error(`Library installation failed: ${error.message}`);
    }
  }

  /**
   * Update project code
   */
  async updateCode(projectId, fileName, code) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const filePath = path.join(project.path, 'src', fileName);
    await fs.writeFile(filePath, code);

    return { success: true, message: `File ${fileName} updated successfully` };
  }

  /**
   * Get project files
   */
  async getProjectFiles(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const files = await this.getDirectoryContents(project.path);

    return {
      projectId,
      files,
      path: project.path
    };
  }

  /**
   * Recursively get directory contents
   */
  async getDirectoryContents(dirPath, relativePath = '') {
    const files = [];

    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const relativeItemPath = path.join(relativePath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          // Skip certain directories
          if (!['.pio', 'node_modules', '.git'].includes(item)) {
            const subFiles = await this.getDirectoryContents(itemPath, relativeItemPath);
            files.push(...subFiles);
          }
        } else {
          // Skip certain files
          if (!item.startsWith('.') && !['platformio.ini'].includes(item)) {
            files.push({
              name: item,
              path: relativeItemPath,
              size: stats.size,
              modified: stats.mtime.toISOString(),
              type: this.getFileType(item)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error reading directory:', error);
    }

    return files;
  }

  /**
   * Get file type based on extension
   */
  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();

    switch (ext) {
      case '.cpp':
      case '.c':
      case '.ino':
        return 'code';
      case '.h':
      case '.hpp':
        return 'header';
      case '.json':
        return 'config';
      case '.md':
        return 'documentation';
      case '.txt':
        return 'text';
      default:
        return 'other';
    }
  }

  /**
   * Clean up project
   */
  async cleanupProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return;

    try {
      // Remove project directory
      await fs.rmdir(project.path, { recursive: true });

      // Remove from maps
      this.projects.delete(projectId);

      // Remove associated builds
      for (const [buildId, build] of this.builds) {
        if (build.projectId === projectId) {
          this.builds.delete(buildId);
        }
      }

    } catch (error) {
      console.error('Error cleaning up project:', error);
    }
  }

  /**
   * Get project by ID
   */
  getProject(projectId) {
    return this.projects.get(projectId);
  }

  /**
   * Get all projects
   */
  getAllProjects() {
    return Array.from(this.projects.values());
  }

  /**
   * Get build by ID
   */
  getBuild(buildId) {
    return this.builds.get(buildId);
  }

  /**
   * Get project builds
   */
  getProjectBuilds(projectId) {
    return Array.from(this.builds.values())
      .filter(build => build.projectId === projectId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

module.exports = new PlatformIOService();