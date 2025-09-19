import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useProject } from '../../context/ProjectContext';

const MonacoEditor = ({ projectId, initialCode = '', onCodeChange }) => {
  const editorRef = useRef(null);
  const { updateCode } = useProject();

  // Arduino C++ language configuration
  const arduinoLanguageConfig = {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  };

  // Arduino-specific snippets and completions
  const arduinoCompletions = [
    {
      label: 'setup',
      kind: 'function',
      insertText: 'void setup() {\n\t${1:// setup code here}\n}',
      insertTextRules: 4,
      documentation: 'Arduino setup function - runs once at startup'
    },
    {
      label: 'loop',
      kind: 'function',
      insertText: 'void loop() {\n\t${1:// main code here}\n}',
      insertTextRules: 4,
      documentation: 'Arduino main loop function - runs repeatedly'
    },
    {
      label: 'pinMode',
      kind: 'function',
      insertText: 'pinMode(${1:pin}, ${2:OUTPUT});',
      insertTextRules: 4,
      documentation: 'Configure pin mode (INPUT, OUTPUT, INPUT_PULLUP)'
    },
    {
      label: 'digitalWrite',
      kind: 'function',
      insertText: 'digitalWrite(${1:pin}, ${2:HIGH});',
      insertTextRules: 4,
      documentation: 'Write digital value to pin (HIGH or LOW)'
    },
    {
      label: 'digitalRead',
      kind: 'function',
      insertText: 'digitalRead(${1:pin});',
      insertTextRules: 4,
      documentation: 'Read digital value from pin'
    },
    {
      label: 'analogWrite',
      kind: 'function',
      insertText: 'analogWrite(${1:pin}, ${2:value});',
      insertTextRules: 4,
      documentation: 'Write analog value to PWM pin (0-255)'
    },
    {
      label: 'analogRead',
      kind: 'function',
      insertText: 'analogRead(${1:pin});',
      insertTextRules: 4,
      documentation: 'Read analog value from pin (0-1023)'
    },
    {
      label: 'delay',
      kind: 'function',
      insertText: 'delay(${1:1000});',
      insertTextRules: 4,
      documentation: 'Pause execution for specified milliseconds'
    },
    {
      label: 'Serial.begin',
      kind: 'function',
      insertText: 'Serial.begin(${1:9600});',
      insertTextRules: 4,
      documentation: 'Initialize serial communication'
    },
    {
      label: 'Serial.println',
      kind: 'function',
      insertText: 'Serial.println(${1:"Hello World"});',
      insertTextRules: 4,
      documentation: 'Print data to serial monitor with newline'
    }
  ];

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure Arduino language
    monaco.languages.setMonarchTokensProvider('cpp', {
      tokenizer: {
        root: [
          // Arduino-specific keywords
          [/\b(setup|loop|pinMode|digitalWrite|digitalRead|analogWrite|analogRead|delay|Serial|INPUT|OUTPUT|INPUT_PULLUP|HIGH|LOW)\b/, 'keyword'],
          // C++ keywords
          [/\b(if|else|for|while|do|switch|case|default|break|continue|return|void|int|char|float|double|bool|true|false)\b/, 'keyword'],
          // Comments
          [/\/\/.*$/, 'comment'],
          [/#.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          // Strings
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"([^"\\]|\\.)*"/, 'string'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/'([^'\\]|\\.)*'/, 'string'],
          // Numbers
          [/\d+/, 'number'],
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ]
      }
    });

    // Register completion provider
    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        return {
          suggestions: arduinoCompletions.map(item => ({
            ...item,
            range
          }))
        };
      }
    });

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      minimap: { enabled: true },
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: false
    });
  };

  const handleEditorChange = (value) => {
    if (onCodeChange) {
      onCodeChange(value);
    }

    // Auto-save to project (debounced)
    if (projectId && value !== undefined) {
      const timeoutId = setTimeout(async () => {
        try {
          await updateCode(projectId, value);
        } catch (error) {
          console.error('Failed to save code:', error);
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  };

  return (
    <div className="monaco-editor-container">
      <Editor
        height="100%"
        language="cpp"
        value={initialCode}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          selectOnLineNumbers: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading Monaco Editor...</div>
          </div>
        }
      />
    </div>
  );
};

export default MonacoEditor;