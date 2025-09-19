/**
 * Enhanced Simulation Service Tests
 * Tests for advanced circuit simulation with power analysis and component interactions
 */

const SimulationService = require('../services/simulationService');

describe('Enhanced SimulationService', () => {
  let simulationService;

  beforeEach(() => {
    simulationService = new SimulationService();
  });

  describe('Component Library', () => {
    test('should have comprehensive component library', () => {
      const library = simulationService.componentLibrary;
      expect(Object.keys(library)).toBeGreaterThan(10);

      // Check for key components
      expect(library).toHaveProperty('arduino-uno');
      expect(library).toHaveProperty('esp32');
      expect(library).toHaveProperty('temperature-sensor');
      expect(library).toHaveProperty('led');
      expect(library).toHaveProperty('servo-motor');
      expect(library).toHaveProperty('bluetooth-module');
    });

    test('should have detailed Arduino Uno specifications', () => {
      const arduino = simulationService.componentLibrary['arduino-uno'];
      expect(arduino.type).toBe('microcontroller');
      expect(arduino.pins).toBe(20);
      expect(arduino.voltage).toBe(5.0);
      expect(arduino.adcResolution).toBe(10);
      expect(arduino.pwmPins).toEqual([3, 5, 6, 9, 10, 11]);
      expect(arduino.flashMemory).toBe(32);
      expect(arduino.sram).toBe(2);
      expect(arduino.operatingTemp).toEqual([-40, 85]);
    });

    test('should have detailed ESP32 specifications', () => {
      const esp32 = simulationService.componentLibrary['esp32'];
      expect(esp32.type).toBe('microcontroller');
      expect(esp32.pins).toBe(38);
      expect(esp32.voltage).toBe(3.3);
      expect(esp32.adcResolution).toBe(12);
      expect(esp32.wifi).toBe(true);
      expect(esp32.bluetooth).toBe(true);
      expect(esp32.flashMemory).toBe(512);
    });

    test('should have detailed sensor specifications', () => {
      const tempSensor = simulationService.componentLibrary['temperature-sensor'];
      expect(tempSensor.type).toBe('sensor');
      expect(tempSensor.interface).toBe('analog');
      expect(tempSensor.voltage).toBe(5.0);
      expect(tempSensor.physicalRange).toEqual([-40, 125]);
      expect(tempSensor.accuracy).toBe(0.5);
      expect(tempSensor.responseTime).toBe(1000);
    });

    test('should have detailed actuator specifications', () => {
      const servo = simulationService.componentLibrary['servo-motor'];
      expect(servo.type).toBe('actuator');
      expect(servo.interface).toBe('pwm');
      expect(servo.voltage).toBe(5.0);
      expect(servo.torque).toBe(1.5);
      expect(servo.range).toEqual([0, 180]);
      expect(servo.pulseWidth).toEqual([500, 2500]);
    });
  });

  describe('Circuit Graph Building', () => {
    test('should build circuit graph correctly', () => {
      const components = [
        { id: 'arduino-1', type: 'arduino-uno', name: 'Arduino Uno' },
        { id: 'led-1', type: 'led', name: 'LED' },
        { id: 'sensor-1', type: 'temperature-sensor', name: 'Temp Sensor' }
      ];

      const connections = [
        { from: { componentId: 'arduino-1', pin: 'D13' }, to: { componentId: 'led-1', pin: 'positive' } },
        { from: { componentId: 'sensor-1', pin: 'output' }, to: { componentId: 'arduino-1', pin: 'A0' } }
      ];

      const graph = simulationService.buildCircuitGraph(components, connections);

      expect(Object.keys(graph)).toHaveLength(3);
      expect(graph['arduino-1'].powerSource).toBe(true);
      expect(graph['led-1'].powerSink).toBe(true);
      expect(graph['sensor-1'].powerSink).toBe(true);
      expect(graph['arduino-1'].connections).toHaveLength(2);
      expect(graph['led-1'].connections).toHaveLength(1);
      expect(graph['sensor-1'].connections).toHaveLength(1);
    });

    test('should handle empty circuit', () => {
      const graph = simulationService.buildCircuitGraph([], []);
      expect(Object.keys(graph)).toHaveLength(0);
    });
  });

  describe('Power Distribution Analysis', () => {
    test('should analyze power distribution correctly', () => {
      const graph = {
        'arduino-1': {
          component: { id: 'arduino-1', type: 'arduino-uno' },
          spec: { voltage: 5.0, currentDraw: 50 },
          powerSource: true,
          connections: []
        },
        'led-1': {
          component: { id: 'led-1', type: 'led' },
          spec: { voltage: 5.0, currentDraw: 20 },
          powerSink: true,
          connections: []
        },
        'sensor-1': {
          component: { id: 'sensor-1', type: 'temperature-sensor' },
          spec: { voltage: 5.0, currentDraw: 1 },
          powerSink: true,
          connections: []
        }
      };

      const components = Object.values(graph).map(node => node.component);
      const analysis = simulationService.analyzePowerDistribution(graph, components);

      expect(analysis.totalPowerConsumption).toBe(21); // 20 + 1
      expect(analysis.powerSources).toHaveLength(1);
      expect(analysis.powerSinks).toHaveLength(2);
      expect(analysis.errors).toHaveLength(0); // No overload
    });

    test('should detect power overload', () => {
      const graph = {
        'arduino-1': {
          component: { id: 'arduino-1', type: 'arduino-uno' },
          spec: { voltage: 5.0, currentDraw: 50 },
          powerSource: true,
          connections: []
        },
        'high-power-device': {
          component: { id: 'high-power-device', type: 'high-power' },
          spec: { voltage: 5.0, currentDraw: 100 },
          powerSink: true,
          connections: []
        }
      };

      const components = Object.values(graph).map(node => node.component);
      const analysis = simulationService.analyzePowerDistribution(graph, components);

      expect(analysis.errors).toHaveLength(1);
      expect(analysis.errors[0].type).toBe('power_overload');
    });

    test('should detect voltage mismatches', () => {
      const graph = {
        'arduino-1': {
          component: { id: 'arduino-1', type: 'arduino-uno' },
          spec: { voltage: 5.0, currentDraw: 50 },
          powerSource: true,
          connections: []
        },
        'esp-device': {
          component: { id: 'esp-device', type: 'esp-device' },
          spec: { voltage: 3.3, currentDraw: 10 },
          powerSink: true,
          connections: []
        }
      };

      const components = Object.values(graph).map(node => node.component);
      const analysis = simulationService.analyzePowerDistribution(graph, components);

      expect(analysis.warnings).toHaveLength(1);
      expect(analysis.warnings[0].type).toBe('voltage_mismatch');
    });
  });

  describe('Connection Processing', () => {
    test('should process microcontroller to actuator connection', () => {
      const simulation = {
        outputValues: {
          'led-1': { state: 'idle', powerConsumption: 0 }
        }
      };

      const fromComponent = { id: 'arduino-1', type: 'arduino-uno' };
      const toComponent = { id: 'led-1', type: 'led' };
      const connection = {
        from: { componentId: 'arduino-1', pin: 'D13' },
        to: { componentId: 'led-1', pin: 'positive' }
      };

      simulationService.processMicrocontrollerToActuator(simulation, fromComponent, toComponent, connection);

      expect(simulation.outputValues['led-1'].state).toBe('active_digital');
      expect(simulation.outputValues['led-1'].digitalValue).toBeDefined();
      expect(simulation.outputValues['led-1'].powerConsumption).toBeGreaterThan(0);
    });

    test('should process sensor to microcontroller connection', () => {
      const simulation = {
        sensorValues: {
          'sensor-1': { value: 25, min: 0, max: 100 }
        }
      };

      const fromComponent = { id: 'sensor-1', type: 'temperature-sensor' };
      const toComponent = { id: 'arduino-1', type: 'arduino-uno' };
      const connection = {
        from: { componentId: 'sensor-1', pin: 'output' },
        to: { componentId: 'arduino-1', pin: 'A0' }
      };

      simulationService.processSensorToMicrocontroller(simulation, fromComponent, toComponent, connection);

      expect(simulation.sensorValues['sensor-1'].adcValue).toBeDefined();
      expect(simulation.sensorValues['sensor-1'].voltage).toBeDefined();
    });

    test('should process PWM connections correctly', () => {
      const simulation = {
        outputValues: {
          'servo-1': { state: 'idle', powerConsumption: 0 }
        }
      };

      const fromComponent = { id: 'arduino-1', type: 'arduino-uno' };
      const toComponent = { id: 'servo-1', type: 'servo-motor' };
      const connection = {
        from: { componentId: 'arduino-1', pin: 'D9' }, // PWM pin
        to: { componentId: 'servo-1', pin: 'signal' }
      };

      simulationService.processMicrocontrollerToActuator(simulation, fromComponent, toComponent, connection);

      expect(simulation.outputValues['servo-1'].state).toBe('active_pwm');
      expect(simulation.outputValues['servo-1'].dutyCycle).toBeDefined();
      expect(simulation.outputValues['servo-1'].frequency).toBe(490);
    });
  });

  describe('Circuit Health Monitoring', () => {
    test('should detect unconnected components', () => {
      const simulation = {
        circuitData: {
          components: [
            { id: 'arduino-1', type: 'arduino-uno' },
            { id: 'led-1', type: 'led' }
          ],
          connections: [] // No connections
        },
        warnings: [],
        errors: []
      };

      simulationService.checkCircuitHealth(simulation);

      expect(simulation.warnings).toHaveLength(2); // Both components unconnected
      expect(simulation.warnings[0].type).toBe('unconnected');
      expect(simulation.warnings[1].type).toBe('unconnected');
    });

    test('should detect power overload', () => {
      const simulation = {
        circuitData: {
          components: [],
          connections: []
        },
        powerConsumption: 1500, // Over 1A
        warnings: [],
        errors: []
      };

      simulationService.checkCircuitHealth(simulation);

      expect(simulation.errors).toHaveLength(1);
      expect(simulation.errors[0].type).toBe('excessive_power_draw');
    });

    test('should detect brownout risk', () => {
      const simulation = {
        outputValues: {
          'arduino-1': { type: 'microcontroller' }
        },
        powerConsumption: 100, // High current draw
        warnings: [],
        errors: []
      };

      simulationService.updateCircuitHealthFromPower(simulation, {});

      expect(simulation.warnings).toHaveLength(1);
      expect(simulation.warnings[0].type).toBe('brownout_risk');
    });
  });

  describe('Power Consumption Calculation', () => {
    test('should calculate accurate power consumption', () => {
      const outputValues = {
        'led-1': { powerConsumption: 20, voltageDrop: 0.1 },
        'sensor-1': { powerConsumption: 5, voltageDrop: 0.05 },
        'arduino-1': { powerConsumption: 50, voltageDrop: 0 }
      };

      const powerAnalysis = {};
      const totalConsumption = simulationService.calculateTotalPowerConsumption(outputValues, powerAnalysis);

      expect(totalConsumption).toBeGreaterThan(70); // Base consumption
      expect(totalConsumption).toBeLessThan(85); // With efficiency loss
    });

    test('should handle empty output values', () => {
      const totalConsumption = simulationService.calculateTotalPowerConsumption({}, {});
      expect(totalConsumption).toBe(0);
    });
  });

  describe('Optimization Suggestions', () => {
    test('should suggest PROGMEM for string literals', () => {
      const code = 'void setup() { Serial.println("Hello World"); }';
      const suggestions = simulationService.generateOptimizationSuggestions(code, 'arduino-uno');

      const memorySuggestion = suggestions.find(s => s.type === 'memory');
      expect(memorySuggestion).toBeDefined();
      expect(memorySuggestion.title).toContain('PROGMEM');
    });

    test('should suggest millis() over delay()', () => {
      const code = 'void loop() { delay(1000); digitalWrite(13, HIGH); }';
      const suggestions = simulationService.generateOptimizationSuggestions(code, 'arduino-uno');

      const performanceSuggestion = suggestions.find(s => s.type === 'performance');
      expect(performanceSuggestion).toBeDefined();
      expect(performanceSuggestion.title).toContain('delay()');
    });

    test('should suggest pin mode configuration', () => {
      const code = 'void setup() { digitalWrite(13, HIGH); }';
      const suggestions = simulationService.generateOptimizationSuggestions(code, 'arduino-uno');

      const powerSuggestion = suggestions.find(s => s.type === 'power');
      expect(powerSuggestion).toBeDefined();
      expect(powerSuggestion.title).toContain('pinMode');
    });

    test('should suggest function extraction for long code', () => {
      const longCode = 'void loop() { ' + 'digitalWrite(13, HIGH); delay(1000); '.repeat(20) + '}';
      const suggestions = simulationService.generateOptimizationSuggestions(longCode, 'arduino-uno');

      const structureSuggestion = suggestions.find(s => s.type === 'structure');
      expect(structureSuggestion).toBeDefined();
      expect(structureSuggestion.title).toContain('functions');
    });
  });

  describe('Default Values', () => {
    test('should provide correct default sensor values', () => {
      expect(simulationService.getDefaultSensorValue('temperature-sensor')).toBe(25);
      expect(simulationService.getDefaultSensorValue('photoresistor')).toBe(512);
      expect(simulationService.getDefaultSensorValue('potentiometer')).toBe(512);
      expect(simulationService.getDefaultSensorValue('unknown')).toBe(0);
    });

    test('should provide correct sensor units', () => {
      expect(simulationService.getSensorUnit('temperature-sensor')).toBe('°C');
      expect(simulationService.getSensorUnit('photoresistor')).toBe('');
      expect(simulationService.getSensorUnit('unknown')).toBe('');
    });

    test('should provide correct max sensor values', () => {
      expect(simulationService.getMaxSensorValue('temperature-sensor')).toBe(100);
      expect(simulationService.getMaxSensorValue('photoresistor')).toBe(1023);
      expect(simulationService.getMaxSensorValue('potentiometer')).toBe(1023);
      expect(simulationService.getMaxSensorValue('unknown')).toBe(100);
    });
  });

  describe('Simulation State Management', () => {
    test('should create simulation with correct initial state', () => {
      const circuitData = {
        components: [
          { id: 'arduino-1', type: 'arduino-uno' },
          { id: 'sensor-1', type: 'temperature-sensor' }
        ],
        connections: []
      };

      const simulation = simulationService.startSimulation('test-sim', circuitData);

      expect(simulation.id).toBe('test-sim');
      expect(simulation.isRunning).toBe(true);
      expect(simulation.currentTime).toBe(0);
      expect(simulation.powerConsumption).toBe(0);
      expect(simulation.warnings).toEqual([]);
      expect(simulation.errors).toEqual([]);
      expect(simulation.sensorValues).toHaveProperty('sensor-1');
      expect(simulation.outputValues).toHaveProperty('arduino-1');
    });

    test('should stop simulation correctly', () => {
      const circuitData = { components: [], connections: [] };
      simulationService.startSimulation('test-sim', circuitData);

      const stoppedSimulation = simulationService.stopSimulation('test-sim');

      expect(stoppedSimulation.isRunning).toBe(false);
      expect(stoppedSimulation).toHaveProperty('endTime');
    });

    test('should return null for non-existent simulation', () => {
      const result = simulationService.stopSimulation('non-existent');
      expect(result).toBeNull();
    });

    test('should step through simulation correctly', () => {
      const circuitData = { components: [], connections: [] };
      simulationService.startSimulation('test-sim', circuitData);

      const simulation = simulationService.stepSimulation('test-sim', 500);

      expect(simulation.currentTime).toBe(500);
      expect(simulation.isRunning).toBe(true);
    });

    test('should not step stopped simulation', () => {
      const circuitData = { components: [], connections: [] };
      simulationService.startSimulation('test-sim', circuitData);
      simulationService.stopSimulation('test-sim');

      const simulation = simulationService.stepSimulation('test-sim', 500);

      expect(simulation).toBeNull();
    });

    test('should clean up simulation state', () => {
      const circuitData = { components: [], connections: [] };
      simulationService.startSimulation('test-sim', circuitData);

      expect(simulationService.simulationStates.has('test-sim')).toBe(true);

      simulationService.cleanup('test-sim');

      expect(simulationService.simulationStates.has('test-sim')).toBe(false);
    });

    test('should get active simulations', () => {
      const circuitData = { components: [], connections: [] };
      simulationService.startSimulation('sim-1', circuitData);
      simulationService.startSimulation('sim-2', circuitData);
      simulationService.stopSimulation('sim-2');

      const activeSimulations = simulationService.getActiveSimulations();

      expect(activeSimulations).toHaveLength(1);
      expect(activeSimulations[0].id).toBe('sim-1');
    });
  });
});