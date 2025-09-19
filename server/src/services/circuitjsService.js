/**
 * CircuitJS Integration Service
 * Provides interactive circuit simulation using CircuitJS
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class CircuitJSSimulator {
  constructor() {
    this.circuits = new Map();
    this.templates = new Map();
    this.loadTemplates();
  }

  /**
   * Load circuit templates
   */
  async loadTemplates() {
    // Basic component templates
    this.templates.set('resistor', {
      type: 'resistor',
      template: '$ 1 0.000005 10.20027730826997 50 5 50\nr 176 144 272 144 0 1000\n',
      properties: { resistance: 1000 }
    });

    this.templates.set('capacitor', {
      type: 'capacitor',
      template: '$ 1 0.000005 10.20027730826997 50 5 50\nc 176 144 272 144 0 0.000001 0.0001\n',
      properties: { capacitance: 0.000001 }
    });

    this.templates.set('inductor', {
      type: 'inductor',
      template: '$ 1 0.000005 10.20027730826997 50 5 50\nl 176 144 272 144 0 0.001\n',
      properties: { inductance: 0.001 }
    });

    this.templates.set('voltage_source', {
      type: 'voltage_source',
      template: '$ 1 0.000005 10.20027730826997 50 5 50\nv 176 144 176 64 0 0 40 5 0 0 0.5\n',
      properties: { voltage: 5, frequency: 0 }
    });

    this.templates.set('diode', {
      type: 'diode',
      template: '$ 1 0.000005 10.20027730826997 50 5 50\nd 176 144 272 144 1\n',
      properties: { model: 'default' }
    });

    this.templates.set('transistor_npn', {
      type: 'transistor_npn',
      template: '$ 1 0.000005 10.20027730826997 50 5 50\nt 224 144 272 144 0 1 -0.758716 1000000 0.758716 1000000\n',
      properties: { beta: 100 }
    });

    this.templates.set('opamp', {
      type: 'opamp',
      template: '$ 1 0.000005 10.20027730826997 50 5 50\no 3 64 0 224 144 272 144 2 2.5 1 0 0 1\n',
      properties: { gain: 100000 }
    });
  }

  /**
   * Convert circuit data to CircuitJS format
   */
  convertToCircuitJS(circuitData) {
    let circuitJS = '$ 1 0.000005 10.20027730826997 50 5 50\n'; // Header

    const { components = [], connections = [] } = circuitData;

    // Convert components
    components.forEach((component, index) => {
      const template = this.templates.get(component.type);
      if (template) {
        let componentLine = template.template;

        // Adjust positions based on component coordinates
        const x = component.x || (200 + index * 100);
        const y = component.y || 144;

        // Replace default positions with actual positions
        componentLine = componentLine.replace(/176 144/g, `${x} ${y}`);
        componentLine = componentLine.replace(/272 144/g, `${x + 96} ${y}`);

        circuitJS += componentLine;
      }
    });

    // Convert connections (wires)
    connections.forEach(connection => {
      const fromComp = components.find(c => c.id === connection.from.componentId);
      const toComp = components.find(c => c.id === connection.to.componentId);

      if (fromComp && toComp) {
        const fromX = fromComp.x + 96; // End of component
        const fromY = fromComp.y;
        const toX = toComp.x; // Start of next component
        const toY = toComp.y;

        circuitJS += `w ${fromX} ${fromY} ${toX} ${toY} 0\n`;
      }
    });

    return circuitJS;
  }

  /**
   * Generate circuit from natural language description
   */
  async generateCircuitFromDescription(description) {
    // This would use AI to parse the description and create circuit
    // For now, return a basic template based on keywords

    const circuit = {
      components: [],
      connections: [],
      metadata: {
        description,
        generated: true,
        timestamp: new Date().toISOString()
      }
    };

    // Simple keyword-based circuit generation
    if (description.toLowerCase().includes('led') && description.toLowerCase().includes('button')) {
      circuit.components = [
        {
          id: 'arduino-uno-1',
          type: 'arduino-uno',
          name: 'Arduino Uno',
          x: 100,
          y: 144,
          properties: {}
        },
        {
          id: 'led-1',
          type: 'led',
          name: 'LED',
          x: 300,
          y: 144,
          properties: { color: 'red' }
        },
        {
          id: 'button-1',
          type: 'push-button',
          name: 'Push Button',
          x: 500,
          y: 144,
          properties: {}
        }
      ];

      circuit.connections = [
        {
          id: 'conn-1',
          from: { componentId: 'arduino-uno-1', pin: 'D13' },
          to: { componentId: 'led-1', pin: 'positive' },
          type: 'wire'
        },
        {
          id: 'conn-2',
          from: { componentId: 'arduino-uno-1', pin: 'D2' },
          to: { componentId: 'button-1', pin: 'output' },
          type: 'wire'
        }
      ];
    }

    return circuit;
  }

  /**
   * Create interactive simulation
   */
  async createSimulation(circuitData, options = {}) {
    const {
      width = 800,
      height = 600,
      interactive = true,
      showValues = true
    } = options;

    const circuitJS = this.convertToCircuitJS(circuitData);
    const simulationId = uuidv4();

    const simulation = {
      id: simulationId,
      circuitJS,
      width,
      height,
      interactive,
      showValues,
      created: new Date().toISOString(),
      circuitData
    };

    this.circuits.set(simulationId, simulation);

    return {
      simulationId,
      circuitJS,
      embedCode: this.generateEmbedCode(simulation),
      url: `/simulation/${simulationId}`
    };
  }

  /**
   * Generate HTML embed code for CircuitJS
   */
  generateEmbedCode(simulation) {
    const { circuitJS, width, height } = simulation;

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Circuit Simulation</title>
  <script src="https://www.falstad.com/circuit/circuitjs1.js"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
    .simulation-container { border: 1px solid #ccc; border-radius: 8px; overflow: hidden; }
    .controls { margin-top: 10px; display: flex; gap: 10px; }
    button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    .run-btn { background: #4CAF50; color: white; }
    .stop-btn { background: #f44336; color: white; }
    .reset-btn { background: #2196F3; color: white; }
  </style>
</head>
<body>
  <h2>Circuit Simulation</h2>
  <div class="simulation-container">
    <canvas id="circuitCanvas" width="${width}" height="${height}"></canvas>
  </div>
  <div class="controls">
    <button class="run-btn" onclick="runSimulation()">Run</button>
    <button class="stop-btn" onclick="stopSimulation()">Stop</button>
    <button class="reset-btn" onclick="resetSimulation()">Reset</button>
  </div>

  <script>
    let circuit = null;

    function initCircuit() {
      const canvas = document.getElementById('circuitCanvas');
      circuit = new CircuitJS1(canvas);

      // Load circuit data
      const circuitData = \`${circuitJS.replace(/`/g, '\\`')}\`;
      circuit.loadCircuit(circuitData);
    }

    function runSimulation() {
      if (circuit) {
        circuit.start();
      }
    }

    function stopSimulation() {
      if (circuit) {
        circuit.stop();
      }
    }

    function resetSimulation() {
      if (circuit) {
        circuit.reset();
      }
    }

    // Initialize when page loads
    window.onload = initCircuit;
  </script>
</body>
</html>`;
  }

  /**
   * Analyze circuit for issues
   */
  async analyzeCircuit(circuitData) {
    const issues = [];
    const warnings = [];
    const suggestions = [];

    const { components = [], connections = [] } = circuitData;

    // Check for unconnected components
    components.forEach(component => {
      const hasConnections = connections.some(conn =>
        conn.from.componentId === component.id || conn.to.componentId === component.id
      );

      if (!hasConnections) {
        warnings.push({
          type: 'unconnected',
          component: component.name,
          message: `${component.name} is not connected to any other component`
        });
      }
    });

    // Check for power sources
    const hasPowerSource = components.some(comp =>
      comp.type.includes('voltage') || comp.type.includes('arduino')
    );

    if (!hasPowerSource) {
      issues.push({
        type: 'no_power',
        severity: 'error',
        message: 'No power source found in circuit'
      });
    }

    // Check for ground connections
    const hasGround = components.some(comp =>
      comp.type.includes('arduino') || connections.some(conn =>
        conn.type === 'ground' || conn.to.pin === 'GND'
      )
    );

    if (!hasGround) {
      warnings.push({
        type: 'no_ground',
        message: 'No ground connection detected'
      });
    }

    // Generate suggestions
    if (components.length > 10) {
      suggestions.push({
        type: 'optimization',
        message: 'Consider breaking circuit into smaller modules'
      });
    }

    return {
      issues,
      warnings,
      suggestions,
      score: this.calculateCircuitScore(issues, warnings)
    };
  }

  /**
   * Calculate circuit quality score
   */
  calculateCircuitScore(issues, warnings) {
    let score = 100;

    // Deduct points for issues
    score -= issues.length * 20;
    score -= warnings.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Export circuit in various formats
   */
  async exportCircuit(circuitData, format = 'circuitjs') {
    switch (format) {
      case 'circuitjs':
        return this.convertToCircuitJS(circuitData);

      case 'spice':
        return this.convertToSPICE(circuitData);

      case 'json':
        return JSON.stringify(circuitData, null, 2);

      case 'svg':
        return this.generateSVG(circuitData);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert to SPICE format for advanced simulation
   */
  convertToSPICE(circuitData) {
    let spice = '* Circuit generated by AI-Embedded Platform\n\n';

    const { components = [], connections = [] } = circuitData;

    // Add components
    components.forEach((comp, index) => {
      const node1 = index * 2 + 1;
      const node2 = index * 2 + 2;

      switch (comp.type) {
        case 'resistor':
          spice += `R${index + 1} ${node1} ${node2} ${comp.properties?.resistance || 1000}\n`;
          break;
        case 'capacitor':
          spice += `C${index + 1} ${node1} ${node2} ${comp.properties?.capacitance || 0.000001}\n`;
          break;
        case 'inductor':
          spice += `L${index + 1} ${node1} ${node2} ${comp.properties?.inductance || 0.001}\n`;
          break;
        case 'voltage_source':
          spice += `V${index + 1} ${node1} ${node2} DC ${comp.properties?.voltage || 5}\n`;
          break;
      }
    });

    spice += '\n.op\n.end\n';

    return spice;
  }

  /**
   * Generate SVG representation
   */
  generateSVG(circuitData) {
    const { components = [] } = circuitData;

    let svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>`;

    components.forEach((comp, index) => {
      const x = comp.x || (100 + index * 150);
      const y = comp.y || 200;

      // Draw component as rectangle with label
      svg += `
        <rect x="${x}" y="${y}" width="80" height="40" fill="#ffffff" stroke="#007bff" stroke-width="2" rx="5"/>
        <text x="${x + 40}" y="${y + 25}" text-anchor="middle" font-family="Arial" font-size="12">${comp.name}</text>`;
    });

    svg += '\n</svg>';
    return svg;
  }

  /**
   * Get simulation by ID
   */
  getSimulation(simulationId) {
    return this.circuits.get(simulationId);
  }

  /**
   * Delete simulation
   */
  deleteSimulation(simulationId) {
    return this.circuits.delete(simulationId);
  }

  /**
   * Get all active simulations
   */
  getActiveSimulations() {
    return Array.from(this.circuits.values());
  }
}

module.exports = new CircuitJSSimulator();