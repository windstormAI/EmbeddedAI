/**
 * Code Editor Component
 * Monaco-based code editor with syntax highlighting and AI suggestions
 */

import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Save,
  Download,
  Upload,
  Settings,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

const CodeEditor = ({ code, onCodeChange, language = 'cpp', boardType = 'arduino-uno' }) => {
  const editorRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [theme, setTheme] = useState('vs-light');

  // Arduino/C++ code templates
  const templates = {
    'arduino-uno': {
      setup: `void setup() {
  // Initialize serial communication
  Serial.begin(9600);

  // Configure pins
  pinMode(LED_BUILTIN, OUTPUT);

  // Add your setup code here
}

void loop() {
  // Add your main code here

  // Example: Blink LED
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}`,
      blink: `// Blink LED example
const int ledPin = LED_BUILTIN;

void setup() {
  pinMode(ledPin, OUTPUT);
}

void loop() {
  digitalWrite(ledPin, HIGH);
  delay(1000);
  digitalWrite(ledPin, LOW);
  delay(1000);
}`,
      button: `// Button input example
const int buttonPin = 2;
const int ledPin = LED_BUILTIN;

void setup() {
  pinMode(buttonPin, INPUT);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int buttonState = digitalRead(buttonPin);

  if (buttonState == HIGH) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}`
    }
  };

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsLoading(false);

    // Configure Monaco
    monaco.editor.defineTheme('arduino-theme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '09885A' }
      ],
      colors: {
        'editor.background': '#FAFAFA',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#E8F2FF'
      }
    });

    // Set theme
    monaco.editor.setTheme('arduino-theme');

    // Configure C++ language
    monaco.languages.cpp.cppDefaults.setCompilerOptions({
      target: monaco.languages.cpp.CompilerTarget.ES2015,
      module: monaco.languages.cpp.ModuleKind.CommonJS
    });

    // Add Arduino-specific keywords
    monaco.languages.setMonarchTokensProvider('cpp', {
      keywords: [
        'setup', 'loop', 'pinMode', 'digitalWrite', 'digitalRead',
        'analogWrite', 'analogRead', 'delay', 'delayMicroseconds',
        'Serial', 'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP'
      ],
      tokenizer: {
        root: [
          [/[a-z_$][\w$]*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],
          [/[{}()\[\]]/, '@brackets'],
          [/[<>](?!@symbols)/, '@brackets'],
          [/@symbols/, {
            cases: {
              '@operators': 'operator',
              '@default': ''
            }
          }],
          { include: '@whitespace' },
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/\d+/, 'number'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
          [/'[^\\']'/, 'string'],
          [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
          [/'/, 'string.invalid']
        ]
      }
    });
  };

  // Handle code changes
  const handleCodeChange = (value) => {
    onCodeChange(value);

    // Basic syntax checking
    checkSyntax(value);
  };

  // Basic syntax checking
  const checkSyntax = (code) => {
    const newErrors = [];

    // Check for missing semicolons
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') &&
          !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}') &&
          !trimmed.startsWith('void') && !trimmed.startsWith('int') &&
          !trimmed.startsWith('float') && !trimmed.startsWith('char') &&
          !trimmed.startsWith('#') && !trimmed.includes('if') &&
          !trimmed.includes('for') && !trimmed.includes('while')) {
        newErrors.push({
          line: index + 1,
          message: 'Missing semicolon',
          severity: 'warning'
        });
      }
    });

    // Check for unmatched braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      newErrors.push({
        line: 1,
        message: 'Unmatched braces',
        severity: 'error'
      });
    }

    setErrors(newErrors);
  };

  // Insert template
  const insertTemplate = (templateName) => {
    const template = templates[boardType]?.[templateName];
    if (template && editorRef.current) {
      const position = editorRef.current.getPosition();
      editorRef.current.executeEdits('', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: template
      }]);
      onCodeChange(editorRef.current.getValue());
    }
  };

  // Download code
  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arduino_code.ino';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Upload code
  const uploadCode = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onCodeChange(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Code Editor</h3>
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {language.toUpperCase()} - {boardType}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Templates */}
            <select
              onChange={(e) => insertTemplate(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="">Insert Template</option>
              <option value="setup">Basic Setup</option>
              <option value="blink">Blink LED</option>
              <option value="button">Button Input</option>
            </select>

            {/* Actions */}
            <button
              onClick={downloadCode}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center space-x-1"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>

            <label className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded flex items-center space-x-1 cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
              <input
                type="file"
                accept=".ino,.cpp,.c"
                onChange={uploadCode}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Editor and Sidebar */}
      <div className="flex-1 flex">
        {/* Main Editor */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading editor...</p>
              </div>
            </div>
          )}

          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme={theme}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnEnter: 'on',
              quickSuggestions: {
                other: true,
                comments: false,
                strings: true
              },
              parameterHints: {
                enabled: true
              },
              hover: {
                enabled: true
              }
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-gray-200 bg-gray-50">
          {/* Errors/Warnings */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Issues ({errors.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {errors.length === 0 ? (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  No issues found
                </div>
              ) : (
                errors.map((error, index) => (
                  <div
                    key={index}
                    className={`flex items-start space-x-2 text-sm p-2 rounded ${
                      error.severity === 'error' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Line {error.line}</div>
                      <div>{error.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                AI Suggestions
              </h4>
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showSuggestions ? 'Hide' : 'Show'}
              </button>
            </div>

            {showSuggestions && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  💡 <strong>Tip:</strong> Use <code>const</code> instead of <code>#define</code> for better type safety
                </div>
                <div className="text-sm text-gray-600 bg-green-50 p-3 rounded">
                  🚀 <strong>Optimization:</strong> Consider using <code>millis()</code> instead of <code>delay()</code> for non-blocking code
                </div>
                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                  ⚠️ <strong>Best Practice:</strong> Add comments to explain complex logic
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;