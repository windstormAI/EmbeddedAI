/**
 * AI Circuit Generator Service
 * Generates complete circuit designs from natural language prompts
 */

const OpenAI = require('openai');
const mongoose = require('mongoose');

class AICircuitGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION
    });

    this.model = process.env.AI_MODEL || 'gpt-4';
    this.temperature = 0.7;
    this.maxTokens = 4000;

    // Component library for AI reference
    this.componentLibrary = {
      microcontrollers: {
        'arduino-uno': {
          name: 'Arduino Uno',
          pins: 20,
          voltage: 5.0,
          digitalPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          analogPins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
          pwmPins: [3, 5, 6, 9, 10, 11],
          communication: ['UART', 'I2C', 'SPI']
        },
        'esp32': {
          name: 'ESP32-WROOM-32',
          pins: 38,
          voltage: 3.3,
          digitalPins: Array.from({length: 34}, (_, i) => i),
          analogPins: Array.from({length: 18}, (_, i) => i),
          pwmPins: Array.from({length: 16}, (_, i) => i),
          communication: ['WiFi', 'Bluetooth', 'UART', 'I2C', 'SPI']
        },
        'raspberry-pi-pico': {
          name: 'Raspberry Pi Pico',
          pins: 40,
          voltage: 3.3,
          digitalPins: Array.from({length: 26}, (_, i) => i),
          analogPins: Array.from({length: 3}, (_, i) => i),
          pwmPins: Array.from({length: 16}, (_, i) => i),
          communication: ['UART', 'I2C', 'SPI']
        }
      },
      sensors: {
        'dht22': {
          name: 'DHT22 Temperature & Humidity',
          pins: 3,
          interface: 'digital',
          voltage: 3.3,
          measurements: ['temperature', 'humidity']
        },
        'mpu6050': {
          name: 'MPU6050 IMU',
          pins: 4,
          interface: 'i2c',
          voltage: 3.3,
          measurements: ['accelerometer', 'gyroscope', 'temperature']
        },
        'bh1750': {
          name: 'BH1750 Light Sensor',
          pins: 4,
          interface: 'i2c',
          voltage: 3.3,
          measurements: ['lux']
        },
        'ultrasonic-hc-sr04': {
          name: 'HC-SR04 Ultrasonic',
          pins: 4,
          interface: 'digital',
          voltage: 5.0,
          measurements: ['distance']
        }
      },
      actuators: {
        'led': {
          name: 'LED',
          pins: 2,
          interface: 'digital',
          voltage: 3.3,
          type: 'output'
        },
        'buzzer': {
          name: 'Active Buzzer',
          pins: 2,
          interface: 'digital',
          voltage: 5.0,
          type: 'output'
        },
        'servo-motor': {
          name: 'SG90 Servo Motor',
          pins: 3,
          interface: 'pwm',
          voltage: 5.0,
          type: 'actuator'
        },
        'dc-motor': {
          name: 'DC Motor',
          pins: 2,
          interface: 'digital',
          voltage: 5.0,
          type: 'actuator'
        }
      },
      displays: {
        'oled-ssd1306': {
          name: '0.96" OLED Display',
          pins: 4,
          interface: 'i2c',
          voltage: 3.3,
          resolution: '128x64'
        },
        'lcd-1602': {
          name: '16x2 LCD Display',
          pins: 6,
          interface: 'digital',
          voltage: 5.0,
          resolution: '16x2'
        }
      },
      communication: {
        'esp8266': {
          name: 'ESP8266 WiFi Module',
          pins: 8,
          interface: 'serial',
          voltage: 3.3,
          features: ['WiFi']
        },
        'hc-05': {
          name: 'HC-05 Bluetooth',
          pins: 6,
          interface: 'serial',
          voltage: 5.0,
          features: ['Bluetooth']
        }
      }
    };
  }

  /**
   * Generate complete circuit design from natural language prompt
   */
  async generateCircuit(prompt, options = {}) {
    try {
      const {
        boardType = 'arduino-uno',
        complexity = 'intermediate',
        include3d = true,
        generateCode = true
      } = options;

      console.log('[AI Circuit Generator] Processing prompt:', prompt);

      // Step 1: Analyze the prompt to understand requirements
      const analysis = await this.analyzePrompt(prompt, boardType);

      // Step 2: Design the circuit based on analysis
      const circuitDesign = await this.designCircuit(analysis, boardType, complexity);

      // Step 3: Generate 3D representation if requested
      let threeDModel = null;
      if (include3d) {
        threeDModel = await this.generate3DModel(circuitDesign);
      }

      // Step 4: Generate code if requested
      let generatedCode = null;
      if (generateCode) {
        generatedCode = await this.generateCircuitCode(circuitDesign, boardType);
      }

      // Step 5: Create comprehensive response
      const result = {
        success: true,
        data: {
          components: circuitDesign.components,
          connections: circuitDesign.connections,
          layout: circuitDesign.layout,
          specifications: circuitDesign.specifications,
          code: generatedCode,
          threeDModel: threeDModel,
          explanation: this.generateExplanation(circuitDesign, analysis),
          billOfMaterials: this.generateBOM(circuitDesign),
          powerRequirements: this.calculatePowerRequirements(circuitDesign),
          complexity: complexity,
          estimatedCost: this.calculateCost(circuitDesign)
        },
        metadata: {
          prompt: prompt,
          boardType: boardType,
          generatedAt: new Date().toISOString(),
          aiModel: this.model,
          processingTime: Date.now() - Date.now() // Would track actual time
        }
      };

      console.log('[AI Circuit Generator] Circuit generated successfully');
      return result;

    } catch (error) {
      console.error('[AI Circuit Generator] Error:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Analyze natural language prompt to extract circuit requirements
   */
  async analyzePrompt(prompt, boardType) {
    const systemPrompt = `You are an expert embedded systems engineer. Analyze the following natural language description and extract the key circuit requirements.

Board Type: ${boardType}

Extract the following information:
1. Primary function/purpose of the circuit
2. Input devices (sensors, buttons, etc.)
3. Output devices (LEDs, motors, displays, etc.)
4. Communication requirements (WiFi, Bluetooth, etc.)
5. Power requirements
6. Any specific constraints or requirements
7. Complexity level (beginner, intermediate, advanced)

Return the analysis as a JSON object with these fields.`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const analysisText = response.choices[0]?.message?.content?.trim();
    return this.parseAnalysisResponse(analysisText);
  }

  /**
   * Design the actual circuit based on analysis
   */
  async designCircuit(analysis, boardType, complexity) {
    const systemPrompt = `You are an expert circuit designer. Design a complete circuit based on the following analysis.

Board Type: ${boardType}
Complexity: ${complexity}

Analysis: ${JSON.stringify(analysis, null, 2)}

Design Requirements:
1. Select appropriate components from the available library
2. Determine optimal pin assignments
3. Design the circuit connections
4. Consider power requirements and voltage levels
5. Ensure component compatibility
6. Optimize for the specified complexity level

Return a complete circuit design as a JSON object with:
- components: array of component objects with id, type, position, pin assignments
- connections: array of connection objects with from/to components and pins
- layout: 2D positioning information
- specifications: technical specifications
- powerRequirements: power consumption details`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the circuit design based on the analysis above.' }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });

    const designText = response.choices[0]?.message?.content?.trim();
    return this.parseCircuitDesign(designText);
  }

  /**
   * Generate 3D model representation
   */
  async generate3DModel(circuitDesign) {
    // This would integrate with a 3D modeling service or generate
    // Three.js compatible geometry data
    return {
      components: circuitDesign.components.map(comp => ({
        id: comp.id,
        type: comp.type,
        position: comp.position,
        rotation: comp.rotation || [0, 0, 0],
        scale: comp.scale || [1, 1, 1],
        geometry: this.getComponentGeometry(comp.type),
        material: this.getComponentMaterial(comp.type)
      })),
      connections: circuitDesign.connections.map(conn => ({
        from: conn.from,
        to: conn.to,
        path: this.calculateWirePath(conn),
        material: { color: '#000000', wireframe: false }
      })),
      board: {
        type: circuitDesign.boardType,
        dimensions: this.getBoardDimensions(circuitDesign.boardType),
        position: [0, 0, 0],
        holes: this.generateBoardHoles(circuitDesign)
      }
    };
  }

  /**
   * Generate Arduino/C++ code for the circuit
   */
  async generateCircuitCode(circuitDesign, boardType) {
    const systemPrompt = `You are an expert Arduino/C++ programmer. Generate complete, working code for the following circuit design.

Board Type: ${boardType}
Circuit Design: ${JSON.stringify(circuitDesign, null, 2)}

Requirements:
1. Include all necessary libraries
2. Proper pin definitions
3. Setup and loop functions
4. Error handling
5. Comments explaining the code
6. Best practices for Arduino programming
7. Handle all sensors and actuators in the design

Generate production-ready code that can be uploaded directly to the board.`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the complete Arduino code for this circuit.' }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    return response.choices[0]?.message?.content?.trim();
  }

  /**
   * Refine existing circuit design with additional requirements
   */
  async refineCircuit(originalDesign, refinementPrompt, currentComponents, currentConnections) {
    const systemPrompt = `You are an expert circuit designer. Refine the existing circuit design based on the new requirements.

Original Design: ${JSON.stringify(originalDesign, null, 2)}
Current Components: ${JSON.stringify(currentComponents, null, 2)}
Current Connections: ${JSON.stringify(currentConnections, null, 2)}
Refinement Request: ${refinementPrompt}

Analyze the refinement request and:
1. Identify what changes are needed
2. Suggest component additions, removals, or modifications
3. Update pin assignments if necessary
4. Modify connections as required
5. Ensure the refined design meets all requirements

Return the refined design with detailed change explanations.`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Refine the circuit design based on the requirements.' }
      ],
      temperature: 0.4,
      max_tokens: 2000
    });

    const refinementText = response.choices[0]?.message?.content?.trim();
    return this.parseRefinementResponse(refinementText);
  }

  // Helper methods

  parseAnalysisResponse(text) {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
      return JSON.parse(jsonMatch[1] || text);
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      return {
        function: 'Unknown',
        inputs: [],
        outputs: [],
        communication: [],
        constraints: [],
        complexity: 'intermediate'
      };
    }
  }

  parseCircuitDesign(text) {
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
      const design = JSON.parse(jsonMatch[1] || text);

      return {
        components: design.components || [],
        connections: design.connections || [],
        layout: design.layout || {},
        specifications: design.specifications || {},
        boardType: design.boardType || 'arduino-uno'
      };
    } catch (error) {
      console.error('Failed to parse circuit design:', error);
      return {
        components: [],
        connections: [],
        layout: {},
        specifications: {},
        boardType: 'arduino-uno'
      };
    }
  }

  parseRefinementResponse(text) {
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
      return JSON.parse(jsonMatch[1] || text);
    } catch (error) {
      console.error('Failed to parse refinement response:', error);
      return {
        components: [],
        connections: [],
        changes: [],
        explanation: 'Refinement parsing failed'
      };
    }
  }

  getComponentGeometry(type) {
    // Return Three.js geometry data for different component types
    const geometries = {
      'arduino-uno': { type: 'box', width: 6.8, height: 0.8, depth: 5.3 },
      'esp32': { type: 'box', width: 5.0, height: 0.8, depth: 2.5 },
      'led': { type: 'cylinder', radiusTop: 0.3, radiusBottom: 0.3, height: 0.5 },
      'dht22': { type: 'box', width: 1.5, height: 0.8, depth: 1.0 },
      'servo-motor': { type: 'box', width: 2.0, height: 1.5, depth: 2.0 }
    };

    return geometries[type] || { type: 'box', width: 1.0, height: 0.5, depth: 1.0 };
  }

  getComponentMaterial(type) {
    const materials = {
      'arduino-uno': { color: '#00979C', metalness: 0.1, roughness: 0.8 },
      'esp32': { color: '#E7352C', metalness: 0.1, roughness: 0.8 },
      'led': { color: '#FFD700', metalness: 0.0, roughness: 0.2, emissive: '#FFD700' },
      'dht22': { color: '#FFFFFF', metalness: 0.0, roughness: 0.9 }
    };

    return materials[type] || { color: '#CCCCCC', metalness: 0.0, roughness: 0.8 };
  }

  getBoardDimensions(boardType) {
    const dimensions = {
      'arduino-uno': { width: 6.8, height: 0.8, depth: 5.3 },
      'esp32': { width: 5.0, height: 0.8, depth: 2.5 },
      'raspberry-pi-pico': { width: 5.1, height: 0.8, depth: 2.1 }
    };

    return dimensions[boardType] || { width: 5.0, height: 0.8, depth: 3.0 };
  }

  generateBoardHoles(design) {
    // Generate mounting holes and component placement holes
    const holes = [];
    const boardDims = this.getBoardDimensions(design.boardType);

    // Corner mounting holes
    holes.push(
      { x: 1.0, y: 0, z: 1.0, radius: 0.15 },
      { x: boardDims.width - 1.0, y: 0, z: 1.0, radius: 0.15 },
      { x: 1.0, y: 0, z: boardDims.depth - 1.0, radius: 0.15 },
      { x: boardDims.width - 1.0, y: 0, z: boardDims.depth - 1.0, radius: 0.15 }
    );

    return holes;
  }

  calculateWirePath(connection) {
    // Calculate curved path for wires in 3D space
    const fromPos = connection.from.position;
    const toPos = connection.to.position;

    // Create a smooth curve
    const midPoint = {
      x: (fromPos.x + toPos.x) / 2,
      y: Math.max(fromPos.y, toPos.y) + 2,
      z: (fromPos.z + toPos.z) / 2
    };

    return [fromPos, midPoint, toPos];
  }

  generateExplanation(design, analysis) {
    return {
      overview: `This circuit implements ${analysis.function || 'the requested functionality'} using ${design.components.length} components.`,
      components: design.components.map(comp => `${comp.name} for ${comp.purpose || 'circuit functionality'}`),
      connections: `${design.connections.length} electrical connections between components`,
      power: `Operates at ${design.specifications.voltage || 'appropriate'} voltage levels`,
      features: analysis.features || []
    };
  }

  generateBOM(design) {
    return design.components.map(comp => ({
      name: comp.name,
      type: comp.type,
      quantity: 1,
      estimatedCost: this.getComponentCost(comp.type),
      supplier: 'Various',
      specifications: comp.specifications || {}
    }));
  }

  calculatePowerRequirements(design) {
    let totalCurrent = 0;
    let maxVoltage = 0;

    design.components.forEach(comp => {
      const compData = this.getComponentData(comp.type);
      if (compData) {
        totalCurrent += compData.current || 0.02; // Default 20mA
        maxVoltage = Math.max(maxVoltage, compData.voltage || 5.0);
      }
    });

    return {
      totalCurrent: totalCurrent,
      maxVoltage: maxVoltage,
      recommendedPowerSupply: `${maxVoltage}V, ${Math.ceil(totalCurrent * 1000)}mA`,
      powerSource: maxVoltage <= 3.3 ? 'USB or Battery' : 'External Power Supply'
    };
  }

  calculateCost(design) {
    let totalCost = 0;
    design.components.forEach(comp => {
      totalCost += this.getComponentCost(comp.type);
    });

    return {
      components: totalCost,
      estimatedTotal: totalCost * 1.5, // Include wires, breadboard, etc.
      currency: 'USD'
    };
  }

  getComponentData(type) {
    // Search through all component categories
    for (const category of Object.values(this.componentLibrary)) {
      if (category[type]) {
        return category[type];
      }
    }
    return null;
  }

  getComponentCost(type) {
    const costMap = {
      'arduino-uno': 23.00,
      'esp32': 15.00,
      'raspberry-pi-pico': 4.00,
      'dht22': 5.50,
      'mpu6050': 4.50,
      'bh1750': 3.50,
      'led': 0.50,
      'buzzer': 2.00,
      'servo-motor': 5.00,
      'oled-ssd1306': 8.00,
      'ultrasonic-hc-sr04': 3.00
    };

    return costMap[type] || 2.00; // Default cost
  }
}

module.exports = new AICircuitGenerator();