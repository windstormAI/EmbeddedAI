import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { useProject } from '../../context/ProjectContext';

const AIAssistant = ({ projectId, currentCode, onCodeSuggestion }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [model, setModel] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const { currentProject } = useProject();
  const chatRef = useRef(null);

  // Initialize TensorFlow.js model
  useEffect(() => {
    loadAIModel();
  }, []);

  const loadAIModel = async () => {
    try {
      setIsLoading(true);
      // Load a pre-trained model or create a simple one for code generation
      // For now, we'll use a simple pattern-based approach
      // In production, this would load a trained model
      await tf.ready();
      setIsModelLoaded(true);
      addMessage('AI Assistant ready! I can help you generate Arduino code from your circuit designs.', 'ai');
    } catch (error) {
      console.error('Error loading AI model:', error);
      addMessage('AI model loading failed. Using basic code generation.', 'system');
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (content, type = 'user') => {
    const message = {
      id: Date.now(),
      content,
      type,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, message]);

    // Auto-scroll to bottom
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  };

  const generateCodeFromCircuit = async () => {
    if (!currentProject?.circuitData) {
      addMessage('No circuit design found. Please create a circuit first.', 'ai');
      return;
    }

    setIsLoading(true);
    addMessage('Analyzing your circuit design...', 'ai');

    try {
      const circuit = currentProject.circuitData;
      let generatedCode = '';

      // Generate setup code
      generatedCode += `void setup() {\n`;

      // Analyze circuit components and generate appropriate setup code
      circuit.nodes?.forEach(node => {
        switch (node.type) {
          case 'arduino':
            generatedCode += `  // Arduino setup\n`;
            break;
          case 'led':
            generatedCode += `  pinMode(13, OUTPUT); // LED pin\n`;
            break;
          case 'button':
            generatedCode += `  pinMode(2, INPUT); // Button pin\n`;
            break;
          case 'sensor':
            generatedCode += `  Serial.begin(9600); // Sensor communication\n`;
            break;
          case 'motor':
            generatedCode += `  pinMode(9, OUTPUT); // Motor PWM pin\n`;
            break;
        }
      });

      generatedCode += `}\n\n`;

      // Generate loop code
      generatedCode += `void loop() {\n`;

      // Generate main loop logic based on components
      circuit.nodes?.forEach(node => {
        switch (node.type) {
          case 'led':
            generatedCode += `  digitalWrite(13, HIGH); // Turn LED on\n`;
            generatedCode += `  delay(1000);\n`;
            generatedCode += `  digitalWrite(13, LOW); // Turn LED off\n`;
            generatedCode += `  delay(1000);\n`;
            break;
          case 'button':
            generatedCode += `  if (digitalRead(2) == HIGH) {\n`;
            generatedCode += `    // Button pressed - add your code here\n`;
            generatedCode += `  }\n`;
            break;
          case 'sensor':
            generatedCode += `  int sensorValue = analogRead(A0);\n`;
            generatedCode += `  Serial.println(sensorValue);\n`;
            generatedCode += `  delay(100);\n`;
            break;
          case 'motor':
            generatedCode += `  analogWrite(9, 128); // Motor at half speed\n`;
            generatedCode += `  delay(2000);\n`;
            generatedCode += `  analogWrite(9, 0); // Motor off\n`;
            generatedCode += `  delay(2000);\n`;
            break;
        }
      });

      generatedCode += `}\n`;

      addMessage('Generated Arduino code from your circuit:', 'ai');
      addMessage('```cpp\n' + generatedCode + '\n```', 'code');

      // Provide the code to the parent component
      if (onCodeSuggestion) {
        onCodeSuggestion(generatedCode);
      }

    } catch (error) {
      console.error('Error generating code:', error);
      addMessage('Error generating code. Please try again.', 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeCode = async () => {
    if (!currentCode) {
      addMessage('No code to analyze. Please write some Arduino code first.', 'ai');
      return;
    }

    setIsLoading(true);
    addMessage('Analyzing your code...', 'ai');

    try {
      const analysis = [];

      // Basic code analysis
      if (!currentCode.includes('void setup()')) {
        analysis.push('⚠️ Missing setup() function');
      }

      if (!currentCode.includes('void loop()')) {
        analysis.push('⚠️ Missing loop() function');
      }

      if (currentCode.includes('delay(') && !currentCode.includes('millis()')) {
        analysis.push('💡 Consider using millis() instead of delay() for better timing control');
      }

      if (currentCode.includes('Serial.begin') && !currentCode.includes('Serial.println')) {
        analysis.push('💡 You have Serial communication set up but no output');
      }

      if (currentCode.includes('analogRead') && !currentCode.includes('analogWrite')) {
        analysis.push('💡 Consider using analogWrite() for PWM output');
      }

      if (analysis.length === 0) {
        analysis.push('✅ Code looks good! No issues found.');
      }

      analysis.forEach(suggestion => {
        addMessage(suggestion, 'ai');
      });

    } catch (error) {
      console.error('Error analyzing code:', error);
      addMessage('Error analyzing code. Please try again.', 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeCode = async () => {
    if (!currentCode) {
      addMessage('No code to optimize. Please write some Arduino code first.', 'ai');
      return;
    }

    setIsLoading(true);
    addMessage('Optimizing your code...', 'ai');

    try {
      let optimizedCode = currentCode;

      // Basic optimizations
      const optimizations = [];

      // Remove unnecessary delays
      if (optimizedCode.includes('delay(1000)') && optimizedCode.includes('delay(1000)')) {
        optimizedCode = optimizedCode.replace(/delay\(1000\);\s*delay\(1000\);/, 'delay(2000);');
        optimizations.push('🔧 Combined consecutive delays');
      }

      // Suggest const for pin numbers
      if (optimizedCode.includes('digitalWrite(13') && !optimizedCode.includes('const int')) {
        optimizations.push('💡 Consider defining pin numbers as constants: const int LED_PIN = 13;');
      }

      // Suggest using arrays for multiple pins
      const digitalWriteMatches = optimizedCode.match(/digitalWrite\(\d+/g);
      if (digitalWriteMatches && digitalWriteMatches.length > 3) {
        optimizations.push('💡 Consider using arrays for multiple pin control');
      }

      if (optimizations.length === 0) {
        optimizations.push('✅ Code is already well optimized!');
      }

      optimizations.forEach(optimization => {
        addMessage(optimization, 'ai');
      });

      if (optimizedCode !== currentCode) {
        addMessage('Optimized code:', 'ai');
        addMessage('```cpp\n' + optimizedCode + '\n```', 'code');
      }

    } catch (error) {
      console.error('Error optimizing code:', error);
      addMessage('Error optimizing code. Please try again.', 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    addMessage(currentMessage, 'user');
    const userQuery = currentMessage;
    setCurrentMessage('');

    setIsLoading(true);

    try {
      // Simple pattern matching for common Arduino questions
      const query = userQuery.toLowerCase();

      if (query.includes('blink') || query.includes('led')) {
        addMessage('Here\'s a simple LED blink example:', 'ai');
        addMessage('```cpp\nvoid setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}\n```', 'code');
      } else if (query.includes('button') || query.includes('input')) {
        addMessage('Here\'s how to read a button:', 'ai');
        addMessage('```cpp\nvoid setup() {\n  pinMode(2, INPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  if (digitalRead(2) == HIGH) {\n    Serial.println("Button pressed!");\n  }\n  delay(100);\n}\n```', 'code');
      } else if (query.includes('sensor') || query.includes('analog')) {
        addMessage('Here\'s how to read an analog sensor:', 'ai');
        addMessage('```cpp\nvoid setup() {\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int sensorValue = analogRead(A0);\n  Serial.println(sensorValue);\n  delay(100);\n}\n```', 'code');
      } else if (query.includes('motor') || query.includes('pwm')) {
        addMessage('Here\'s how to control a motor with PWM:', 'ai');
        addMessage('```cpp\nvoid setup() {\n  pinMode(9, OUTPUT);\n}\n\nvoid loop() {\n  analogWrite(9, 128); // Half speed\n  delay(2000);\n  analogWrite(9, 0); // Stop\n  delay(2000);\n}\n```', 'code');
      } else {
        addMessage('I can help you with Arduino programming! Try asking about LEDs, buttons, sensors, motors, or other components.', 'ai');
      }

    } catch (error) {
      console.error('Error processing message:', error);
      addMessage('Sorry, I encountered an error. Please try again.', 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <div className="ai-status">
          <h3>🤖 AI Assistant</h3>
          <div className={`status-indicator ${isModelLoaded ? 'active' : 'inactive'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isModelLoaded ? 'AI Ready' : 'Loading AI...'}
            </span>
          </div>
        </div>

        <div className="ai-controls">
          <button
            onClick={generateCodeFromCircuit}
            disabled={isLoading || !currentProject?.circuitData}
            className="btn-primary"
          >
            🎨 Generate Code from Circuit
          </button>
          <button
            onClick={analyzeCode}
            disabled={isLoading || !currentCode}
            className="btn-secondary"
          >
            🔍 Analyze Code
          </button>
          <button
            onClick={optimizeCode}
            disabled={isLoading || !currentCode}
            className="btn-secondary"
          >
            ⚡ Optimize Code
          </button>
        </div>
      </div>

      <div className="ai-chat" ref={chatRef}>
        <div className="chat-messages">
          {chatMessages.length === 0 && (
            <div className="welcome-message">
              <h4>Welcome to AI Assistant!</h4>
              <p>I can help you with:</p>
              <ul>
                <li>🎨 Generate Arduino code from your circuit designs</li>
                <li>🔍 Analyze and improve your code</li>
                <li>⚡ Optimize performance</li>
                <li>💬 Answer Arduino programming questions</li>
              </ul>
              <p>Try clicking "Generate Code from Circuit" or ask me a question!</p>
            </div>
          )}

          {chatMessages.map(message => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                {message.type === 'code' ? (
                  <pre className="code-block">
                    <code dangerouslySetInnerHTML={{
                      __html: message.content.replace(/```cpp\n?([\s\S]*?)\n?```/g, '<code>$1</code>')
                    }} />
                  </pre>
                ) : (
                  <div dangerouslySetInnerHTML={{
                    __html: message.content.replace(/\n/g, '<br>')
                  }} />
                )}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message ai loading">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                AI is thinking...
              </div>
            </div>
          )}
        </div>

        <div className="chat-input">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about Arduino programming..."
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !currentMessage.trim()}
            className="send-btn"
          >
            📤
          </button>
        </div>
      </div>

      <style jsx>{`
        .ai-assistant {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          background: #f8fafc;
        }

        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .ai-status h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.active .status-dot {
          background: #10b981;
        }

        .status-indicator.inactive .status-dot {
          background: #f59e0b;
        }

        .status-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .ai-controls {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .ai-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .welcome-message {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .welcome-message h4 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .welcome-message p {
          margin: 0 0 1rem 0;
          color: #6b7280;
        }

        .welcome-message ul {
          text-align: left;
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        .welcome-message li {
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .message {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .message.user {
          align-items: flex-end;
        }

        .message.ai {
          align-items: flex-start;
        }

        .message.system {
          align-items: center;
        }

        .message.user .message-content {
          background: #3b82f6;
          color: white;
          border-radius: 1rem 1rem 0.25rem 1rem;
        }

        .message.ai .message-content {
          background: white;
          color: #1f2937;
          border: 1px solid #e5e7eb;
          border-radius: 1rem 1rem 1rem 0.25rem;
        }

        .message.system .message-content {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #f59e0b;
          border-radius: 1rem;
        }

        .message-content {
          padding: 0.75rem 1rem;
          max-width: 80%;
          word-wrap: break-word;
        }

        .code-block {
          background: #1f2937;
          color: #e5e7eb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.875rem;
          margin: 0;
        }

        .message-timestamp {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .typing-indicator {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .typing-indicator span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #6b7280;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% { opacity: 0.4; }
          30% { opacity: 1; }
        }

        .chat-input {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          background: white;
          border-top: 1px solid #e5e7eb;
        }

        .chat-input textarea {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          resize: none;
          font-family: inherit;
          font-size: 0.875rem;
        }

        .chat-input textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .send-btn {
          padding: 0.75rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .send-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .send-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .ai-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .ai-controls {
            width: 100%;
            justify-content: space-between;
          }

          .message-content {
            max-width: 90%;
          }
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;