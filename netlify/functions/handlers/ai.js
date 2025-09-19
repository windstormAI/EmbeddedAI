/**
 * AI Handler - Netlify Function
 * Handles AI-powered code generation and assistance
 */

const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Handle AI routes
 */
async function handle(path, method, body, headers, user) {
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        error: 'Authentication required'
      })
    };
  }

  try {
    switch (method) {
      case 'POST':
        if (path === '/generate') {
          return await generateCode(body);
        } else if (path === '/chat') {
          return await chatWithAI(body);
        } else if (path === '/analyze') {
          return await analyzeCode(body);
        }
        break;
    }

    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: 'AI endpoint not found'
      })
    };

  } catch (error) {
    console.error('AI handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'AI service error'
      })
    };
  }
}

/**
 * Generate code from description
 */
async function generateCode(body) {
  const { description, boardType = 'arduino-uno', existingCode = '' } = body;

  if (!description) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Description is required'
      })
    };
  }

  try {
    const prompt = `Generate Arduino code for: ${description}

Board: ${boardType}
${existingCode ? `Existing code to build upon:\n${existingCode}\n\n` : ''}
Please provide:
1. Complete Arduino sketch (.ino file content)
2. Clear comments explaining each section
3. Proper pin definitions and setup
4. Error handling where appropriate
5. Best practices for ${boardType}

Make the code production-ready and well-documented.`;

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert embedded systems engineer specializing in Arduino and microcontroller programming. Generate clean, efficient, and well-documented code.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7
    });

    const generatedCode = completion.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          code: generatedCode,
          description: description,
          boardType: boardType,
          generatedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Code generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate code'
      })
    };
  }
}

/**
 * Chat with AI assistant
 */
async function chatWithAI(body) {
  const {
    message,
    projectId,
    context = {},
    conversationHistory = []
  } = body;

  if (!message) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Message is required'
      })
    };
  }

  try {
    // Build context-aware prompt
    let contextPrompt = '';
    if (context.boardType) {
      contextPrompt += `Board: ${context.boardType}\n`;
    }
    if (context.existingCode) {
      contextPrompt += `Current code:\n${context.existingCode.substring(0, 500)}...\n\n`;
    }
    if (context.circuitData) {
      contextPrompt += `Circuit components: ${JSON.stringify(context.circuitData.components?.map(c => c.name) || [])}\n`;
    }

    const systemPrompt = `You are an AI assistant for embedded systems development. Help users with:
- Arduino programming
- Circuit design and troubleshooting
- Hardware integration
- Code optimization
- Best practices

${contextPrompt ? `Context:\n${contextPrompt}` : ''}
Be helpful, accurate, and provide practical solutions.`;

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4',
      messages: messages,
      max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 1500,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7
    });

    const response = completion.choices[0].message.content;

    // Extract code snippets if present
    const codeSnippetMatch = response.match(/```(?:cpp|arduino|c\+\+)?\n([\s\S]*?)\n```/);
    const codeSnippet = codeSnippetMatch ? codeSnippetMatch[1] : null;

    // Generate suggestions based on the response
    const suggestions = generateSuggestions(response, context);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          response: response,
          codeSnippet: codeSnippet,
          suggestions: suggestions,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('AI chat error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'AI chat service unavailable'
      })
    };
  }
}

/**
 * Analyze code for issues and improvements
 */
async function analyzeCode(body) {
  const { code, boardType = 'arduino-uno' } = body;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Code is required for analysis'
      })
    };
  }

  try {
    const prompt = `Analyze this Arduino code for ${boardType}:

\`\`\`cpp
${code}
\`\`\`

Please provide:
1. Code quality assessment
2. Potential bugs or issues
3. Performance optimizations
4. Best practice recommendations
5. Security considerations
6. Memory usage analysis

Be specific and actionable in your suggestions.`;

    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a senior embedded systems engineer conducting code review. Be thorough, constructive, and focus on practical improvements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 1500,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3
    });

    const analysis = completion.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          analysis: analysis,
          codeLength: code.length,
          boardType: boardType,
          analyzedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Code analysis error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Code analysis service unavailable'
      })
    };
  }
}

/**
 * Generate contextual suggestions
 */
function generateSuggestions(response, context) {
  const suggestions = [];

  // Code-related suggestions
  if (response.toLowerCase().includes('delay')) {
    suggestions.push('Consider using millis() instead of delay() for non-blocking code');
  }

  if (response.toLowerCase().includes('serial')) {
    suggestions.push('Add error handling for Serial communication');
  }

  if (response.toLowerCase().includes('pinmode')) {
    suggestions.push('Use INPUT_PULLUP for buttons to avoid floating pin issues');
  }

  if (response.toLowerCase().includes('analogread')) {
    suggestions.push('Consider averaging multiple readings for stable ADC values');
  }

  // Hardware suggestions
  if (context.boardType === 'arduino-uno' && response.toLowerCase().includes('memory')) {
    suggestions.push('Arduino Uno has limited RAM (2KB) - optimize variable usage');
  }

  if (response.toLowerCase().includes('interrupt')) {
    suggestions.push('Use volatile keyword for variables modified in ISRs');
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
}

module.exports = { handle };