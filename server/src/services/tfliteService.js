/**
 * TensorFlow Lite Integration Service
 * Edge AI model deployment and management for microcontrollers
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class TFLiteService {
  constructor() {
    this.models = new Map();
    this.deployments = new Map();
    this.templates = new Map();

    this.loadTemplates();
  }

  /**
   * Load AI model templates for different applications
   */
  async loadTemplates() {
    // Image classification template
    this.templates.set('image_classification', {
      type: 'classification',
      framework: 'tensorflow',
      inputShape: [1, 224, 224, 3],
      outputShape: [1, 1000],
      supportedBoards: ['esp32', 'raspberry-pi-pico', 'arduino-nano-33-ble'],
      memory: { flash: 500000, ram: 100000 },
      sampleCode: this.getImageClassificationCode()
    });

    // Audio classification template
    this.templates.set('audio_classification', {
      type: 'classification',
      framework: 'tensorflow',
      inputShape: [1, 1960],
      outputShape: [1, 3],
      supportedBoards: ['esp32', 'arduino-nano-33-ble'],
      memory: { flash: 300000, ram: 50000 },
      sampleCode: this.getAudioClassificationCode()
    });

    // Gesture recognition template
    this.templates.set('gesture_recognition', {
      type: 'classification',
      framework: 'tensorflow',
      inputShape: [1, 126],
      outputShape: [1, 4],
      supportedBoards: ['arduino-nano-33-ble', 'esp32'],
      memory: { flash: 200000, ram: 30000 },
      sampleCode: this.getGestureRecognitionCode()
    });

    // Anomaly detection template
    this.templates.set('anomaly_detection', {
      type: 'regression',
      framework: 'tensorflow',
      inputShape: [1, 10],
      outputShape: [1, 1],
      supportedBoards: ['esp32', 'raspberry-pi-pico', 'arduino-uno'],
      memory: { flash: 150000, ram: 20000 },
      sampleCode: this.getAnomalyDetectionCode()
    });

    // Object detection template (lightweight)
    this.templates.set('object_detection', {
      type: 'detection',
      framework: 'tensorflow',
      inputShape: [1, 96, 96, 3],
      outputShape: [1, 5, 6], // [batch, num_boxes, [x,y,w,h,confidence,class]]
      supportedBoards: ['esp32'],
      memory: { flash: 800000, ram: 200000 },
      sampleCode: this.getObjectDetectionCode()
    });
  }

  /**
   * Create TensorFlow Lite model for deployment
   */
  async createModel(modelData, options = {}) {
    const {
      type = 'image_classification',
      targetBoard = 'esp32',
      optimization = 'balanced'
    } = options;

    const modelId = uuidv4();
    const template = this.templates.get(type);

    if (!template) {
      throw new Error(`Model type ${type} not supported`);
    }

    if (!template.supportedBoards.includes(targetBoard)) {
      throw new Error(`Board ${targetBoard} not supported for model type ${type}`);
    }

    // Generate model files
    const modelFiles = await this.generateModelFiles(modelId, modelData, template, targetBoard, optimization);

    const model = {
      id: modelId,
      type,
      targetBoard,
      optimization,
      template,
      files: modelFiles,
      status: 'created',
      created: new Date().toISOString(),
      metadata: {
        inputShape: template.inputShape,
        outputShape: template.outputShape,
        memoryRequirements: template.memory,
        performance: await this.estimatePerformance(template, targetBoard, optimization)
      }
    };

    this.models.set(modelId, model);

    return model;
  }

  /**
   * Generate model files for deployment
   */
  async generateModelFiles(modelId, modelData, template, targetBoard, optimization) {
    const modelPath = path.join(__dirname, '../../models/tflite', modelId);
    await fs.mkdir(modelPath, { recursive: true });

    const files = {};

    // Generate TensorFlow Lite model file (.tflite)
    files['model.tflite'] = await this.convertToTFLite(modelData, optimization);

    // Generate C++ header file with model data
    files['model_data.h'] = this.generateModelHeader(modelId, files['model.tflite']);

    // Generate Arduino/C++ inference code
    files['inference.h'] = this.generateInferenceHeader(template, targetBoard);

    // Generate example usage code
    files['example.ino'] = template.sampleCode;

    // Generate platform-specific files
    const platformFiles = await this.generatePlatformFiles(template, targetBoard, modelId);
    Object.assign(files, platformFiles);

    // Save all files
    for (const [fileName, content] of Object.entries(files)) {
      await fs.writeFile(path.join(modelPath, fileName), content);
    }

    return Object.keys(files);
  }

  /**
   * Convert model to TensorFlow Lite format
   */
  async convertToTFLite(modelData, optimization) {
    // In a real implementation, this would use TensorFlow Lite Converter
    // For now, return a mock TFLite model structure

    const optimizations = {
      speed: { compression: 'high', quantization: 'dynamic' },
      size: { compression: 'maximum', quantization: 'full_integer' },
      balanced: { compression: 'medium', quantization: 'float16' }
    };

    const opt = optimizations[optimization] || optimizations.balanced;

    // Mock TFLite model (simplified flatbuffer structure)
    const tfliteModel = Buffer.from(`
TFLITE_MODEL_HEADER
Version: 3
Optimization: ${JSON.stringify(opt)}
Layers: ${modelData.layers || 10}
Parameters: ${modelData.parameters || 50000}
Size: ${modelData.size || 100000}
END_HEADER
${'MODEL_DATA_'.repeat(1000)}
    `.trim());

    return tfliteModel;
  }

  /**
   * Generate C++ header with model data
   */
  generateModelHeader(modelId, tfliteBuffer) {
    const hexData = tfliteBuffer.toString('hex').match(/.{1,32}/g).join('\n');

    return `// Auto-generated TensorFlow Lite model header
// Model ID: ${modelId}
// Generated: ${new Date().toISOString()}

#ifndef MODEL_DATA_H_
#define MODEL_DATA_H_

#include <cstdint>

const unsigned char g_model[] = {
${hexData.split('\n').map(line => '  ' + line.split('').map(char => '0x' + char).join(', ')).join(',\n')}
};

const unsigned int g_model_len = ${tfliteBuffer.length};

#endif // MODEL_DATA_H_
`;
  }

  /**
   * Generate inference header
   */
  generateInferenceHeader(template, targetBoard) {
    const inputSize = template.inputShape.reduce((a, b) => a * b, 1);
    const outputSize = template.outputShape.reduce((a, b) => a * b, 1);

    return `// TensorFlow Lite Inference Header
// Target Board: ${targetBoard}
// Input Shape: [${template.inputShape.join(', ')}]
// Output Shape: [${template.outputShape.join(', ')}]

#ifndef INFERENCE_H_
#define INFERENCE_H_

#include <TensorFlowLite.h>
#include "tensorflow/lite/micro/all_ops_resolver.h"
#include "tensorflow/lite/micro/micro_error_reporter.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/schema/schema_generated.h"
#include "tensorflow/lite/version.h"
#include "model_data.h"

class InferenceEngine {
private:
    tflite::MicroErrorReporter micro_error_reporter;
    tflite::AllOpsResolver resolver;
    const tflite::Model* model;
    tflite::MicroInterpreter* interpreter;
    TfLiteTensor* input;
    TfLiteTensor* output;

    uint8_t tensor_arena[${template.memory.ram}];

public:
    InferenceEngine() : micro_error_reporter() {}

    bool begin() {
        model = tflite::GetModel(g_model);
        if (model->version() != TFLITE_SCHEMA_VERSION) {
            micro_error_reporter.Report("Model version mismatch");
            return false;
        }

        interpreter = new tflite::MicroInterpreter(
            model, resolver, tensor_arena, ${template.memory.ram}, &micro_error_reporter);

        if (interpreter->AllocateTensors() != kTfLiteOk) {
            micro_error_reporter.Report("Failed to allocate tensors");
            return false;
        }

        input = interpreter->input(0);
        output = interpreter->output(0);

        return true;
    }

    float* getInputBuffer() {
        return input->data.f;
    }

    float* getOutputBuffer() {
        return output->data.f;
    }

    bool runInference() {
        if (interpreter->Invoke() != kTfLiteOk) {
            micro_error_reporter.Report("Inference failed");
            return false;
        }
        return true;
    }

    int getInputSize() { return ${inputSize}; }
    int getOutputSize() { return ${outputSize}; }
};

#endif // INFERENCE_H_
`;
  }

  /**
   * Generate platform-specific files
   */
  async generatePlatformFiles(template, targetBoard, modelId) {
    const files = {};

    switch (targetBoard) {
      case 'esp32':
        files['platformio.ini'] = this.generateESP32PlatformIO(template);
        break;
      case 'arduino-nano-33-ble':
        files['platformio.ini'] = this.generateNano33PlatformIO(template);
        break;
      case 'raspberry-pi-pico':
        files['CMakeLists.txt'] = this.generatePicoCMake(template);
        break;
    }

    return files;
  }

  /**
   * Generate ESP32 PlatformIO configuration
   */
  generateESP32PlatformIO(template) {
    return `; PlatformIO Configuration for ESP32 TFLite
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino

build_flags =
    -DTF_LITE_STATIC_MEMORY
    -DTF_LITE_DISABLE_X86_NEON
    -DARDUINO_ARCH_ESP32
    -I src

lib_deps =
    tensorflow-lite

monitor_speed = 115200
upload_speed = 921600

board_build.partitions = huge_app.csv
`;
  }

  /**
   * Generate Arduino Nano 33 BLE PlatformIO configuration
   */
  generateNano33PlatformIO(template) {
    return `; PlatformIO Configuration for Arduino Nano 33 BLE
[env:nano33ble]
platform = nordicnrf52
board = nano33ble
framework = arduino

build_flags =
    -DTF_LITE_STATIC_MEMORY
    -DARDUINO_ARCH_NRF52840
    -I src

lib_deps =
    arduino-libraries/Arduino_TensorFlowLite

monitor_speed = 9600
upload_speed = 115200
`;
  }

  /**
   * Generate Raspberry Pi Pico CMake configuration
   */
  generatePicoCMake(template) {
    return `cmake_minimum_required(VERSION 3.13)

include(pico_sdk_import.cmake)

project(tflite_pico C CXX ASM)
set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

pico_sdk_init()

add_executable(tflite_pico
    main.cpp
    model_data.cpp
)

target_link_libraries(tflite_pico
    pico_stdlib
    pico-tflmicro
)

pico_add_extra_outputs(tflite_pico)
`;
  }

  /**
   * Deploy model to device
   */
  async deployModel(modelId, deviceConfig) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const deploymentId = uuidv4();

    try {
      // Generate deployment package
      const deployment = await this.createDeploymentPackage(model, deviceConfig);

      const deploymentRecord = {
        id: deploymentId,
        modelId,
        deviceConfig,
        status: 'deployed',
        deployment,
        deployedAt: new Date().toISOString()
      };

      this.deployments.set(deploymentId, deploymentRecord);

      return deploymentRecord;

    } catch (error) {
      const deploymentRecord = {
        id: deploymentId,
        modelId,
        deviceConfig,
        status: 'failed',
        error: error.message,
        deployedAt: new Date().toISOString()
      };

      this.deployments.set(deploymentId, deploymentRecord);
      throw error;
    }
  }

  /**
   * Create deployment package
   */
  async createDeploymentPackage(model, deviceConfig) {
    const { targetBoard, type } = model;

    // Generate complete firmware with TFLite integration
    const firmware = await this.generateFirmware(model, deviceConfig);

    return {
      firmware,
      instructions: this.generateDeploymentInstructions(model, deviceConfig),
      requirements: this.getDeploymentRequirements(model, deviceConfig)
    };
  }

  /**
   * Generate firmware with TFLite integration
   */
  async generateFirmware(model, deviceConfig) {
    const { targetBoard, type } = model;

    // Base firmware template
    let firmware = this.getBaseFirmware(targetBoard);

    // Add TFLite includes and setup
    firmware = firmware.replace(
      '// TFLite includes',
      `#include "model_data.h"
#include "inference.h"`
    );

    // Add TFLite setup
    firmware = firmware.replace(
      '// TFLite setup',
      `InferenceEngine ai;

void setupAI() {
    if (!ai.begin()) {
        Serial.println("AI initialization failed!");
        while (1);
    }
    Serial.println("AI initialized successfully");
}`
    );

    // Add inference loop based on model type
    const inferenceCode = this.getInferenceCode(type, deviceConfig);
    firmware = firmware.replace(
      '// AI inference',
      inferenceCode
    );

    return firmware;
  }

  /**
   * Get base firmware template
   */
  getBaseFirmware(board) {
    const templates = {
      esp32: `#include <Arduino.h>

// TFLite includes

void setup() {
    Serial.begin(115200);
    Serial.println("ESP32 TFLite Demo");

    // TFLite setup

    setupAI();
}

void loop() {
    // AI inference

    delay(1000);
}
`,
      'arduino-nano-33-ble': `#include <Arduino.h>

// TFLite includes

void setup() {
    Serial.begin(9600);
    while (!Serial);

    // TFLite setup

    setupAI();
}

void loop() {
    // AI inference

    delay(1000);
}
`,
      'raspberry-pi-pico': `#include <stdio.h>
#include "pico/stdlib.h"

// TFLite includes

int main() {
    stdio_init_all();

    // TFLite setup

    setupAI();

    while (true) {
        // AI inference

        sleep_ms(1000);
    }

    return 0;
}
`
    };

    return templates[board] || templates.esp32;
  }

  /**
   * Get inference code based on model type
   */
  getInferenceCode(type, deviceConfig) {
    const inferenceTemplates = {
      image_classification: `// Image classification inference
float* input = ai.getInputBuffer();
// Fill input buffer with image data (224x224x3)
// ... image capture code ...

if (ai.runInference()) {
    float* output = ai.getOutputBuffer();
    int predicted_class = 0;
    float max_prob = 0;

    for (int i = 0; i < ai.getOutputSize(); i++) {
        if (output[i] > max_prob) {
            max_prob = output[i];
            predicted_class = i;
        }
    }

    Serial.printf("Predicted class: %d (confidence: %.2f)\\n", predicted_class, max_prob);
}`,

      audio_classification: `// Audio classification inference
float* input = ai.getInputBuffer();
// Fill input buffer with audio features (1960 samples)
// ... audio capture code ...

if (ai.runInference()) {
    float* output = ai.getOutputBuffer();
    Serial.printf("Sound classes: %.2f, %.2f, %.2f\\n", output[0], output[1], output[2]);
}`,

      gesture_recognition: `// Gesture recognition inference
float* input = ai.getInputBuffer();
// Fill input buffer with sensor data (126 features)
// ... IMU sensor reading code ...

if (ai.runInference()) {
    float* output = ai.getOutputBuffer();
    int gesture = 0;
    float max_prob = 0;

    for (int i = 0; i < 4; i++) {
        if (output[i] > max_prob) {
            max_prob = output[i];
            gesture = i;
        }
    }

    Serial.printf("Gesture: %d\\n", gesture);
}`
    };

    return inferenceTemplates[type] || inferenceTemplates.image_classification;
  }

  /**
   * Generate deployment instructions
   */
  generateDeploymentInstructions(model, deviceConfig) {
    const { targetBoard, type } = model;

    return `# AI Model Deployment Instructions

## Target Board: ${targetBoard.toUpperCase()}
## Model Type: ${type.replace('_', ' ').toUpperCase()}

## Prerequisites
- PlatformIO installed
- ${targetBoard} board connected
- USB cable for programming

## Deployment Steps

1. **Extract Files**
   \`\`\`bash
   unzip ${model.id}_deployment.zip
   cd ${model.id}_deployment
   \`\`\`

2. **Install Dependencies**
   \`\`\`bash
   platformio lib install
   \`\`\`

3. **Build Firmware**
   \`\`\`bash
   platformio run
   \`\`\`

4. **Upload to Device**
   \`\`\`bash
   platformio run --target upload
   \`\`\`

5. **Monitor Output**
   \`\`\`bash
   platformio device monitor
   \`\`\`

## Memory Requirements
- Flash: ${model.metadata.memoryRequirements.flash} bytes
- RAM: ${model.metadata.memoryRequirements.ram} bytes

## Performance Estimates
- Inference Time: ${model.metadata.performance.inferenceTime} ms
- Power Consumption: ${model.metadata.performance.powerConsumption} mA
- Accuracy: ${model.metadata.performance.accuracy}%

## Troubleshooting
- If upload fails, check USB connection and driver installation
- If inference fails, verify sensor connections and data format
- Monitor serial output for detailed error messages
`;
  }

  /**
   * Get deployment requirements
   */
  getDeploymentRequirements(model, deviceConfig) {
    const { targetBoard } = model;

    return {
      hardware: [
        `${targetBoard} development board`,
        'USB cable',
        'Power supply (if required)'
      ],
      software: [
        'PlatformIO IDE or CLI',
        'Board-specific drivers',
        'Serial terminal (for debugging)'
      ],
      libraries: [
        'TensorFlow Lite for Microcontrollers',
        'Board-specific libraries'
      ]
    };
  }

  /**
   * Estimate performance metrics
   */
  async estimatePerformance(template, targetBoard, optimization) {
    // Performance estimation based on board capabilities
    const boardPerformance = {
      esp32: { mips: 600, ram: 520, flash: 1600 },
      'arduino-nano-33-ble': { mips: 64, ram: 256, flash: 1000 },
      'raspberry-pi-pico': { mips: 133, ram: 264, flash: 2000 }
    };

    const board = boardPerformance[targetBoard] || boardPerformance.esp32;

    // Calculate estimated performance
    const ops = template.inputShape.reduce((a, b) => a * b, 1) * 100; // Rough operation estimate
    const inferenceTime = Math.round((ops / board.mips) * 1000); // ms

    const optimizationFactors = {
      speed: { time: 0.8, accuracy: 0.95, power: 1.2 },
      size: { time: 1.5, accuracy: 0.85, power: 0.8 },
      balanced: { time: 1.0, accuracy: 0.95, power: 1.0 }
    };

    const factors = optimizationFactors[optimization] || optimizationFactors.balanced;

    return {
      inferenceTime: Math.round(inferenceTime * factors.time),
      powerConsumption: Math.round(50 * factors.power), // mA
      accuracy: Math.round(95 * factors.accuracy), // %
      memoryEfficiency: Math.round((template.memory.ram / board.ram) * 100)
    };
  }

  // Sample code templates

  getImageClassificationCode() {
    return `#include <Arduino.h>
#include "inference.h"

InferenceEngine ai;

void setup() {
    Serial.begin(115200);

    if (!ai.begin()) {
        Serial.println("AI initialization failed!");
        while (1);
    }

    Serial.println("AI initialized - Image Classification Demo");
}

void loop() {
    // Simulate image capture (224x224 RGB)
    float* input = ai.getInputBuffer();

    // Fill with dummy image data (replace with actual camera capture)
    for (int i = 0; i < ai.getInputSize(); i++) {
        input[i] = (float)random(0, 255) / 255.0;
    }

    if (ai.runInference()) {
        float* output = ai.getOutputBuffer();

        // Find predicted class
        int predicted_class = 0;
        float max_prob = 0;

        for (int i = 0; i < ai.getOutputSize(); i++) {
            if (output[i] > max_prob) {
                max_prob = output[i];
                predicted_class = i;
            }
        }

        Serial.printf("Predicted class: %d (confidence: %.2f)\\n",
                     predicted_class, max_prob);
    }

    delay(5000);
}`;
  }

  getAudioClassificationCode() {
    return `#include <Arduino.h>
#include "inference.h"

InferenceEngine ai;

void setup() {
    Serial.begin(115200);

    if (!ai.begin()) {
        Serial.println("AI initialization failed!");
        while (1);
    }

    Serial.println("AI initialized - Audio Classification Demo");
}

void loop() {
    float* input = ai.getInputBuffer();

    // Fill with dummy audio features (replace with actual audio processing)
    for (int i = 0; i < ai.getInputSize(); i++) {
        input[i] = (float)random(-32768, 32767) / 32768.0;
    }

    if (ai.runInference()) {
        float* output = ai.getOutputBuffer();
        Serial.printf("Audio classes - Background: %.2f, Speech: %.2f, Music: %.2f\\n",
                     output[0], output[1], output[2]);
    }

    delay(1000);
}`;
  }

  getGestureRecognitionCode() {
    return `#include <Arduino.h>
#include <Arduino_LSM9DS1.h>
#include "inference.h"

InferenceEngine ai;

void setup() {
    Serial.begin(9600);
    while (!Serial);

    if (!IMU.begin()) {
        Serial.println("IMU initialization failed!");
        while (1);
    }

    if (!ai.begin()) {
        Serial.println("AI initialization failed!");
        while (1);
    }

    Serial.println("AI initialized - Gesture Recognition Demo");
}

void loop() {
    float* input = ai.getInputBuffer();
    int inputIndex = 0;

    // Collect 42 samples (6 features x 7 readings)
    for (int sample = 0; sample < 7; sample++) {
        float x, y, z;

        if (IMU.accelerationAvailable()) {
            IMU.readAcceleration(x, y, z);
            input[inputIndex++] = x;
            input[inputIndex++] = y;
            input[inputIndex++] = z;
        }

        if (IMU.gyroscopeAvailable()) {
            IMU.readGyroscope(x, y, z);
            input[inputIndex++] = x;
            input[inputIndex++] = y;
            input[inputIndex++] = z;
        }

        delay(10);
    }

    if (ai.runInference()) {
        float* output = ai.getOutputBuffer();

        const char* gestures[] = {"Idle", "Flick", "Tilt", "Shake"};
        int predicted_gesture = 0;
        float max_prob = 0;

        for (int i = 0; i < 4; i++) {
            if (output[i] > max_prob) {
                max_prob = output[i];
                predicted_gesture = i;
            }
        }

        Serial.printf("Gesture: %s (confidence: %.2f)\\n",
                     gestures[predicted_gesture], max_prob);
    }

    delay(1000);
}`;
  }

  getAnomalyDetectionCode() {
    return `#include <Arduino.h>
#include "inference.h"

InferenceEngine ai;

void setup() {
    Serial.begin(115200);

    if (!ai.begin()) {
        Serial.println("AI initialization failed!");
        while (1);
    }

    Serial.println("AI initialized - Anomaly Detection Demo");
}

void loop() {
    float* input = ai.getInputBuffer();

    // Fill with sensor readings (replace with actual sensors)
    input[0] = analogRead(A0) / 1023.0;  // Temperature
    input[1] = analogRead(A1) / 1023.0;  // Pressure
    input[2] = analogRead(A2) / 1023.0;  // Vibration
    input[3] = analogRead(A3) / 1023.0;  // Current
    input[4] = analogRead(A4) / 1023.0;  // Voltage
    // ... more sensor readings

    if (ai.runInference()) {
        float* output = ai.getOutputBuffer();
        float anomaly_score = output[0];

        if (anomaly_score > 0.8) {
            Serial.printf("ANOMALY DETECTED! Score: %.2f\\n", anomaly_score);
        } else {
            Serial.printf("Normal operation. Score: %.2f\\n", anomaly_score);
        }
    }

    delay(1000);
}`;
  }

  getObjectDetectionCode() {
    return `#include <Arduino.h>
#include "inference.h"

InferenceEngine ai;

void setup() {
    Serial.begin(115200);

    if (!ai.begin()) {
        Serial.println("AI initialization failed!");
        while (1);
    }

    Serial.println("AI initialized - Object Detection Demo");
}

void loop() {
    float* input = ai.getInputBuffer();

    // Fill with dummy image data (96x96 RGB)
    // Replace with actual camera capture
    for (int i = 0; i < ai.getInputSize(); i++) {
        input[i] = (float)random(0, 255) / 255.0;
    }

    if (ai.runInference()) {
        float* output = ai.getOutputBuffer();

        // Parse detection results (5 boxes)
        for (int box = 0; box < 5; box++) {
            int offset = box * 6;
            float x = output[offset];
            float y = output[offset + 1];
            float w = output[offset + 2];
            float h = output[offset + 3];
            float confidence = output[offset + 4];
            int class_id = (int)output[offset + 5];

            if (confidence > 0.5) {
                Serial.printf("Detection: Class %d at (%.2f,%.2f) size %.2fx%.2f conf %.2f\\n",
                             class_id, x, y, w, h, confidence);
            }
        }
    }

    delay(5000);
}`;
  }

  /**
   * Get model by ID
   */
  getModel(modelId) {
    return this.models.get(modelId);
  }

  /**
   * Get all models
   */
  getAllModels() {
    return Array.from(this.models.values());
  }

  /**
   * Get deployment by ID
   */
  getDeployment(deploymentId) {
    return this.deployments.get(deploymentId);
  }

  /**
   * Delete model
   */
  async deleteModel(modelId) {
    const model = this.models.get(modelId);
    if (!model) return;

    try {
      // Remove model directory
      await fs.rmdir(model.path, { recursive: true });
      this.models.delete(modelId);

      // Remove associated deployments
      for (const [depId, deployment] of this.deployments) {
        if (deployment.modelId === modelId) {
          this.deployments.delete(depId);
        }
      }

    } catch (error) {
      console.error('Error deleting TFLite model:', error);
    }
  }
}

module.exports = new TFLiteService();