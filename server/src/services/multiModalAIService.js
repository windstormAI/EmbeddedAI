/**
 * Multi-Modal AI Processing Service
 * Handles text, images, and other modalities for comprehensive AI understanding
 */

const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class MultiModalAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
    });

    this.visionModel = 'gpt-4-vision-preview';
    this.textModel = 'gpt-4';
    this.temperature = 0.7;
    this.maxTokens = 2000;

    // Initialize processing pipelines
    this.pipelines = new Map();
    this.loadPipelines();
  }

  /**
   * Load processing pipelines for different modalities
   */
  loadPipelines() {
    // Circuit diagram processing pipeline
    this.pipelines.set('circuit_diagram', {
      steps: ['image_preprocessing', 'component_detection', 'connection_analysis', 'circuit_validation'],
      model: this.visionModel,
      prompt: this.getCircuitAnalysisPrompt()
    });

    // Schematic processing pipeline
    this.pipelines.set('schematic', {
      steps: ['image_preprocessing', 'symbol_recognition', 'netlist_extraction', 'spice_conversion'],
      model: this.visionModel,
      prompt: this.getSchematicAnalysisPrompt()
    });

    // Hand-drawn circuit processing pipeline
    this.pipelines.set('hand_drawn', {
      steps: ['image_enhancement', 'sketch_recognition', 'component_inference', 'circuit_generation'],
      model: this.visionModel,
      prompt: this.getHandDrawnAnalysisPrompt()
    });

    // PCB layout processing pipeline
    this.pipelines.set('pcb_layout', {
      steps: ['image_preprocessing', 'trace_recognition', 'component_placement', 'design_rule_check'],
      model: this.visionModel,
      prompt: this.getPCBLayoutAnalysisPrompt()
    });

    // Code snippet processing pipeline
    this.pipelines.set('code_image', {
      steps: ['ocr_processing', 'code_recognition', 'syntax_analysis', 'improvement_suggestions'],
      model: this.visionModel,
      prompt: this.getCodeAnalysisPrompt()
    });
  }

  /**
   * Process multi-modal input (text + images)
   */
  async processMultiModal(input) {
    const { text, images = [], modality = 'circuit_diagram' } = input;

    try {
      const pipeline = this.pipelines.get(modality);
      if (!pipeline) {
        throw new Error(`Unsupported modality: ${modality}`);
      }

      const processingId = uuidv4();
      const results = {
        id: processingId,
        modality,
        timestamp: new Date().toISOString(),
        steps: []
      };

      // Process images if provided
      if (images.length > 0) {
        const imageAnalysis = await this.processImages(images, pipeline);
        results.imageAnalysis = imageAnalysis;
        results.steps.push({
          name: 'image_processing',
          status: 'completed',
          result: imageAnalysis
        });
      }

      // Process text if provided
      if (text) {
        const textAnalysis = await this.processText(text, pipeline);
        results.textAnalysis = textAnalysis;
        results.steps.push({
          name: 'text_processing',
          status: 'completed',
          result: textAnalysis
        });
      }

      // Combine modalities
      const combinedResult = await this.combineModalities(results, pipeline);
      results.combinedResult = combinedResult;
      results.steps.push({
        name: 'modality_fusion',
        status: 'completed',
        result: combinedResult
      });

      // Generate final output
      const finalOutput = await this.generateOutput(combinedResult, modality);
      results.finalOutput = finalOutput;
      results.steps.push({
        name: 'output_generation',
        status: 'completed',
        result: finalOutput
      });

      return results;

    } catch (error) {
      console.error('Multi-modal processing failed:', error);
      throw new Error(`Multi-modal processing failed: ${error.message}`);
    }
  }

  /**
   * Process images using vision AI
   */
  async processImages(images, pipeline) {
    const imageContents = [];

    for (const image of images) {
      let imageData;

      // Handle different image input types
      if (typeof image === 'string') {
        // Base64 encoded image
        imageData = image;
      } else if (image.url) {
        // Image URL - download and convert
        const response = await axios.get(image.url, { responseType: 'arraybuffer' });
        imageData = Buffer.from(response.data).toString('base64');
      } else if (image.buffer) {
        // Image buffer
        imageData = image.buffer.toString('base64');
      } else {
        throw new Error('Unsupported image format');
      }

      imageContents.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageData}`
        }
      });
    }

    const messages = [
      {
        role: 'system',
        content: pipeline.prompt
      },
      {
        role: 'user',
        content: imageContents
      }
    ];

    const response = await this.client.chat.completions.create({
      model: pipeline.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens
    });

    const analysis = response.choices[0]?.message?.content?.trim();

    return {
      analysis,
      model: pipeline.model,
      tokensUsed: response.usage?.total_tokens || 0,
      imageCount: images.length
    };
  }

  /**
   * Process text input
   */
  async processText(text, pipeline) {
    const messages = [
      {
        role: 'system',
        content: 'Analyze the following text description and extract key requirements, components, and specifications for embedded systems development.'
      },
      {
        role: 'user',
        content: text
      }
    ];

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages,
      temperature: 0.3,
      max_tokens: 1000
    });

    const analysis = response.choices[0]?.message?.content?.trim();

    return {
      analysis,
      tokensUsed: response.usage?.total_tokens || 0
    };
  }

  /**
   * Combine results from different modalities
   */
  async combineModalities(results, pipeline) {
    const { imageAnalysis, textAnalysis } = results;

    let combinedPrompt = 'Combine the following analyses into a comprehensive understanding:\n\n';

    if (imageAnalysis) {
      combinedPrompt += `IMAGE ANALYSIS:\n${imageAnalysis.analysis}\n\n`;
    }

    if (textAnalysis) {
      combinedPrompt += `TEXT ANALYSIS:\n${textAnalysis.analysis}\n\n`;
    }

    combinedPrompt += 'Provide a unified interpretation that combines both visual and textual information into a complete project specification.';

    const messages = [
      {
        role: 'system',
        content: 'You are an expert at combining multi-modal information for embedded systems design.'
      },
      {
        role: 'user',
        content: combinedPrompt
      }
    ];

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages,
      temperature: 0.5,
      max_tokens: 1500
    });

    const combinedAnalysis = response.choices[0]?.message?.content?.trim();

    return {
      combinedAnalysis,
      confidence: this.calculateConfidence(results),
      tokensUsed: response.usage?.total_tokens || 0
    };
  }

  /**
   * Generate final output based on modality
   */
  async generateOutput(combinedResult, modality) {
    let outputPrompt = '';

    switch (modality) {
      case 'circuit_diagram':
        outputPrompt = `Based on the circuit analysis, generate:
        1. Complete component list with specifications
        2. Circuit schematic in JSON format
        3. Arduino/C++ code for the circuit
        4. Connection instructions
        5. Testing procedures`;
        break;

      case 'schematic':
        outputPrompt = `Convert the schematic analysis into:
        1. Netlist format
        2. SPICE simulation model
        3. PCB layout suggestions
        4. Bill of materials
        5. Design validation rules`;
        break;

      case 'hand_drawn':
        outputPrompt = `Transform the hand-drawn circuit into:
        1. Professional circuit diagram
        2. Component specifications
        3. Wiring connections
        4. Arduino code implementation
        5. Breadboard layout guide`;
        break;

      case 'pcb_layout':
        outputPrompt = `Analyze the PCB layout and provide:
        1. Design rule check results
        2. Optimization suggestions
        3. Manufacturing considerations
        4. Testing points identification
        5. Assembly instructions`;
        break;

      case 'code_image':
        outputPrompt = `Process the code image and provide:
        1. OCR-extracted code
        2. Syntax validation
        3. Code improvements
        4. Documentation suggestions
        5. Best practices recommendations`;
        break;

      default:
        outputPrompt = 'Generate a comprehensive project specification based on the analysis.';
    }

    const messages = [
      {
        role: 'system',
        content: 'You are an expert embedded systems engineer generating complete project specifications.'
      },
      {
        role: 'user',
        content: `${outputPrompt}\n\nANALYSIS:\n${combinedResult.combinedAnalysis}`
      }
    ];

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages,
      temperature: 0.3,
      max_tokens: 3000
    });

    const output = response.choices[0]?.message?.content?.trim();

    return {
      output,
      modality,
      format: this.detectOutputFormat(output),
      tokensUsed: response.usage?.total_tokens || 0
    };
  }

  /**
   * Calculate confidence score for multi-modal analysis
   */
  calculateConfidence(results) {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on available modalities
    if (results.imageAnalysis) confidence += 0.2;
    if (results.textAnalysis) confidence += 0.2;

    // Increase confidence based on analysis quality
    if (results.imageAnalysis?.analysis?.length > 100) confidence += 0.1;
    if (results.textAnalysis?.analysis?.length > 100) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Detect output format
   */
  detectOutputFormat(output) {
    if (output.includes('{') && output.includes('}')) {
      return 'json';
    } else if (output.includes('#include') || output.includes('void setup()')) {
      return 'arduino_code';
    } else if (output.includes('.SUBCKT') || output.includes('.ENDS')) {
      return 'spice';
    } else {
      return 'text';
    }
  }

  // Pipeline-specific prompts

  getCircuitAnalysisPrompt() {
    return `You are an expert electronics engineer analyzing circuit diagrams. Examine the image and identify:

1. **Components**: List all electronic components visible (resistors, capacitors, ICs, transistors, etc.)
2. **Values**: Estimate component values where possible
3. **Connections**: Describe how components are connected
4. **Power Supply**: Identify power sources and voltage levels
5. **Signals**: Identify input/output signals and their purposes
6. **Board Type**: Determine the microcontroller or board type
7. **Functionality**: Describe what the circuit does
8. **Issues**: Identify any potential problems or improvements

Provide detailed, technical analysis with specific observations.`;
  }

  getSchematicAnalysisPrompt() {
    return `You are analyzing an electronic schematic diagram. Extract:

1. **Component List**: All components with reference designators
2. **Netlist**: Connection information between components
3. **Power Rails**: Voltage supply connections
4. **Signal Flow**: Data and control signal paths
5. **Interface Points**: Input/output connections
6. **Design Patterns**: Recognized circuit topologies
7. **Compliance**: Check against best practices
8. **SPICE Model**: Suggest SPICE simulation parameters

Be precise and technical in your analysis.`;
  }

  getHandDrawnAnalysisPrompt() {
    return `You are interpreting a hand-drawn circuit diagram. Focus on:

1. **Component Recognition**: Identify components from rough sketches
2. **Connection Inference**: Determine intended connections
3. **Functionality**: Understand the circuit's purpose
4. **Improvements**: Suggest better component choices
5. **Practicality**: Assess real-world feasibility
6. **Safety**: Check for potential electrical hazards
7. **Simplifications**: Suggest easier-to-build alternatives

Be understanding of artistic interpretation while maintaining technical accuracy.`;
  }

  getPCBLayoutAnalysisPrompt() {
    return `You are analyzing a PCB layout. Evaluate:

1. **Trace Routing**: Quality of signal and power routing
2. **Component Placement**: Optimization of component positions
3. **Design Rules**: Compliance with manufacturing constraints
4. **Thermal Management**: Heat dissipation considerations
5. **EMI/EMC**: Electromagnetic compatibility
6. **Testability**: Access points for testing and debugging
7. **Manufacturability**: Ease of production and assembly
8. **Cost Optimization**: Material and process efficiency

Provide detailed feedback on layout quality and suggestions for improvement.`;
  }

  getCodeAnalysisPrompt() {
    return `You are analyzing code from an image. Extract and improve:

1. **Code Content**: OCR and reconstruct the code
2. **Language Detection**: Identify programming language
3. **Syntax Validation**: Check for syntax errors
4. **Logic Analysis**: Understand program flow and logic
5. **Best Practices**: Suggest coding improvements
6. **Documentation**: Recommend comments and documentation
7. **Optimization**: Suggest performance improvements
8. **Security**: Check for potential security issues

Provide both the extracted code and improvement suggestions.`;
  }

  /**
   * Process uploaded file
   */
  async processFile(file) {
    const { buffer, mimetype, originalname } = file;

    // Determine modality based on file type
    let modality = 'circuit_diagram';

    if (mimetype.startsWith('image/')) {
      if (originalname.toLowerCase().includes('schematic')) {
        modality = 'schematic';
      } else if (originalname.toLowerCase().includes('pcb') || originalname.toLowerCase().includes('board')) {
        modality = 'pcb_layout';
      } else if (originalname.toLowerCase().includes('code')) {
        modality = 'code_image';
      }
    }

    // Convert buffer to base64
    const base64Image = buffer.toString('base64');

    return await this.processMultiModal({
      images: [{ buffer: buffer }],
      modality
    });
  }

  /**
   * Batch process multiple files
   */
  async processBatch(files) {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.processFile(file);
        results.push({
          file: file.originalname,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          file: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    return {
      total: files.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}

module.exports = new MultiModalAIService();