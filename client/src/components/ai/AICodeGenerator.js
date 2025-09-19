/**
 * AI Code Generator Component
 * Advanced AI-powered code generation with TensorFlow.js integration
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Brain,
  Sparkles,
  Code,
  Lightbulb,
  Zap,
  RefreshCw,
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Settings,
  Play,
  Save,
  FileText,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

const AICodeGenerator = ({ onCodeGenerated, currentCode = '', projectContext = {} }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationHistory, setGenerationHistory] = useState([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [feedback, setFeedback] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [codeQuality, setCodeQuality] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Predefined prompt templates
  const promptTemplates = [
    {
      name: 'LED Blinking',
      description: 'Generate code for basic LED blinking',
      template: 'Create Arduino code for blinking an LED connected to pin 13 with a 1-second interval. Include proper setup and loop functions.'
    },
    {
      name: 'Sensor Reading',
      description: 'Generate code for reading sensor data',
      template: 'Create Arduino code to read temperature from a DS18B20 sensor connected to pin 2 and display it on the serial monitor every 2 seconds.'
    },
    {
      name: 'Motor Control',
      description: 'Generate code for motor control',
      template: 'Create Arduino code to control a DC motor using an L298N motor driver. Include functions for forward, backward, and stop operations.'
    },
    {
      name: 'IoT Project',
      description: 'Generate code for IoT connectivity',
      template: 'Create ESP32 code to connect to WiFi, read sensor data, and send it to a MQTT broker every 30 seconds.'
    },
    {
      name: 'Custom Project',
      description: 'Describe your own project',
      template: ''
    }
  ];

  // AI Models configuration
  const aiModels = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Most capable model for complex code generation',
      maxTokens: 4000,
      costPerToken: 0.03
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and cost-effective for simpler tasks',
      maxTokens: 2000,
      costPerToken: 0.002
    },
    {
      id: 'claude-2',
      name: 'Claude 2',
      description: 'Excellent for code analysis and documentation',
      maxTokens: 3000,
      costPerToken: 0.008
    }
  ];

  // Generate code using AI
  const generateCode = async () => {
    if (!prompt.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a prompt' });
      return;
    }

    setIsGenerating(true);
    setFeedback(null);

    const startTime = Date.now();

    try {
      // Build enhanced context
      const context = {
        boardType: projectContext.boardType || 'arduino-uno',
        existingCode: currentCode,
        components: projectContext.components || [],
        connections: projectContext.connections || [],
        projectType: projectContext.category || 'basic'
      };

      // Enhanced prompt with context
      const enhancedPrompt = buildEnhancedPrompt(prompt, context);

      // Simulate AI API call (replace with actual API integration)
      const response = await simulateAICall(enhancedPrompt, {
        model: selectedModel,
        temperature,
        maxTokens
      });

      const endTime = Date.now();
      const generationTime = endTime - startTime;

      // Process generated code
      const processedCode = processGeneratedCode(response.code);

      setGeneratedCode(processedCode);
      setCodeQuality(analyzeCodeQuality(processedCode));
      setPerformanceMetrics({
        generationTime,
        tokensUsed: response.tokensUsed,
        cost: calculateCost(response.tokensUsed, selectedModel)
      });

      // Generate suggestions
      setSuggestions(generateSuggestions(processedCode, context));

      // Add to history
      const historyEntry = {
        id: Date.now(),
        prompt: prompt,
        code: processedCode,
        timestamp: new Date().toISOString(),
        model: selectedModel,
        quality: analyzeCodeQuality(processedCode)
      };

      setGenerationHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

      // Send to parent
      if (onCodeGenerated) {
        onCodeGenerated({
          code: processedCode,
          prompt: prompt,
          context: context,
          quality: analyzeCodeQuality(processedCode),
          suggestions: generateSuggestions(processedCode, context)
        });
      }

      setFeedback({ type: 'success', message: 'Code generated successfully!' });

    } catch (error) {
      console.error('Code generation error:', error);
      setFeedback({
        type: 'error',
        message: error.message || 'Failed to generate code. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Build enhanced prompt with project context
  const buildEnhancedPrompt = (basePrompt, context) => {
    let enhancedPrompt = basePrompt;

    // Add board-specific context
    if (context.boardType) {
      enhancedPrompt += `\n\nBoard: ${context.boardType}`;
      enhancedPrompt += `\nBoard specifications:`;

      switch (context.boardType) {
        case 'arduino-uno':
          enhancedPrompt += `\n- Microcontroller: ATmega328P`;
          enhancedPrompt += `\n- Digital pins: 14 (6 PWM)`;
          enhancedPrompt += `\n- Analog pins: 6`;
          enhancedPrompt += `\n- Flash memory: 32KB`;
          enhancedPrompt += `\n- SRAM: 2KB`;
          enhancedPrompt += `\n- EEPROM: 1KB`;
          break;
        case 'esp32':
          enhancedPrompt += `\n- Microcontroller: ESP32`;
          enhancedPrompt += `\n- WiFi and Bluetooth`;
          enhancedPrompt += `\n- Digital pins: 34`;
          enhancedPrompt += `\n- Analog pins: 18`;
          enhancedPrompt += `\n- Flash memory: 4MB+`;
          break;
      }
    }

    // Add component context
    if (context.components && context.components.length > 0) {
      enhancedPrompt += `\n\nComponents in circuit:`;
      context.components.forEach(comp => {
        enhancedPrompt += `\n- ${comp.name} (${comp.type})`;
      });
    }

    // Add existing code context
    if (context.existingCode && context.existingCode.trim()) {
      enhancedPrompt += `\n\nExisting code to build upon:`;
      enhancedPrompt += `\n\`\`\`cpp\n${context.existingCode}\n\`\`\``;
    }

    // Add project type guidance
    if (context.projectType) {
      enhancedPrompt += `\n\nProject type: ${context.projectType}`;
      switch (context.projectType) {
        case 'iot':
          enhancedPrompt += `\nFocus on: Connectivity, data transmission, cloud integration`;
          break;
        case 'robotics':
          enhancedPrompt += `\nFocus on: Motor control, sensor integration, autonomous behavior`;
          break;
        case 'automation':
          enhancedPrompt += `\nFocus on: Control systems, timing, reliability`;
          break;
      }
    }

    enhancedPrompt += `\n\nPlease provide:`;
    enhancedPrompt += `\n1. Complete, working Arduino code`;
    enhancedPrompt += `\n2. Proper pin definitions and setup`;
    enhancedPrompt += `\n3. Clear comments explaining each section`;
    enhancedPrompt += `\n4. Error handling where appropriate`;
    enhancedPrompt += `\n5. Best practices for the specific board`;

    return enhancedPrompt;
  };

  // Simulate AI API call (replace with actual implementation)
  const simulateAICall = async (enhancedPrompt, options) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Simulate different responses based on prompt content
    let mockCode = '';

    if (enhancedPrompt.toLowerCase().includes('led')) {
      mockCode = `// LED Blinking Example
// Generated for Arduino Uno

#define LED_PIN 13

void setup() {
  // Initialize digital pin LED_PIN as an output
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("LED Blinking Program Started");
}

void loop() {
  // Turn LED on
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED ON");
  delay(1000); // Wait for 1 second

  // Turn LED off
  digitalWrite(LED_PIN, LOW);
  Serial.println("LED OFF");
  delay(1000); // Wait for 1 second
}`;
    } else if (enhancedPrompt.toLowerCase().includes('sensor') || enhancedPrompt.toLowerCase().includes('temperature')) {
      mockCode = `// Temperature Sensor Reading Example
// Generated for Arduino Uno with DS18B20

#include <OneWire.h>
#include <DallasTemperature.h>

// Data wire is connected to pin 2
#define ONE_WIRE_BUS 2

// Setup a oneWire instance to communicate with any OneWire devices
OneWire oneWire(ONE_WIRE_BUS);

// Pass our oneWire reference to Dallas Temperature sensor
DallasTemperature sensors(&oneWire);

void setup() {
  // Start serial communication
  Serial.begin(9600);
  Serial.println("Temperature Sensor Reading Started");

  // Start up the library
  sensors.begin();
}

void loop() {
  // Call sensors.requestTemperatures() to issue a global temperature
  // request to all devices on the bus
  sensors.requestTemperatures();

  // Get temperature in Celsius
  float temperatureC = sensors.getTempCByIndex(0);

  // Check if reading was successful
  if (temperatureC != DEVICE_DISCONNECTED_C) {
    Serial.print("Temperature: ");
    Serial.print(temperatureC);
    Serial.println(" °C");
  } else {
    Serial.println("Error: Could not read temperature data");
  }

  // Wait 2 seconds before next reading
  delay(2000);
}`;
    } else {
      mockCode = `// Custom Arduino Program
// Generated based on your requirements

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  Serial.println("Program started successfully");

  // Add your setup code here
  pinMode(13, OUTPUT); // Example: LED pin
}

void loop() {
  // Add your main program logic here
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(1000);

  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(1000);
}`;
    }

    return {
      code: mockCode,
      tokensUsed: Math.floor(mockCode.length / 4) + 100,
      model: options.model
    };
  };

  // Process generated code
  const processGeneratedCode = (code) => {
    // Basic code cleaning and formatting
    return code
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  };

  // Analyze code quality
  const analyzeCodeQuality = (code) => {
    const lines = code.split('\n');
    const metrics = {
      totalLines: lines.length,
      commentLines: lines.filter(line => line.trim().startsWith('//') || line.trim().startsWith('/*')).length,
      emptyLines: lines.filter(line => line.trim() === '').length,
      codeLines: 0,
      hasSetup: false,
      hasLoop: false,
      hasComments: false,
      usesBestPractices: false
    };

    metrics.codeLines = metrics.totalLines - metrics.commentLines - metrics.emptyLines;
    metrics.hasSetup = code.includes('void setup()');
    metrics.hasLoop = code.includes('void loop()');
    metrics.hasComments = metrics.commentLines > 0;
    metrics.usesBestPractices = code.includes('pinMode') && code.includes('digitalWrite');

    // Calculate quality score (0-100)
    let score = 0;
    if (metrics.hasSetup) score += 20;
    if (metrics.hasLoop) score += 20;
    if (metrics.hasComments) score += 15;
    if (metrics.usesBestPractices) score += 20;
    if (metrics.commentLines / metrics.totalLines > 0.2) score += 15;
    if (metrics.codeLines < 50) score += 10; // Prefer concise code

    return {
      score: Math.min(score, 100),
      metrics,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
    };
  };

  // Generate suggestions for improvement
  const generateSuggestions = (code, context) => {
    const suggestions = [];

    if (!code.includes('void setup()')) {
      suggestions.push('Add a setup() function to initialize pins and serial communication');
    }

    if (!code.includes('void loop()')) {
      suggestions.push('Add a loop() function for continuous execution');
    }

    if (!code.includes('pinMode')) {
      suggestions.push('Use pinMode() to configure pin directions (INPUT/OUTPUT)');
    }

    if (!code.includes('delay(')) {
      suggestions.push('Consider adding delays to prevent overwhelming the microcontroller');
    }

    if (!code.includes('Serial.begin')) {
      suggestions.push('Add Serial.begin() for debugging and monitoring');
    }

    if (context.boardType === 'esp32' && !code.includes('WiFi')) {
      suggestions.push('Consider adding WiFi connectivity for ESP32 capabilities');
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  };

  // Calculate cost
  const calculateCost = (tokens, model) => {
    const modelConfig = aiModels.find(m => m.id === model);
    if (!modelConfig) return 0;

    return (tokens / 1000) * modelConfig.costPerToken;
  };

  // Copy code to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setFeedback({ type: 'success', message: 'Code copied to clipboard!' });
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to copy code' });
    }
  };

  // Download code as file
  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_code.ino';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load template
  const loadTemplate = (template) => {
    setPrompt(template.template);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <span>AI Code Generator</span>
            </h2>

            {isGenerating && (
              <div className="flex items-center space-x-2 text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating...</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Model Selection */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {aiModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>

            {/* Settings */}
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input & Templates */}
        <div className="w-80 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Generation</h3>

          {/* Prompt Templates */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Templates</h4>
            <div className="space-y-2">
              {promptTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => loadTemplate(template)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm">{template.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Describe Your Project
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Create a temperature monitoring system with LED indicators..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Advanced Settings */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Advanced Settings</h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Creativity (Temperature): {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Max Length (Tokens): {maxTokens}
                </label>
                <input
                  type="range"
                  min="500"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateCode}
            disabled={isGenerating || !prompt.trim()}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Code</span>
              </>
            )}
          </button>

          {/* Feedback */}
          {feedback && (
            <div className={`mt-4 p-3 rounded-lg ${
              feedback.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {feedback.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{feedback.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Center - Generated Code */}
        <div className="flex-1 bg-white p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Code</h3>

            {generatedCode && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded flex items-center space-x-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </button>

                <button
                  onClick={downloadCode}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center space-x-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>

          {/* Code Quality Metrics */}
          {codeQuality && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">Quality Score:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      codeQuality.grade === 'A' ? 'bg-green-100 text-green-800' :
                      codeQuality.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                      codeQuality.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {codeQuality.grade} ({codeQuality.score}/100)
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    Lines: {codeQuality.metrics.totalLines}
                  </div>

                  <div className="text-sm text-gray-600">
                    Comments: {codeQuality.metrics.commentLines}
                  </div>
                </div>

                {performanceMetrics && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{performanceMetrics.generationTime}ms</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3" />
                      <span>${performanceMetrics.cost.toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code Display */}
          <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
            {generatedCode ? (
              <pre className="p-4 text-green-400 text-sm font-mono overflow-auto h-full">
                <code>{generatedCode}</code>
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Code className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">No code generated yet</p>
                  <p className="text-sm mt-2">Enter a prompt and click "Generate Code"</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Suggestions & History */}
        <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span>Suggestions</span>
              </h4>

              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generation History */}
          {generationHistory.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Generations</h4>

              <div className="space-y-2">
                {generationHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setGeneratedCode(entry.code);
                      setPrompt(entry.prompt);
                      setCodeQuality(entry.quality);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {entry.prompt.substring(0, 30)}...
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        entry.quality?.grade === 'A' ? 'bg-green-100 text-green-800' :
                        entry.quality?.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.quality?.grade}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Information */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Current Model</h5>
            {(() => {
              const model = aiModels.find(m => m.id === selectedModel);
              return model ? (
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900">{model.name}</div>
                  <div className="mt-1">{model.description}</div>
                  <div className="mt-2 text-xs">
                    Max tokens: {model.maxTokens.toLocaleString()}
                    <br />
                    Cost: ${model.costPerToken}/1K tokens
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICodeGenerator;