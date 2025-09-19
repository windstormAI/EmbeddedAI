/**
 * AI Assistant Panel Component
 * Chat interface for AI-powered code generation and assistance
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Lightbulb,
  Code,
  Zap,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import api from '../../utils/api';

const AIPanel = ({ project, onCodeGenerated, onCircuitGenerated, embedded = false }) => {
  const { currentProject } = useProject();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI assistant for embedded systems development. I can help you:\n\n• Generate Arduino code from descriptions\n• Debug existing code\n• Suggest circuit improvements\n• Explain electronic concepts\n\nWhat would you like to work on?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: input,
        projectId: currentProject?._id,
        context: {
          boardType: currentProject?.boardType,
          existingCode: currentProject?.code,
          circuitData: currentProject?.circuitData
        }
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response,
        suggestions: response.data.suggestions,
        codeSnippet: response.data.codeSnippet,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async (description) => {
    setIsLoading(true);

    try {
      const response = await api.post('/ai/generate', {
        description,
        boardType: currentProject?.boardType,
        existingCode: currentProject?.code
      });

      const codeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Here's the generated code for: "${description}"`,
        codeSnippet: response.data.code,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, codeMessage]);

      // Offer to apply the code
      if (onCodeGenerated) {
        onCodeGenerated(response.data.code);
      }
    } catch (error) {
      console.error('Code generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    // Could add a toast notification here
  };

  const handleApplyCode = (code) => {
    if (onCodeGenerated) {
      onCodeGenerated(code);
    }
  };

  const quickPrompts = [
    "Generate code for a blinking LED",
    "Create a button-controlled LED circuit",
    "Write code for a temperature sensor",
    "Generate PWM motor control code",
    "Create a traffic light simulation"
  ];

  return (
    <div className={`bg-white ${embedded ? 'h-full' : 'h-full flex flex-col'}`}>
      {!embedded && (
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bot className="h-5 w-5 mr-2 text-blue-600" />
            AI Assistant
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Get help with code generation, debugging, and circuit design
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-center mb-2">
                {message.type === 'user' ? (
                  <User className="h-4 w-4 mr-2" />
                ) : (
                  <Bot className="h-4 w-4 mr-2" />
                )}
                <span className="text-xs opacity-75">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>

              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>

              {/* Code snippet */}
              {message.codeSnippet && (
                <div className="mt-3">
                  <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                    <pre>{message.codeSnippet}</pre>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleCopyCode(message.codeSnippet)}
                      className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded flex items-center"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </button>
                    <button
                      onClick={() => handleApplyCode(message.codeSnippet)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center"
                    >
                      <Code className="h-3 w-3 mr-1" />
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {message.suggestions && (
                <div className="mt-3 space-y-2">
                  {message.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 text-xs bg-blue-50 p-2 rounded"
                    >
                      <Lightbulb className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" />
                      <span className="text-blue-800">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-4 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {!embedded && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInput(prompt)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors duration-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about your embedded project..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors duration-200"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              AI Powered
            </span>
            <span className="flex items-center">
              <Code className="h-3 w-3 mr-1" />
              Code Generation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;