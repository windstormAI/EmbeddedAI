/**
 * Advanced AI Service Tests
 * Tests for enhanced AI features including circuit analysis and optimization
 */

const AIService = require('../services/aiService');

describe('Advanced AIService', () => {
  let aiService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('Enhanced Code Generation', () => {
    test('should generate code with optimization levels', async () => {
      const description = 'Blink an LED connected to pin 13';
      const context = {
        boardType: 'arduino-uno',
        components: [{ name: 'LED', type: 'led' }],
        optimizationLevel: 'performance'
      };

      // Mock the OpenAI client
      const mockResponse = {
        choices: [{
          message: {
            content: 'void setup() { pinMode(13, OUTPUT); } void loop() { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }'
          }
        }],
        usage: { total_tokens: 150 }
      };

      // Mock the client method
      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse)
          }
        }
      };

      const result = await aiService.generateCode(description, context);

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('optimization');
      expect(result).toHaveProperty('tokensUsed', 150);
      expect(result.code).toContain('pinMode');
      expect(result.code).toContain('digitalWrite');
    });

    test('should handle different code styles', async () => {
      const description = 'Read temperature sensor';
      const context = {
        boardType: 'arduino-uno',
        codeStyle: 'verbose',
        includeComments: true
      };

      const mockResponse = {
        choices: [{
          message: {
            content: '// This function reads the temperature sensor\nint readTemperature() {\n  int sensorValue = analogRead(A0);\n  return sensorValue;\n}'
          }
        }],
        usage: { total_tokens: 120 }
      };

      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse)
          }
        }
      };

      const result = await aiService.generateCode(description, context);

      expect(result.code).toContain('// This function reads');
      expect(result.code).toContain('int readTemperature()');
    });

    test('should generate compact code when requested', async () => {
      const description = 'Simple LED blinker';
      const context = {
        boardType: 'arduino-uno',
        codeStyle: 'compact',
        includeComments: false
      };

      const mockResponse = {
        choices: [{
          message: {
            content: 'void setup(){pinMode(13,OUTPUT);}void loop(){digitalWrite(13,HIGH);delay(1000);digitalWrite(13,LOW);delay(1000);}'
          }
        }],
        usage: { total_tokens: 100 }
      };

      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse)
          }
        }
      };

      const result = await aiService.generateCode(description, context);

      expect(result.code).not.toContain('//');
      expect(result.code).toContain('void setup(){');
      expect(result.code).toContain('void loop(){');
    });
  });

  describe('Code Analysis', () => {
    test('should analyze generated code quality', async () => {
      const code = 'void setup() { pinMode(13, OUTPUT); } void loop() { digitalWrite(13, HIGH); delay(1000); }';

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              quality_score: 85,
              issues: [],
              strengths: ['Proper Arduino structure', 'Correct pin configuration'],
              improvements: ['Add LOW state for LED'],
              performance_metrics: {
                estimated_flash_usage: 1024,
                estimated_sram_usage: 128,
                estimated_power_consumption: 45
              }
            })
          }
        }],
        usage: { total_tokens: 200 }
      };

      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse)
          }
        }
      };

      const analysis = await aiService.analyzeGeneratedCode(code, 'arduino-uno');

      expect(analysis).toHaveProperty('quality_score', 85);
      expect(analysis).toHaveProperty('issues');
      expect(analysis).toHaveProperty('strengths');
      expect(analysis).toHaveProperty('improvements');
      expect(analysis).toHaveProperty('performance_metrics');
    });

    test('should return basic analysis when AI fails', async () => {
      const code = 'void setup() { Serial.begin(9600); }';

      // Mock failed AI response
      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('AI service unavailable'))
          }
        }
      };

      const analysis = await aiService.analyzeGeneratedCode(code, 'arduino-uno');

      expect(analysis).toHaveProperty('quality_score', 75);
      expect(analysis).toHaveProperty('issues');
      expect(analysis).toHaveProperty('strengths');
      expect(analysis).toHaveProperty('improvements');
      expect(analysis).toHaveProperty('performance_metrics');
    });
  });

  describe('Circuit Analysis', () => {
    test('should analyze circuit design', async () => {
      const circuitData = {
        components: [
          { id: 'arduino-1', type: 'arduino-uno', name: 'Arduino Uno' },
          { id: 'led-1', type: 'led', name: 'LED' }
        ],
        connections: [
          { from: { componentId: 'arduino-1', pin: 'D13' }, to: { componentId: 'led-1', pin: 'positive' } }
        ]
      };

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              overall_score: 90,
              electrical_analysis: {
                power_distribution: 'Good power distribution',
                voltage_levels: ['5V'],
                current_paths: ['Arduino → LED'],
                potential_issues: []
              },
              component_analysis: {
                compatibility_score: 95,
                pin_conflicts: [],
                resource_usage: { digital_pins: 1, analog_pins: 0, pwm_pins: 0 }
              },
              optimization_suggestions: ['Consider using PWM for LED brightness control'],
              safety_concerns: [],
              performance_estimate: {
                power_consumption: 70,
                processing_load: 10,
                memory_usage: 256
              }
            })
          }
        }],
        usage: { total_tokens: 300 }
      };

      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse)
          }
        }
      };

      const analysis = await aiService.analyzeCircuit(circuitData, 'arduino-uno');

      expect(analysis).toHaveProperty('overall_score', 90);
      expect(analysis).toHaveProperty('electrical_analysis');
      expect(analysis).toHaveProperty('component_analysis');
      expect(analysis).toHaveProperty('optimization_suggestions');
      expect(analysis).toHaveProperty('performance_estimate');
    });

    test('should return basic circuit analysis when AI fails', async () => {
      const circuitData = {
        components: [{ id: 'arduino-1', type: 'arduino-uno' }],
        connections: []
      };

      // Mock failed AI response
      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('AI service unavailable'))
          }
        }
      };

      const analysis = await aiService.analyzeCircuit(circuitData, 'arduino-uno');

      expect(analysis).toHaveProperty('overall_score', 70);
      expect(analysis).toHaveProperty('electrical_analysis');
      expect(analysis).toHaveProperty('component_analysis');
      expect(analysis).toHaveProperty('optimization_suggestions');
      expect(analysis).toHaveProperty('performance_estimate');
    });
  });

  describe('Optimization Suggestions', () => {
    test('should generate memory optimization suggestions', () => {
      const code = 'void setup() { Serial.println("Hello World"); Serial.println("Setup complete"); }';

      const suggestions = aiService.generateOptimizationSuggestions(code, 'arduino-uno');

      const memorySuggestion = suggestions.find(s => s.type === 'memory');
      expect(memorySuggestion).toBeDefined();
      expect(memorySuggestion.priority).toBe('medium');
      expect(memorySuggestion.title).toContain('PROGMEM');
    });

    test('should generate performance optimization suggestions', () => {
      const code = 'void loop() { delay(1000); digitalWrite(13, HIGH); }';

      const suggestions = aiService.generateOptimizationSuggestions(code, 'arduino-uno');

      const performanceSuggestion = suggestions.find(s => s.type === 'performance');
      expect(performanceSuggestion).toBeDefined();
      expect(performanceSuggestion.priority).toBe('high');
      expect(performanceSuggestion.title).toContain('delay()');
    });

    test('should generate power optimization suggestions', () => {
      const code = 'void setup() { digitalWrite(13, HIGH); }';

      const suggestions = aiService.generateOptimizationSuggestions(code, 'arduino-uno');

      const powerSuggestion = suggestions.find(s => s.type === 'power');
      expect(powerSuggestion).toBeDefined();
      expect(powerSuggestion.priority).toBe('medium');
      expect(powerSuggestion.title).toContain('pinMode');
    });

    test('should generate structure optimization suggestions for long code', () => {
      const longCode = 'void loop() { ' + 'digitalWrite(13, HIGH); delay(100); '.repeat(15) + '}';

      const suggestions = aiService.generateOptimizationSuggestions(longCode, 'arduino-uno');

      const structureSuggestion = suggestions.find(s => s.type === 'structure');
      expect(structureSuggestion).toBeDefined();
      expect(structureSuggestion.priority).toBe('low');
      expect(structureSuggestion.title).toContain('functions');
    });

    test('should return empty array for optimized code', () => {
      const optimizedCode = 'void setup() { pinMode(13, OUTPUT); } void loop() { digitalWrite(13, !digitalRead(13)); delay(100); }';

      const suggestions = aiService.generateOptimizationSuggestions(optimizedCode, 'arduino-uno');

      // Should have fewer suggestions for well-written code
      expect(suggestions.length).toBeLessThan(3);
    });
  });

  describe('Enhanced System Prompts', () => {
    test('should build enhanced system prompt for performance optimization', () => {
      const prompt = aiService.buildEnhancedSystemPrompt('arduino-uno', 'performance', 'standard');

      expect(prompt).toContain('OPTIMIZATION FOCUS: Prioritize execution speed');
      expect(prompt).toContain('Use direct register manipulation');
      expect(prompt).toContain('Minimize function calls in loops');
      expect(prompt).toContain('Arduino conventions');
    });

    test('should build enhanced system prompt for size optimization', () => {
      const prompt = aiService.buildEnhancedSystemPrompt('arduino-uno', 'size', 'compact');

      expect(prompt).toContain('OPTIMIZATION FOCUS: Minimize code size');
      expect(prompt).toContain('Use PROGMEM for large data');
      expect(prompt).toContain('STYLE: Write compact, dense code');
      expect(prompt).toContain('Minimize whitespace and comments');
    });

    test('should build enhanced system prompt for balanced optimization', () => {
      const prompt = aiService.buildEnhancedSystemPrompt('arduino-uno', 'balanced', 'verbose');

      expect(prompt).toContain('OPTIMIZATION FOCUS: Balance performance, size, and readability');
      expect(prompt).toContain('STYLE: Write verbose, well-documented code');
      expect(prompt).toContain('Use descriptive variable names');
    });
  });

  describe('Advanced Code Generation Prompts', () => {
    test('should build advanced code generation prompt with components', () => {
      const description = 'Control LED with button';
      const components = [
        { name: 'Push Button', type: 'button' },
        { name: 'LED', type: 'led' }
      ];
      const existingCode = 'int ledPin = 13;';
      const requirements = ['Debounce button input', 'Toggle LED state'];

      const prompt = aiService.buildAdvancedCodeGenerationPrompt(
        description,
        components,
        existingCode,
        requirements,
        true
      );

      expect(prompt).toContain('Control LED with button');
      expect(prompt).toContain('Push Button');
      expect(prompt).toContain('LED');
      expect(prompt).toContain('int ledPin = 13;');
      expect(prompt).toContain('Debounce button input');
      expect(prompt).toContain('Toggle LED state');
      expect(prompt).toContain('Include comprehensive comments');
    });

    test('should build prompt without comments when disabled', () => {
      const prompt = aiService.buildAdvancedCodeGenerationPrompt(
        'Simple blink',
        [],
        '',
        [],
        false
      );

      expect(prompt).toContain('Minimize comments for compact code');
      expect(prompt).not.toContain('Include comprehensive comments');
    });
  });

  describe('Error Handling', () => {
    test('should handle code generation errors gracefully', async () => {
      const description = 'Generate invalid code';

      // Mock failed AI response
      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI API error'))
          }
        }
      };

      await expect(aiService.generateCode(description)).rejects.toThrow('Code generation failed');
    });

    test('should handle circuit analysis errors gracefully', async () => {
      const circuitData = { components: [], connections: [] };

      // Mock failed AI response
      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('Analysis failed'))
          }
        }
      };

      const analysis = await aiService.analyzeCircuit(circuitData, 'arduino-uno');

      // Should return basic analysis
      expect(analysis).toHaveProperty('overall_score');
      expect(analysis).toHaveProperty('electrical_analysis');
    });
  });

  describe('Token Usage Tracking', () => {
    test('should track token usage in responses', async () => {
      const description = 'Simple LED blink';

      const mockResponse = {
        choices: [{
          message: {
            content: 'void setup() { pinMode(13, OUTPUT); } void loop() { digitalWrite(13, HIGH); delay(1000); digitalWrite(13, LOW); delay(1000); }'
          }
        }],
        usage: { total_tokens: 175 }
      };

      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse)
          }
        }
      };

      const result = await aiService.generateCode(description);

      expect(result.tokensUsed).toBe(175);
    });

    test('should handle missing token usage data', async () => {
      const description = 'Test code';

      const mockResponse = {
        choices: [{
          message: {
            content: 'void setup() {}'
          }
        }]
        // No usage property
      };

      aiService.client = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse)
          }
        }
      };

      const result = await aiService.generateCode(description);

      expect(result.tokensUsed).toBe(0);
    });
  });

  describe('Circuit Description', () => {
    test('should describe circuit with components and connections', () => {
      const circuitData = {
        components: [
          { id: 'arduino-1', type: 'arduino-uno', name: 'Arduino Uno' },
          { id: 'led-1', type: 'led', name: 'LED' },
          { id: 'sensor-1', type: 'temperature-sensor', name: 'Temp Sensor' }
        ],
        connections: [
          { from: { componentId: 'arduino-1', pin: 'D13' }, to: { componentId: 'led-1', pin: 'positive' } },
          { from: { componentId: 'sensor-1', pin: 'output' }, to: { componentId: 'arduino-1', pin: 'A0' } }
        ]
      };

      const description = aiService.describeCircuit(circuitData);

      expect(description).toContain('Circuit contains:');
      expect(description).toContain('Arduino Uno');
      expect(description).toContain('LED');
      expect(description).toContain('Temp Sensor');
      expect(description).toContain('Connections:');
      expect(description).toContain('arduino-uno pin');
      expect(description).toContain('led pin');
    });

    test('should handle empty circuit data', () => {
      const circuitData = { components: [], connections: [] };
      const description = aiService.describeCircuit(circuitData);

      expect(description).toBe('No circuit data provided');
    });

    test('should handle missing circuit data', () => {
      const description = aiService.describeCircuit(null);
      expect(description).toBe('No circuit data provided');
    });
  });
});