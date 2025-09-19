/**
 * AI Code Generation Service
 * OpenAI GPT-4 integration for code generation and analysis
 */

const OpenAI = require('openai');

class AIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
    });

    this.model = process.env.AI_MODEL || 'gpt-4';
    this.temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 2000;
  }

  /**
   * Generate Arduino/C++ code from natural language description
   */
  async generateCode(description, context = {}) {
    try {
      const {
        boardType = 'arduino-uno',
        components = [],
        existingCode = '',
        requirements = [],
        optimizationLevel = 'balanced',
        includeComments = true,
        codeStyle = 'standard'
      } = context;

      const systemPrompt = this.buildEnhancedSystemPrompt(boardType, optimizationLevel, codeStyle);
      const userPrompt = this.buildAdvancedCodeGenerationPrompt(
        description,
        components,
        existingCode,
        requirements,
        includeComments
      );

      console.log('Generating advanced code with AI', {
        description: description.substring(0, 100),
        boardType,
        componentsCount: components.length,
        optimizationLevel,
        codeStyle
      });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stop: ['```', '/* End of code */']
      });

      const generatedCode = response.choices[0]?.message?.content?.trim();

      if (!generatedCode) {
        throw new Error('No code generated');
      }

      // Clean up the response
      const cleanCode = this.cleanGeneratedCode(generatedCode);

      // Generate additional analysis
      const analysis = await this.analyzeGeneratedCode(cleanCode, boardType);

      console.log('Advanced code generation successful', {
        codeLength: cleanCode.length,
        tokensUsed: response.usage?.total_tokens,
        analysisProvided: !!analysis
      });

      return {
        code: cleanCode,
        explanation: this.extractExplanation(generatedCode),
        suggestions: this.extractSuggestions(generatedCode),
        analysis,
        optimization: this.generateOptimizationSuggestions(cleanCode, boardType),
        tokensUsed: response.usage?.total_tokens || 0
      };

    } catch (error) {
      console.error('Advanced code generation failed:', error);
      throw new Error(`Code generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze existing code for improvements and bugs
   */
  async analyzeCode(code, language = 'cpp') {
    try {
      const systemPrompt = `You are an expert Arduino/C++ code analyzer. Analyze the provided code for:
1. Syntax errors and bugs
2. Performance issues
3. Best practices violations
4. Security vulnerabilities
5. Optimization opportunities
6. Code quality improvements

Provide specific, actionable feedback with line numbers where applicable.`;

      const userPrompt = `Analyze this ${language.toUpperCase()} code for Arduino:

\`\`\`${language}
${code}
\`\`\`

Please provide:
1. Any syntax errors or bugs
2. Performance optimizations
3. Best practices recommendations
4. Security considerations
5. Code quality improvements`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const analysis = response.choices[0]?.message?.content?.trim();

      return {
        analysis,
        issues: this.parseIssues(analysis),
        suggestions: this.parseSuggestions(analysis),
        tokensUsed: response.usage?.total_tokens || 0
      };

    } catch (error) {
      console.error('Code analysis failed:', error);
      throw new Error(`Code analysis failed: ${error.message}`);
    }
  }

  /**
   * Get code completion suggestions
   */
  async getCodeSuggestions(code, cursorPosition, language = 'cpp') {
    try {
      const systemPrompt = `You are an expert Arduino/C++ code completion assistant. Provide intelligent code completion suggestions based on:
1. Arduino/C++ syntax and semantics
2. Common Arduino patterns and functions
3. Best practices
4. Context-aware suggestions

Provide 3-5 relevant completion suggestions with brief explanations.`;

      const lines = code.split('\n');
      const currentLine = lines[cursorPosition.line] || '';
      const beforeCursor = currentLine.substring(0, cursorPosition.column);
      const afterCursor = currentLine.substring(cursorPosition.column);

      const context = lines.slice(
        Math.max(0, cursorPosition.line - 5),
        cursorPosition.line + 1
      ).join('\n');

      const userPrompt = `Complete this Arduino code at the cursor position:

Context (last 5 lines):
\`\`\`${language}
${context}
\`\`\`

Current line with cursor at position ${cursorPosition.column}:
${beforeCursor}█${afterCursor}

Provide 3-5 completion suggestions that would naturally fit here.`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 500
      });

      const suggestions = response.choices[0]?.message?.content?.trim();

      return {
        suggestions: this.parseCodeSuggestions(suggestions),
        tokensUsed: response.usage?.total_tokens || 0
      };

    } catch (error) {
      console.error('Code suggestions failed:', error);
      throw new Error(`Code suggestions failed: ${error.message}`);
    }
  }

  /**
   * Generate documentation for code
   */
  async generateDocumentation(code, language = 'cpp') {
    try {
      const systemPrompt = `You are an expert technical writer specializing in Arduino/C++ documentation. Generate comprehensive documentation including:
1. Function descriptions
2. Parameter explanations
3. Return value documentation
4. Usage examples
5. Important notes and warnings`;

      const userPrompt = `Generate comprehensive documentation for this ${language.toUpperCase()} code:

\`\`\`${language}
${code}
\`\`\`

Please provide:
1. Overview of what the code does
2. Function-by-function documentation
3. Setup and usage instructions
4. Important notes and considerations`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const documentation = response.choices[0]?.message?.content?.trim();

      return {
        documentation,
        tokensUsed: response.usage?.total_tokens || 0
      };

    } catch (error) {
      console.error('Documentation generation failed:', error);
      throw new Error(`Documentation generation failed: ${error.message}`);
    }
  }

  /**
   * Convert circuit design to code
   */
  async circuitToCode(circuitData, boardType = 'arduino-uno') {
    try {
      const systemPrompt = this.buildSystemPrompt(boardType);

      const circuitDescription = this.describeCircuit(circuitData);

      const userPrompt = `Convert this circuit design to Arduino code:

Circuit Description:
${circuitDescription}

Components: ${JSON.stringify(circuitData.components, null, 2)}
Connections: ${JSON.stringify(circuitData.connections, null, 2)}

Generate complete, working Arduino code that implements this circuit. Include:
1. Pin definitions
2. Setup function
3. Loop function
4. Helper functions if needed
5. Comments explaining the code`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: this.maxTokens
      });

      const generatedCode = response.choices[0]?.message?.content?.trim();

      return {
        code: this.cleanGeneratedCode(generatedCode),
        tokensUsed: response.usage?.total_tokens || 0
      };

    } catch (error) {
      console.error('Circuit to code conversion failed:', error);
      throw new Error(`Circuit conversion failed: ${error.message}`);
    }
  }

  // Helper methods

  buildSystemPrompt(boardType) {
    const boardSpecs = {
      'arduino-uno': {
        pins: 'Digital: 0-13, Analog: A0-A5, PWM: 3,5,6,9,10,11',
        voltage: '5V',
        microcontroller: 'ATmega328P'
      },
      'esp32': {
        pins: 'Digital: 0-39, Analog: 0-15, PWM: All digital pins',
        voltage: '3.3V',
        microcontroller: 'ESP32'
      }
    };

    const specs = boardSpecs[boardType] || boardSpecs['arduino-uno'];

    return `You are an expert Arduino/C++ developer. Generate high-quality, working code for ${boardType.toUpperCase()} boards.

Board Specifications:
- Pins: ${specs.pins}
- Voltage: ${specs.voltage}
- Microcontroller: ${specs.microcontroller}

Requirements:
1. Use proper Arduino/C++ syntax
2. Include necessary libraries
3. Add comprehensive comments
4. Follow Arduino best practices
5. Handle error conditions
6. Use appropriate data types
7. Optimize for performance
8. Include setup() and loop() functions
9. Use meaningful variable names
10. Add safety checks

Always generate complete, runnable code that can be uploaded directly to the board.`;
  }

  buildCodeGenerationPrompt(description, components, existingCode, requirements) {
    let prompt = `Generate Arduino code for: "${description}"\n\n`;

    if (components.length > 0) {
      prompt += `Available Components:\n`;
      components.forEach(comp => {
        prompt += `- ${comp.name}: ${comp.description}\n`;
      });
      prompt += '\n';
    }

    if (existingCode) {
      prompt += `Existing Code to Build Upon:\n\`\`\`cpp\n${existingCode}\n\`\`\`\n\n`;
    }

    if (requirements.length > 0) {
      prompt += `Additional Requirements:\n`;
      requirements.forEach(req => {
        prompt += `- ${req}\n`;
      });
      prompt += '\n';
    }

    prompt += `Generate complete, working Arduino code with proper setup and loop functions. Include comments and error handling.`;

    return prompt;
  }

  cleanGeneratedCode(code) {
    // Remove markdown code blocks
    code = code.replace(/```(?:cpp|arduino|c\+\+)?\n?/g, '').replace(/```\n?/g, '');

    // Remove common prefixes
    code = code.replace(/^(?:arduino|cpp|c\+\+):\s*/im, '');

    // Trim whitespace
    code = code.trim();

    return code;
  }

  extractExplanation(text) {
    const explanationMatch = text.match(/(?:explanation|description):\s*(.+?)(?:\n\n|\n*$)/i);
    return explanationMatch ? explanationMatch[1].trim() : '';
  }

  extractSuggestions(text) {
    const suggestions = [];
    const suggestionMatches = text.matchAll(/(?:suggestion|improvement|tip):\s*(.+?)(?:\n|$)/gi);

    for (const match of suggestionMatches) {
      suggestions.push(match[1].trim());
    }

    return suggestions;
  }

  parseIssues(analysis) {
    const issues = [];
    const lines = analysis.split('\n');

    for (const line of lines) {
      if (line.includes('error') || line.includes('bug') || line.includes('issue')) {
        const lineMatch = line.match(/line\s*(\d+)/i);
        issues.push({
          type: 'error',
          line: lineMatch ? parseInt(lineMatch[1]) : null,
          message: line.trim()
        });
      }
    }

    return issues;
  }

  parseSuggestions(analysis) {
    const suggestions = [];
    const lines = analysis.split('\n');

    for (const line of lines) {
      if (line.includes('suggest') || line.includes('recommend') || line.includes('improve')) {
        suggestions.push(line.trim());
      }
    }

    return suggestions;
  }

  parseCodeSuggestions(text) {
    const suggestions = [];
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.trim() && !line.includes('```') && line.length > 10) {
        suggestions.push({
          text: line.trim(),
          description: 'AI-generated suggestion'
        });
      }
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  describeCircuit(circuitData) {
    if (!circuitData.components || !circuitData.connections) {
      return 'No circuit data provided';
    }

    let description = 'Circuit contains:\n';

    circuitData.components.forEach(comp => {
      description += `- ${comp.type}: Connected to pins ${comp.pins?.join(', ') || 'N/A'}\n`;
    });

    description += '\nConnections:\n';
    circuitData.connections.forEach(conn => {
      const fromComp = circuitData.components.find(c => c.id === conn.from.componentId);
      const toComp = circuitData.components.find(c => c.id === conn.to.componentId);

      if (fromComp && toComp) {
        description += `- ${fromComp.type} pin ${conn.from.pinIndex} → ${toComp.type} pin ${conn.to.pinIndex}\n`;
      }
    });

    return description;
  }

  /**
   * Build enhanced system prompt with optimization and style preferences
   */
  buildEnhancedSystemPrompt(boardType, optimizationLevel, codeStyle) {
    const basePrompt = this.buildSystemPrompt(boardType);

    let enhancementPrompt = '';

    // Add optimization level guidance
    switch (optimizationLevel) {
      case 'performance':
        enhancementPrompt += '\nOPTIMIZATION FOCUS: Prioritize execution speed and memory efficiency. Use direct register manipulation where possible. Minimize function calls in loops.';
        break;
      case 'size':
        enhancementPrompt += '\nOPTIMIZATION FOCUS: Minimize code size and RAM usage. Use PROGMEM for large data. Optimize variable sizes.';
        break;
      case 'balanced':
      default:
        enhancementPrompt += '\nOPTIMIZATION FOCUS: Balance performance, size, and readability. Use standard Arduino practices.';
        break;
    }

    // Add code style guidance
    switch (codeStyle) {
      case 'compact':
        enhancementPrompt += '\nSTYLE: Write compact, dense code. Use short variable names. Minimize whitespace and comments.';
        break;
      case 'verbose':
        enhancementPrompt += '\nSTYLE: Write verbose, well-documented code. Use descriptive variable names. Include extensive comments.';
        break;
      case 'standard':
      default:
        enhancementPrompt += '\nSTYLE: Write clean, readable code following Arduino conventions. Use meaningful variable names and appropriate comments.';
        break;
    }

    return basePrompt + enhancementPrompt;
  }

  /**
   * Build advanced code generation prompt
   */
  buildAdvancedCodeGenerationPrompt(description, components, existingCode, requirements, includeComments) {
    let prompt = `Generate Arduino code for: "${description}"\n\n`;

    if (components.length > 0) {
      prompt += `Available Components:\n`;
      components.forEach(comp => {
        prompt += `- ${comp.name}: ${comp.description || comp.type}\n`;
      });
      prompt += '\n';
    }

    if (existingCode) {
      prompt += `Existing Code to Build Upon:\n\`\`\`cpp\n${existingCode}\n\`\`\`\n\n`;
    }

    if (requirements.length > 0) {
      prompt += `Additional Requirements:\n`;
      requirements.forEach(req => {
        prompt += `- ${req}\n`;
      });
      prompt += '\n';
    }

    prompt += `Code Generation Instructions:\n`;
    prompt += `- Generate complete, working Arduino code with proper setup and loop functions\n`;
    prompt += `- ${includeComments ? 'Include comprehensive comments explaining the code' : 'Minimize comments for compact code'}\n`;
    prompt += `- Handle error conditions and edge cases\n`;
    prompt += `- Use appropriate pin numbers and configurations\n`;
    prompt += `- Include safety checks and validation\n`;
    prompt += `- Optimize for the specified requirements\n`;

    return prompt;
  }

  /**
   * Analyze generated code for quality and improvements
   */
  async analyzeGeneratedCode(code, boardType) {
    try {
      const systemPrompt = `You are an expert Arduino code analyzer. Analyze the provided code and return a JSON object with the following structure:
      {
        "quality_score": number (0-100),
        "issues": array of { "type": string, "severity": string, "message": string, "line": number },
        "strengths": array of strings,
        "improvements": array of strings,
        "performance_metrics": {
          "estimated_flash_usage": number,
          "estimated_sram_usage": number,
          "estimated_power_consumption": number
        }
      }`;

      const userPrompt = `Analyze this Arduino code for ${boardType}:
\`\`\`cpp
${code}
\`\`\`

Provide a detailed analysis in the specified JSON format.`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysisText = response.choices[0]?.message?.content?.trim();

      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        console.warn('Failed to parse AI analysis response, returning basic analysis');
        return this.generateBasicAnalysis(code);
      }

    } catch (error) {
      console.error('Code analysis failed:', error);
      return this.generateBasicAnalysis(code);
    }
  }

  /**
   * Generate basic analysis when AI analysis fails
   */
  generateBasicAnalysis(code) {
    const lines = code.split('\n').length;
    const functions = (code.match(/void\s+\w+\s*\(/g) || []).length;
    const variables = (code.match(/(int|float|char|String|bool)\s+\w+/g) || []).length;

    return {
      quality_score: 75,
      issues: [],
      strengths: [
        'Basic Arduino structure present',
        `${functions} functions defined`,
        `${variables} variables declared`
      ],
      improvements: [
        'Consider adding error handling',
        'Add input validation',
        'Consider power optimization'
      ],
      performance_metrics: {
        estimated_flash_usage: lines * 50, // Rough estimate
        estimated_sram_usage: variables * 2,
        estimated_power_consumption: 50 // mA
      }
    };
  }

  /**
   * Generate optimization suggestions
   */
  generateOptimizationSuggestions(code, boardType) {
    const suggestions = [];

    // Memory optimizations
    if (code.includes('String') && !code.includes('F(')) {
      suggestions.push({
        type: 'memory',
        priority: 'medium',
        title: 'Use F() macro for string literals',
        description: 'Wrap string literals with F() to store them in flash memory instead of SRAM',
        code_example: 'Serial.println(F("Hello World"));'
      });
    }

    // Performance optimizations
    if (code.includes('delay(') && code.includes('millis()')) {
      suggestions.push({
        type: 'performance',
        priority: 'high',
        title: 'Replace delay() with millis()',
        description: 'Using delay() blocks execution. Consider using millis() for non-blocking timing.',
        code_example: 'if (millis() - lastTime > interval) { ... }'
      });
    }

    // Power optimizations
    if (code.includes('digitalWrite') && !code.includes('pinMode')) {
      suggestions.push({
        type: 'power',
        priority: 'medium',
        title: 'Set proper pin modes',
        description: 'Always set pinMode() for digital pins to prevent floating states and reduce power consumption.',
        code_example: 'pinMode(pin, OUTPUT);'
      });
    }

    // Code structure optimizations
    if (code.split('\n').length > 100) {
      suggestions.push({
        type: 'structure',
        priority: 'low',
        title: 'Consider breaking into functions',
        description: 'Long setup() or loop() functions can be hard to maintain. Consider extracting logic into separate functions.',
        code_example: 'void handleSensors() { /* sensor logic */ }'
      });
    }

    return suggestions;
  }

  /**
   * Advanced circuit analysis and suggestions
   */
  async analyzeCircuit(circuitData, boardType = 'arduino-uno') {
    try {
      const systemPrompt = `You are an expert embedded systems engineer. Analyze the circuit design and provide detailed feedback in JSON format:
      {
        "overall_score": number (0-100),
        "electrical_analysis": {
          "power_distribution": string,
          "voltage_levels": array,
          "current_paths": array,
          "potential_issues": array
        },
        "component_analysis": {
          "compatibility_score": number,
          "pin_conflicts": array,
          "resource_usage": object
        },
        "optimization_suggestions": array,
        "safety_concerns": array,
        "performance_estimate": {
          "power_consumption": number,
          "processing_load": number,
          "memory_usage": number
        }
      }`;

      const circuitDescription = this.describeCircuit(circuitData);

      const userPrompt = `Analyze this circuit design for ${boardType}:

Circuit Description:
${circuitDescription}

Components: ${JSON.stringify(circuitData.components, null, 2)}
Connections: ${JSON.stringify(circuitData.connections, null, 2)}

Provide detailed analysis in the specified JSON format.`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const analysisText = response.choices[0]?.message?.content?.trim();

      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        console.warn('Failed to parse circuit analysis, returning basic analysis');
        return this.generateBasicCircuitAnalysis(circuitData);
      }

    } catch (error) {
      console.error('Circuit analysis failed:', error);
      return this.generateBasicCircuitAnalysis(circuitData);
    }
  }

  /**
   * Generate basic circuit analysis
   */
  generateBasicCircuitAnalysis(circuitData) {
    const componentCount = circuitData.components?.length || 0;
    const connectionCount = circuitData.connections?.length || 0;

    return {
      overall_score: 70,
      electrical_analysis: {
        power_distribution: 'Basic analysis completed',
        voltage_levels: ['5V', '3.3V'],
        current_paths: [`${connectionCount} connections analyzed`],
        potential_issues: []
      },
      component_analysis: {
        compatibility_score: 85,
        pin_conflicts: [],
        resource_usage: {
          digital_pins: componentCount * 2,
          analog_pins: Math.floor(componentCount / 2),
          pwm_pins: Math.floor(componentCount / 3)
        }
      },
      optimization_suggestions: [
        'Consider power management for battery-operated devices',
        'Add decoupling capacitors for stable operation',
        'Use appropriate pull-up/down resistors'
      ],
      safety_concerns: [],
      performance_estimate: {
        power_consumption: componentCount * 10, // Rough estimate
        processing_load: 30,
        memory_usage: componentCount * 50
      }
    };
  }
}

module.exports = new AIService();