/**
 * Circuit Simulation Service
 * Advanced circuit analysis and simulation engine
 */

class SimulationService {
  constructor() {
    this.simulationStates = new Map();
    this.componentLibrary = this.initializeComponentLibrary();
  }

  /**
   * Initialize component library with electrical properties
   */
  initializeComponentLibrary() {
    return {
      // Microcontrollers
      'arduino-uno': {
        type: 'microcontroller',
        pins: 20,
        voltage: 5.0,
        currentDraw: 50, // mA
        adcResolution: 10,
        pwmPins: [3, 5, 6, 9, 10, 11],
        analogPins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
        flashMemory: 32, // KB
        sram: 2, // KB
        eeprom: 1, // KB
        clockSpeed: 16, // MHz
        digitalPins: 14,
        operatingTemp: [-40, 85] // Celsius
      },
      'esp32': {
        type: 'microcontroller',
        pins: 38,
        voltage: 3.3,
        currentDraw: 80,
        adcResolution: 12,
        pwmPins: Array.from({length: 16}, (_, i) => i),
        analogPins: Array.from({length: 18}, (_, i) => `A${i}`),
        flashMemory: 512, // KB
        sram: 520, // KB
        psram: 8, // MB (external)
        clockSpeed: 240, // MHz
        wifi: true,
        bluetooth: true,
        operatingTemp: [-40, 125] // Celsius
      },
      'esp8266': {
        type: 'microcontroller',
        pins: 17,
        voltage: 3.3,
        currentDraw: 80,
        adcResolution: 10,
        pwmPins: [0, 2, 4, 5, 12, 13, 14, 15, 16],
        analogPins: ['A0'],
        flashMemory: 512, // KB
        sram: 80, // KB
        clockSpeed: 80, // MHz
        wifi: true,
        operatingTemp: [-40, 125] // Celsius
      },

      // Sensors
      'temperature-sensor': {
        type: 'sensor',
        interface: 'analog',
        voltage: 5.0,
        currentDraw: 1,
        outputRange: [0, 1023],
        physicalRange: [-40, 125], // Celsius
        accuracy: 0.5,
        responseTime: 1000, // ms
        operatingTemp: [-55, 150] // Celsius
      },
      'photoresistor': {
        type: 'sensor',
        interface: 'analog',
        voltage: 5.0,
        currentDraw: 0.5,
        outputRange: [0, 1023],
        physicalRange: [0, 100000], // Lux
        responseTime: 20, // ms
        darkResistance: 200000, // ohms
        lightResistance: 1000 // ohms
      },
      'potentiometer': {
        type: 'sensor',
        interface: 'analog',
        voltage: 5.0,
        currentDraw: 0.1,
        outputRange: [0, 1023],
        resistance: 10000, // ohms
        tolerance: 10, // %
        powerRating: 0.5 // W
      },
      'ultrasonic-sensor': {
        type: 'sensor',
        interface: 'digital',
        voltage: 5.0,
        currentDraw: 15, // mA
        triggerPin: 'digital',
        echoPin: 'digital',
        range: [2, 400], // cm
        accuracy: 0.3, // cm
        responseTime: 50 // ms
      },
      'motion-sensor': {
        type: 'sensor',
        interface: 'digital',
        voltage: 5.0,
        currentDraw: 50, // mA (peak)
        outputPin: 'digital',
        detectionRange: 7, // meters
        detectionAngle: 110, // degrees
        triggerTime: 2000 // ms
      },

      // Actuators
      'led': {
        type: 'actuator',
        interface: 'digital',
        forwardVoltage: 2.0,
        maxCurrent: 20, // mA
        wavelength: 570, // nm (yellow-green)
        luminousIntensity: 50, // mcd
        viewingAngle: 30, // degrees
        maxForwardCurrent: 30 // mA
      },
      'rgb-led': {
        type: 'actuator',
        interface: 'digital',
        forwardVoltage: 2.0,
        maxCurrent: 60, // mA (20mA per color)
        pins: ['red', 'green', 'blue'],
        wavelength: { red: 625, green: 525, blue: 470 }, // nm
        luminousIntensity: 800 // mcd total
      },
      'buzzer': {
        type: 'actuator',
        interface: 'digital',
        voltage: 5.0,
        currentDraw: 30, // mA
        frequencyRange: [100, 5000], // Hz
        soundPressure: 85, // dB
        operatingTemp: [-20, 70] // Celsius
      },
      'servo-motor': {
        type: 'actuator',
        interface: 'pwm',
        voltage: 5.0,
        currentDraw: 500, // mA (stall current)
        torque: 1.5, // kg/cm
        speed: 0.12, // sec/60°
        range: [0, 180], // degrees
        pulseWidth: [500, 2500] // microseconds
      },
      'dc-motor': {
        type: 'actuator',
        interface: 'digital',
        voltage: 5.0,
        currentDraw: 200, // mA (no load)
        stallCurrent: 1000, // mA
        rpm: 6000, // no load
        torque: 0.5 // kg/cm
      },

      // Communication modules
      'bluetooth-module': {
        type: 'communication',
        interface: 'serial',
        voltage: 3.3,
        currentDraw: 50, // mA
        range: 10, // meters
        baudRate: [9600, 115200],
        protocol: 'HC-05/06'
      },
      'wifi-module': {
        type: 'communication',
        interface: 'serial',
        voltage: 3.3,
        currentDraw: 250, // mA
        range: 50, // meters
        protocols: ['802.11b/g/n'],
        security: ['WPA', 'WPA2', 'WEP']
      },

      // Passive components
      'resistor': {
        type: 'passive',
        resistance: 1000, // ohms
        tolerance: 5, // %
        powerRating: 0.25, // W
        temperatureCoefficient: 100 // ppm/°C
      },
      'capacitor': {
        type: 'passive',
        capacitance: 0.000001, // 1uF
        voltageRating: 16,
        tolerance: 10, // %
        esr: 0.1, // ohms
        leakageCurrent: 0.01 // uA
      },
      'inductor': {
        type: 'passive',
        inductance: 0.001, // 1mH
        currentRating: 1, // A
        dcResistance: 0.5, // ohms
        tolerance: 10 // %
      },
      'diode': {
        type: 'passive',
        forwardVoltage: 0.7, // V
        maxCurrent: 1000, // mA
        reverseVoltage: 50, // V
        switchingSpeed: 4 // ns
      },
      'transistor': {
        type: 'active',
        type: 'NPN', // or PNP
        collectorCurrent: 800, // mA
        collectorEmitterVoltage: 45, // V
        dcCurrentGain: 100,
        transitionFrequency: 300 // MHz
      }
    };
  }

  /**
   * Start circuit simulation
   */
  startSimulation(circuitId, circuitData) {
    const simulationState = {
      id: circuitId,
      circuitData,
      isRunning: true,
      startTime: Date.now(),
      currentTime: 0,
      sensorValues: this.initializeSensorValues(circuitData.components),
      outputValues: this.initializeOutputValues(circuitData.components),
      powerConsumption: 0,
      warnings: [],
      errors: []
    };

    this.simulationStates.set(circuitId, simulationState);
    return simulationState;
  }

  /**
   * Stop circuit simulation
   */
  stopSimulation(circuitId) {
    const simulation = this.simulationStates.get(circuitId);
    if (simulation) {
      simulation.isRunning = false;
      simulation.endTime = Date.now();
      return simulation;
    }
    return null;
  }

  /**
   * Step through simulation
   */
  stepSimulation(circuitId, timeStep = 100) {
    const simulation = this.simulationStates.get(circuitId);
    if (!simulation || !simulation.isRunning) {
      return null;
    }

    simulation.currentTime += timeStep;

    // Update sensor values with some variation
    this.updateSensorValues(simulation);

    // Calculate circuit behavior
    this.calculateCircuitBehavior(simulation);

    // Check for circuit issues
    this.checkCircuitHealth(simulation);

    return simulation;
  }

  /**
   * Initialize sensor values
   */
  initializeSensorValues(components) {
    const sensorValues = {};

    components.forEach(component => {
      const componentSpec = this.componentLibrary[component.type];
      if (componentSpec && componentSpec.type === 'sensor') {
        sensorValues[component.id] = {
          value: this.getDefaultSensorValue(component.type),
          unit: this.getSensorUnit(component.type),
          timestamp: Date.now(),
          isConnected: true
        };
      }
    });

    return sensorValues;
  }

  /**
   * Initialize output values
   */
  initializeOutputValues(components) {
    const outputValues = {};

    components.forEach(component => {
      const componentSpec = this.componentLibrary[component.type];
      if (componentSpec && (componentSpec.type === 'actuator' || componentSpec.type === 'microcontroller')) {
        outputValues[component.id] = {
          state: 'idle',
          powerConsumption: componentSpec.currentDraw || 0,
          timestamp: Date.now()
        };
      }
    });

    return outputValues;
  }

  /**
   * Update sensor values with realistic variation
   */
  updateSensorValues(simulation) {
    Object.keys(simulation.sensorValues).forEach(componentId => {
      const sensor = simulation.sensorValues[componentId];
      const component = simulation.circuitData.components.find(c => c.id === componentId);

      if (component) {
        // Add some realistic variation
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        sensor.value = Math.max(0, sensor.value * (1 + variation));
        sensor.timestamp = Date.now();
      }
    });
  }

  /**
   * Calculate circuit behavior based on connections
   */
  calculateCircuitBehavior(simulation) {
    const { components, connections } = simulation.circuitData;

    // Reset all outputs
    Object.keys(simulation.outputValues).forEach(componentId => {
      simulation.outputValues[componentId].state = 'idle';
      simulation.outputValues[componentId].currentDraw = 0;
      simulation.outputValues[componentId].voltage = 0;
    });

    // Build circuit graph for analysis
    const circuitGraph = this.buildCircuitGraph(components, connections);

    // Analyze power distribution
    const powerAnalysis = this.analyzePowerDistribution(circuitGraph, components);

    // Process connections and update outputs
    connections.forEach(connection => {
      const fromComponent = components.find(c => c.id === connection.from.componentId);
      const toComponent = components.find(c => c.id === connection.to.componentId);

      if (fromComponent && toComponent) {
        this.processConnection(simulation, fromComponent, toComponent, connection, powerAnalysis);
      }
    });

    // Calculate total power consumption with more accuracy
    simulation.powerConsumption = this.calculateTotalPowerConsumption(simulation.outputValues, powerAnalysis);

    // Update circuit health based on power analysis
    this.updateCircuitHealthFromPower(simulation, powerAnalysis);
  }

  /**
   * Process individual connection
   */
  processConnection(simulation, fromComponent, toComponent, connection) {
    const fromSpec = this.componentLibrary[fromComponent.type];
    const toSpec = this.componentLibrary[toComponent.type];

    // Handle different connection types
    if (fromSpec.type === 'microcontroller' && toSpec.type === 'actuator') {
      // Microcontroller controlling actuator
      const output = simulation.outputValues[toComponent.id];
      if (output) {
        output.state = 'active';
        output.powerConsumption = toSpec.currentDraw || 0;
      }
    }

    if (fromSpec.type === 'sensor' && toSpec.type === 'microcontroller') {
      // Sensor feeding microcontroller
      const sensorValue = simulation.sensorValues[fromComponent.id];
      if (sensorValue) {
        // Simulate ADC conversion
        const adcValue = Math.round((sensorValue.value / this.getMaxSensorValue(fromComponent.type)) * 1023);
        sensorValue.adcValue = adcValue;
      }
    }
  }

  /**
   * Check circuit health and identify issues
   */
  checkCircuitHealth(simulation) {
    const { components, connections } = simulation.circuitData;
    simulation.warnings = [];
    simulation.errors = [];

    // Check for unconnected components
    components.forEach(component => {
      const hasConnections = connections.some(conn =>
        conn.from.componentId === component.id || conn.to.componentId === component.id
      );

      if (!hasConnections) {
        simulation.warnings.push({
          type: 'unconnected',
          componentId: component.id,
          message: `${component.name} is not connected to any other component`
        });
      }
    });

    // Check for power issues
    if (simulation.powerConsumption > 500) { // 500mA limit
      simulation.errors.push({
        type: 'power_overload',
        message: `Total power consumption (${simulation.powerConsumption}mA) exceeds safe limits`
      });
    }

    // Check for voltage compatibility
    this.checkVoltageCompatibility(simulation);
  }

  /**
   * Check voltage compatibility between components
   */
  checkVoltageCompatibility(simulation) {
    const { components, connections } = simulation.circuitData;

    connections.forEach(connection => {
      const fromComponent = components.find(c => c.id === connection.from.componentId);
      const toComponent = components.find(c => c.id === connection.to.componentId);

      if (fromComponent && toComponent) {
        const fromSpec = this.componentLibrary[fromComponent.type];
        const toSpec = this.componentLibrary[toComponent.type];

        if (fromSpec && toSpec && fromSpec.voltage && toSpec.voltage) {
          if (Math.abs(fromSpec.voltage - toSpec.voltage) > 0.5) {
            simulation.warnings.push({
              type: 'voltage_mismatch',
              components: [fromComponent.id, toComponent.id],
              message: `Voltage mismatch between ${fromComponent.name} (${fromSpec.voltage}V) and ${toComponent.name} (${toSpec.voltage}V)`
            });
          }
        }
      }
    });
  }

  /**
   * Get circuit analysis report
   */
  getCircuitAnalysis(circuitId) {
    const simulation = this.simulationStates.get(circuitId);
    if (!simulation) {
      return null;
    }

    const { components, connections } = simulation.circuitData;

    return {
      summary: {
        totalComponents: components.length,
        totalConnections: connections.length,
        powerConsumption: simulation.powerConsumption,
        simulationTime: simulation.currentTime,
        warningsCount: simulation.warnings.length,
        errorsCount: simulation.errors.length
      },
      components: components.map(comp => ({
        id: comp.id,
        name: comp.name,
        type: comp.type,
        connections: connections.filter(conn =>
          conn.from.componentId === comp.id || conn.to.componentId === comp.id
        ).length
      })),
      sensorValues: simulation.sensorValues,
      outputValues: simulation.outputValues,
      warnings: simulation.warnings,
      errors: simulation.errors,
      recommendations: this.generateRecommendations(simulation)
    };
  }

  /**
   * Generate circuit improvement recommendations
   */
  generateRecommendations(simulation) {
    const recommendations = [];

    // Power consumption recommendations
    if (simulation.powerConsumption > 300) {
      recommendations.push({
        type: 'power_optimization',
        priority: 'high',
        message: 'Consider using sleep modes or power management to reduce consumption',
        savings: `${Math.round(simulation.powerConsumption * 0.3)}mA potential savings`
      });
    }

    // Connection recommendations
    const unconnectedComponents = simulation.warnings.filter(w => w.type === 'unconnected');
    if (unconnectedComponents.length > 0) {
      recommendations.push({
        type: 'connectivity',
        priority: 'medium',
        message: `Connect ${unconnectedComponents.length} unconnected component(s) to complete the circuit`
      });
    }

    // Voltage compatibility recommendations
    const voltageWarnings = simulation.warnings.filter(w => w.type === 'voltage_mismatch');
    if (voltageWarnings.length > 0) {
      recommendations.push({
        type: 'voltage_compatibility',
        priority: 'high',
        message: 'Add voltage level shifters or regulators for incompatible components'
      });
    }

    return recommendations;
  }

  /**
   * Get default sensor value
   */
  getDefaultSensorValue(type) {
    switch (type) {
      case 'temperature-sensor': return 25; // Celsius
      case 'photoresistor': return 512; // Mid-range
      case 'potentiometer': return 512; // Mid-range
      default: return 0;
    }
  }

  /**
   * Get sensor unit
   */
  getSensorUnit(type) {
    switch (type) {
      case 'temperature-sensor': return '°C';
      case 'photoresistor': return '';
      case 'potentiometer': return '';
      default: return '';
    }
  }

  /**
   * Get maximum sensor value
   */
  getMaxSensorValue(type) {
    switch (type) {
      case 'temperature-sensor': return 100;
      case 'photoresistor': return 1023;
      case 'potentiometer': return 1023;
      default: return 100;
    }
  }

  /**
   * Clean up simulation state
   */
  cleanup(circuitId) {
    this.simulationStates.delete(circuitId);
  }

  /**
   * Get all active simulations
   */
  getActiveSimulations() {
    return Array.from(this.simulationStates.values()).filter(sim => sim.isRunning);
  }

  /**
   * Build circuit graph for analysis
   */
  buildCircuitGraph(components, connections) {
    const graph = {};

    // Initialize nodes
    components.forEach(component => {
      graph[component.id] = {
        component,
        spec: this.componentLibrary[component.type],
        connections: [],
        powerSource: false,
        powerSink: false
      };
    });

    // Add connections
    connections.forEach(connection => {
      const fromId = connection.from.componentId;
      const toId = connection.to.componentId;

      if (graph[fromId] && graph[toId]) {
        graph[fromId].connections.push({
          to: toId,
          type: connection.type,
          pin: connection.from.pin
        });
        graph[toId].connections.push({
          from: fromId,
          type: connection.type,
          pin: connection.to.pin
        });

        // Identify power sources and sinks
        const fromSpec = graph[fromId].spec;
        const toSpec = graph[toId].spec;

        if (fromSpec && fromSpec.type === 'microcontroller') {
          graph[fromId].powerSource = true;
        }
        if (toSpec && (toSpec.type === 'actuator' || toSpec.type === 'sensor')) {
          graph[toId].powerSink = true;
        }
      }
    });

    return graph;
  }

  /**
   * Analyze power distribution in the circuit
   */
  analyzePowerDistribution(circuitGraph, components) {
    const analysis = {
      totalPowerConsumption: 0,
      powerSources: [],
      powerSinks: [],
      voltageLevels: {},
      currentPaths: [],
      powerEfficiency: 100,
      warnings: [],
      errors: []
    };

    // Identify power sources and sinks
    Object.values(circuitGraph).forEach(node => {
      if (node.powerSource) {
        analysis.powerSources.push({
          id: node.component.id,
          voltage: node.spec.voltage,
          maxCurrent: node.spec.currentDraw
        });
      }
      if (node.powerSink) {
        analysis.powerSinks.push({
          id: node.component.id,
          currentDraw: node.spec.currentDraw,
          voltage: node.spec.voltage
        });
      }
    });

    // Calculate power consumption
    analysis.totalPowerConsumption = analysis.powerSinks.reduce((total, sink) => {
      return total + (sink.currentDraw || 0);
    }, 0);

    // Check for power issues
    analysis.powerSources.forEach(source => {
      if (analysis.totalPowerConsumption > source.maxCurrent) {
        analysis.errors.push({
          type: 'power_overload',
          message: `Power source ${source.id} overloaded: ${analysis.totalPowerConsumption}mA > ${source.maxCurrent}mA`
        });
      }
    });

    // Check voltage compatibility
    analysis.powerSources.forEach(source => {
      analysis.powerSinks.forEach(sink => {
        if (Math.abs(source.voltage - sink.voltage) > 0.5) {
          analysis.warnings.push({
            type: 'voltage_mismatch',
            message: `Voltage mismatch: ${source.id} (${source.voltage}V) → ${sink.id} (${sink.voltage}V)`
          });
        }
      });
    });

    return analysis;
  }

  /**
   * Process individual connection with enhanced logic
   */
  processConnection(simulation, fromComponent, toComponent, connection, powerAnalysis) {
    const fromSpec = this.componentLibrary[fromComponent.type];
    const toSpec = this.componentLibrary[toComponent.type];

    // Handle different connection types with more sophistication
    if (fromSpec.type === 'microcontroller' && toSpec.type === 'actuator') {
      this.processMicrocontrollerToActuator(simulation, fromComponent, toComponent, connection);
    } else if (fromSpec.type === 'sensor' && toSpec.type === 'microcontroller') {
      this.processSensorToMicrocontroller(simulation, fromComponent, toComponent, connection);
    } else if (fromSpec.type === 'microcontroller' && toSpec.type === 'communication') {
      this.processMicrocontrollerToCommunication(simulation, fromComponent, toComponent, connection);
    } else if (fromSpec.type === 'passive' && (toSpec.type === 'microcontroller' || toSpec.type === 'actuator')) {
      this.processPassiveComponent(simulation, fromComponent, toComponent, connection);
    } else {
      // Generic connection processing
      this.processGenericConnection(simulation, fromComponent, toComponent, connection);
    }
  }

  /**
   * Process microcontroller to actuator connection
   */
  processMicrocontrollerToActuator(simulation, fromComponent, toComponent, connection) {
    const output = simulation.outputValues[toComponent.id];
    if (!output) return;

    // Simulate PWM or digital output
    const pwmPin = this.componentLibrary[fromComponent.type].pwmPins;
    const isPwmPin = pwmPin && pwmPin.includes(parseInt(connection.from.pin));

    if (isPwmPin) {
      output.state = 'active_pwm';
      output.dutyCycle = Math.random() * 100; // Simulate varying PWM
      output.frequency = 490; // Hz for Arduino PWM
    } else {
      output.state = 'active_digital';
      output.digitalValue = Math.random() > 0.5 ? 1 : 0;
    }

    // Calculate power consumption
    const actuatorSpec = this.componentLibrary[toComponent.type];
    output.powerConsumption = actuatorSpec.currentDraw || 0;
    output.voltage = actuatorSpec.voltage || 5.0;
  }

  /**
   * Process sensor to microcontroller connection
   */
  processSensorToMicrocontroller(simulation, fromComponent, toComponent, connection) {
    const sensorValue = simulation.sensorValues[fromComponent.id];
    if (!sensorValue) return;

    // Simulate ADC conversion
    const microcontrollerSpec = this.componentLibrary[toComponent.type];
    const adcResolution = microcontrollerSpec.adcResolution || 10;
    const maxValue = Math.pow(2, adcResolution) - 1;

    // Convert sensor value to ADC reading
    const normalizedValue = (sensorValue.value - sensorValue.min) / (sensorValue.max - sensorValue.min);
    sensorValue.adcValue = Math.round(normalizedValue * maxValue);
    sensorValue.voltage = (sensorValue.adcValue / maxValue) * (microcontrollerSpec.voltage || 5.0);
  }

  /**
   * Process microcontroller to communication module connection
   */
  processMicrocontrollerToCommunication(simulation, fromComponent, toComponent, connection) {
    const output = simulation.outputValues[toComponent.id];
    if (!output) return;

    output.state = 'transmitting';
    output.dataRate = Math.floor(Math.random() * 115200) + 9600; // Random baud rate
    output.protocol = this.componentLibrary[toComponent.type].protocol || 'serial';

    // Communication modules have higher power consumption when active
    const commSpec = this.componentLibrary[toComponent.type];
    output.powerConsumption = commSpec.currentDraw || 0;
  }

  /**
   * Process passive component connections
   */
  processPassiveComponent(simulation, fromComponent, toComponent, connection) {
    const passiveSpec = this.componentLibrary[fromComponent.type];

    // Calculate voltage drop and current through passive components
    if (passiveSpec.resistance) {
      // Ohm's law calculation
      const sourceVoltage = this.componentLibrary[toComponent.type]?.voltage || 5.0;
      const current = sourceVoltage / passiveSpec.resistance;
      const voltageDrop = current * passiveSpec.resistance;

      // Update output values
      const output = simulation.outputValues[toComponent.id];
      if (output) {
        output.voltageDrop = voltageDrop;
        output.current = current * 1000; // Convert to mA
      }
    }
  }

  /**
   * Process generic connections
   */
  processGenericConnection(simulation, fromComponent, toComponent, connection) {
    // Basic connection processing for unsupported combinations
    const output = simulation.outputValues[toComponent.id];
    if (output) {
      output.state = 'connected';
      output.connectionType = connection.type;
    }
  }

  /**
   * Calculate total power consumption with efficiency factors
   */
  calculateTotalPowerConsumption(outputValues, powerAnalysis) {
    let totalConsumption = 0;
    let efficiency = 1.0;

    Object.values(outputValues).forEach(output => {
      if (output.powerConsumption) {
        totalConsumption += output.powerConsumption;
      }

      // Account for voltage drops and inefficiencies
      if (output.voltageDrop) {
        efficiency *= (1 - (output.voltageDrop / 5.0) * 0.1); // 10% efficiency loss per volt drop
      }
    });

    // Apply overall circuit efficiency
    totalConsumption *= (1 / efficiency);

    return Math.round(totalConsumption * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Update circuit health based on power analysis
   */
  updateCircuitHealthFromPower(simulation, powerAnalysis) {
    // Add power-related warnings and errors
    powerAnalysis.warnings.forEach(warning => {
      simulation.warnings.push(warning);
    });

    powerAnalysis.errors.forEach(error => {
      simulation.errors.push(error);
    });

    // Additional power health checks
    if (simulation.powerConsumption > 1000) { // 1A limit
      simulation.errors.push({
        type: 'excessive_power_draw',
        message: `Circuit drawing excessive power: ${simulation.powerConsumption}mA`
      });
    }

    // Check for brownout conditions
    const microcontrollers = Object.values(simulation.outputValues).filter(
      output => output.type === 'microcontroller'
    );

    microcontrollers.forEach(mc => {
      const mcSpec = this.componentLibrary[mc.type];
      if (mcSpec && simulation.powerConsumption > mcSpec.currentDraw * 2) {
        simulation.warnings.push({
          type: 'brownout_risk',
          message: `Microcontroller ${mc.id} at risk of brownout due to high current draw`
        });
      }
    });
  }
}

module.exports = new SimulationService();