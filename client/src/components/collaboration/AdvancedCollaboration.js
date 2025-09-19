/**
 * Advanced Real-time Collaboration System
 * Operational transformation, conflict resolution, and collaborative editing
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { IndexeddbPersistence } from 'y-indexeddb';
import {
  Users,
  UserPlus,
  UserMinus,
  MessageCircle,
  Settings,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AdvancedCollaboration = ({
  projectId,
  currentUser,
  onCircuitChange,
  onCodeChange,
  children
}) => {
  const socketRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const awarenessRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [syncStatus, setSyncStatus] = useState('syncing');

  // Yjs document and shared data structures
  const [circuitYMap, setCircuitYMap] = useState(null);
  const [codeYText, setCodeYText] = useState(null);
  const [messagesYArray, setMessagesYArray] = useState(null);

  // Initialize collaboration system
  useEffect(() => {
    initializeCollaboration();
    return () => cleanupCollaboration();
  }, [projectId]);

  const initializeCollaboration = useCallback(async () => {
    try {
      // Initialize Yjs document
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;

      // Create shared data structures
      const circuitMap = ydoc.getMap('circuit');
      const codeText = ydoc.getText('code');
      const messagesArray = ydoc.getArray('messages');
      const usersMap = ydoc.getMap('users');

      setCircuitYMap(circuitMap);
      setCodeYText(codeText);
      setMessagesYArray(messagesArray);

      // Initialize WebSocket provider
      const provider = new WebsocketProvider(
        `${process.env.REACT_APP_WS_URL || 'ws://localhost:3001'}/yjs`,
        `project-${projectId}`,
        ydoc,
        {
          connect: false, // Manual connection control
          params: {
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar
          }
        }
      );
      providerRef.current = provider;

      // Setup awareness for user presence
      awarenessRef.current = provider.awareness;
      setupAwareness();

      // Setup IndexedDB persistence for offline support
      const persistence = new IndexeddbPersistence(`project-${projectId}`, ydoc);

      persistence.on('synced', () => {
        console.log('[Collaboration] Document synced from IndexedDB');
        setSyncStatus('synced');
      });

      // Connect to WebSocket
      provider.connect();

      // Setup event listeners
      setupEventListeners(ydoc, circuitMap, codeText, messagesArray, usersMap);

      // Initialize Socket.io for additional features
      initializeSocketIO();

    } catch (error) {
      console.error('[Collaboration] Initialization failed:', error);
      setConnectionStatus('error');
    }
  }, [projectId, currentUser]);

  const setupAwareness = () => {
    const awareness = awarenessRef.current;

    // Set local user state
    awareness.setLocalStateField('user', {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      color: getRandomColor(),
      cursor: null,
      selection: null
    });

    // Listen for awareness changes
    awareness.on('change', () => {
      const states = Array.from(awareness.getStates().values());
      const collaborators = states
        .filter(state => state.user && state.user.id !== currentUser.id)
        .map(state => ({
          ...state.user,
          lastSeen: Date.now(),
          status: 'online'
        }));

      setCollaborators(collaborators);
    });
  };

  const setupEventListeners = (ydoc, circuitMap, codeText, messagesArray, usersMap) => {
    // Circuit changes
    circuitMap.observe(() => {
      const circuitData = circuitMap.toJSON();
      if (onCircuitChange) {
        onCircuitChange(circuitData);
      }
    });

    // Code changes
    codeText.observe(() => {
      const code = codeText.toString();
      if (onCodeChange) {
        onCodeChange(code);
      }
    });

    // Messages
    messagesArray.observe(() => {
      setMessages(messagesArray.toArray());
    });

    // Document sync status
    ydoc.on('sync', (isSynced) => {
      setSyncStatus(isSynced ? 'synced' : 'syncing');
    });
  };

  const initializeSocketIO = () => {
    const socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001', {
      query: {
        userId: currentUser.id,
        projectId: projectId
      }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Collaboration] Socket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      console.log('[Collaboration] Socket disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    socket.on('user-joined', (user) => {
      addSystemMessage(`${user.name} joined the project`);
    });

    socket.on('user-left', (user) => {
      addSystemMessage(`${user.name} left the project`);
    });

    socket.on('circuit-updated', (data) => {
      // Handle real-time circuit updates
      if (circuitYMap) {
        circuitYMap.set('components', data.components);
        circuitYMap.set('connections', data.connections);
      }
    });

    socket.on('code-updated', (data) => {
      // Handle real-time code updates
      if (codeYText) {
        codeYText.delete(0, codeYText.length);
        codeYText.insert(0, data.code);
      }
    });
  };

  const cleanupCollaboration = () => {
    if (providerRef.current) {
      providerRef.current.disconnect();
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
    }
  };

  // Message handling
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !messagesYArray) return;

    const message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: 'message'
    };

    messagesYArray.push([message]);
    setNewMessage('');

    // Also send via Socket.io for real-time delivery
    if (socketRef.current) {
      socketRef.current.emit('chat-message', message);
    }
  }, [newMessage, currentUser, messagesYArray]);

  const addSystemMessage = (content) => {
    if (!messagesYArray) return;

    const message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toISOString(),
      type: 'system'
    };

    messagesYArray.push([message]);
  };

  // Circuit operations with conflict resolution
  const updateCircuit = useCallback((updates) => {
    if (!circuitYMap) return;

    // Use Yjs transactions for atomic updates
    ydocRef.current.transact(() => {
      Object.entries(updates).forEach(([key, value]) => {
        circuitYMap.set(key, value);
      });
    });

    // Broadcast via Socket.io
    if (socketRef.current) {
      socketRef.current.emit('circuit-update', {
        projectId,
        userId: currentUser.id,
        ...updates
      });
    }
  }, [circuitYMap, projectId, currentUser]);

  // Code operations with operational transformation
  const updateCode = useCallback((code) => {
    if (!codeYText) return;

    // Replace entire code content
    codeYText.delete(0, codeYText.length);
    codeYText.insert(0, code);

    // Broadcast via Socket.io
    if (socketRef.current) {
      socketRef.current.emit('code-update', {
        projectId,
        userId: currentUser.id,
        code
      });
    }
  }, [codeYText, projectId, currentUser]);

  // Cursor and selection sharing
  const updateCursor = useCallback((position) => {
    if (awarenessRef.current) {
      awarenessRef.current.setLocalStateField('cursor', position);
    }
  }, []);

  const updateSelection = useCallback((selection) => {
    if (awarenessRef.current) {
      awarenessRef.current.setLocalStateField('selection', selection);
    }
  }, []);

  // Conflict resolution
  const resolveConflict = useCallback((localChange, remoteChange) => {
    // Implement operational transformation for conflict resolution
    // This is a simplified version - in production, you'd implement
    // proper OT algorithms

    const localTimestamp = localChange.timestamp || Date.now();
    const remoteTimestamp = remoteChange.timestamp || Date.now();

    // Last-writer-wins strategy
    return localTimestamp > remoteTimestamp ? localChange : remoteChange;
  }, []);

  // Utility functions
  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected': return 'text-red-500';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'synced': return 'text-green-500';
      case 'syncing': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="relative h-full">
      {/* Collaboration UI Overlay */}
      <div className="absolute top-4 right-4 z-50 space-y-2">
        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-lg border ${getConnectionStatusColor()}`}>
          {connectionStatus === 'connected' ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <span className="text-sm font-medium capitalize">{connectionStatus}</span>
        </div>

        {/* Sync Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-lg border ${getSyncStatusColor()}`}>
          {syncStatus === 'synced' ? (
            <CheckCircle className="h-4 w-4" />
          ) : syncStatus === 'syncing' ? (
            <Clock className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span className="text-sm font-medium capitalize">{syncStatus}</span>
        </div>

        {/* Collaborators */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-lg border">
          <Users className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">{collaborators.length + 1}</span>
        </div>

        {/* Chat Toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-lg border hover:bg-gray-50"
        >
          <MessageCircle className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Collaborators List */}
      {collaborators.length > 0 && (
        <div className="absolute top-4 left-4 z-50">
          <div className="flex -space-x-2">
            {/* Current user */}
            <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>

            {/* Other collaborators */}
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: collaborator.color }}
                title={collaborator.name}
              >
                {collaborator.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-xl border z-50 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Project Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.type === 'system'
                      ? 'bg-gray-100 text-gray-600 text-center'
                      : message.userId === currentUser.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.type !== 'system' && (
                    <div className="text-xs opacity-75 mb-1">
                      {message.userName}
                    </div>
                  )}
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="h-full">
        {React.Children.map(children, (child) =>
          React.cloneElement(child, {
            collaboration: {
              updateCircuit,
              updateCode,
              updateCursor,
              updateSelection,
              collaborators,
              isConnected,
              syncStatus
            }
          })
        )}
      </div>
    </div>
  );
};

export default AdvancedCollaboration;