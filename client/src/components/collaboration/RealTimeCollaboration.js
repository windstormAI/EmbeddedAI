/**
 * Real-time Collaboration Component
 * Live multi-user editing and synchronization
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  Users,
  User,
  MessageCircle,
  Send,
  Eye,
  Edit,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  UserPlus,
  UserMinus,
  Crown,
  Lock,
  Unlock
} from 'lucide-react';

const RealTimeCollaboration = ({
  projectId,
  currentUser,
  components,
  connections,
  onComponentsChange,
  onConnectionsChange,
  onCodeChange
}) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userPresence, setUserPresence] = useState({});
  const [cursors, setCursors] = useState({});
  const [pendingChanges, setPendingChanges] = useState([]);
  const [conflictResolution, setConflictResolution] = useState(null);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!projectId || !currentUser) return;

    const newSocket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001', {
      auth: {
        userId: currentUser.id,
        username: currentUser.username,
        projectId: projectId
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true);
      addMessage('system', 'Connected to collaboration server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      addMessage('system', 'Disconnected from collaboration server');
    });

    // User presence
    newSocket.on('user-joined', (user) => {
      setCollaborators(prev => [...prev.filter(u => u.id !== user.id), user]);
      addMessage('system', `${user.username} joined the project`);
    });

    newSocket.on('user-left', (userId) => {
      setCollaborators(prev => prev.filter(u => u.id !== userId));
      const user = collaborators.find(u => u.id === userId);
      if (user) {
        addMessage('system', `${user.username} left the project`);
      }
    });

    newSocket.on('users-list', (users) => {
      setCollaborators(users.filter(u => u.id !== currentUser.id));
    });

    // Real-time updates
    newSocket.on('circuit-updated', (data) => {
      if (data.updatedBy !== currentUser.id) {
        handleRemoteCircuitUpdate(data);
      }
    });

    newSocket.on('code-updated', (data) => {
      if (data.updatedBy !== currentUser.id) {
        handleRemoteCodeUpdate(data);
      }
    });

    // Cursor tracking
    newSocket.on('cursor-moved', (data) => {
      if (data.userId !== currentUser.id) {
        setCursors(prev => ({
          ...prev,
          [data.userId]: {
            x: data.x,
            y: data.y,
            username: data.username,
            color: data.color
          }
        }));
      }
    });

    // Chat messages
    newSocket.on('chat-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Conflict resolution
    newSocket.on('conflict-detected', (conflict) => {
      setConflictResolution(conflict);
    });

    // Join project room
    newSocket.emit('join-project', projectId);

    return () => {
      newSocket.close();
    };
  }, [projectId, currentUser]);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Add message to chat
  const addMessage = useCallback((type, content, user = null) => {
    const message = {
      id: Date.now(),
      type,
      content,
      user,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, message]);
  }, []);

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const message = {
      type: 'user',
      content: newMessage.trim(),
      user: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString()
    };

    socket.emit('chat-message', message);
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Handle remote circuit updates
  const handleRemoteCircuitUpdate = (data) => {
    const { components: newComponents, connections: newConnections } = data;

    if (newComponents) {
      onComponentsChange(newComponents);
    }

    if (newConnections) {
      onConnectionsChange(newConnections);
    }

    addMessage('system', `Circuit updated by another user`);
  };

  // Handle remote code updates
  const handleRemoteCodeUpdate = (data) => {
    onCodeChange(data.code);
    addMessage('system', `${data.username} updated the code`);
  };

  // Send local changes to server
  const broadcastCircuitChange = (components, connections) => {
    if (!socket) return;

    socket.emit('circuit-update', {
      projectId,
      components,
      connections,
      userId: currentUser.id
    });
  };

  const broadcastCodeChange = (code, fileName) => {
    if (!socket) return;

    socket.emit('code-update', {
      projectId,
      code,
      fileName,
      userId: currentUser.id
    });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter' && newMessage.trim()) {
          sendMessage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [newMessage]);

  // Resolve conflicts
  const resolveConflict = (choice) => {
    if (!socket || !conflictResolution) return;

    socket.emit('conflict-resolved', {
      conflictId: conflictResolution.id,
      choice,
      userId: currentUser.id
    });

    setConflictResolution(null);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span>Live Collaboration</span>
            </h2>

            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Disconnected</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {collaborators.length + 1} user{collaborators.length !== 0 ? 's' : ''} online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Collaborators */}
        <div className="w-64 border-r border-gray-200 bg-white p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>

          {/* Current User */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{currentUser.username}</div>
              <div className="text-sm text-gray-600">You (Owner)</div>
            </div>
            <Crown className="h-4 w-4 text-yellow-500" />
          </div>

          {/* Collaborators */}
          {collaborators.length > 0 ? (
            <div className="space-y-2">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{collaborator.username}</div>
                    <div className="text-sm text-gray-600 capitalize">{collaborator.role}</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Online</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">No collaborators yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Invite team members to collaborate
              </p>
            </div>
          )}

          {/* Activity Feed */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-3 w-3" />
                <span>You joined the project</span>
              </div>
              {collaborators.map((collab, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <UserPlus className="h-3 w-3" />
                  <span>{collab.username} joined</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Chat */}
        <div className="flex-1 bg-white p-4 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Chat</h3>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
            {messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'system' ? 'justify-center' : 'justify-start'}`}>
                    {message.type === 'system' ? (
                      <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {message.content}
                      </div>
                    ) : (
                      <div className="max-w-xs lg:max-w-md">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {message.user.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="bg-blue-600 text-white px-3 py-2 rounded-lg">
                          {message.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start a conversation with your team
                </p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!isConnected}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </div>

          {!isConnected && (
            <div className="mt-2 text-sm text-red-600 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Connect to enable real-time collaboration</span>
            </div>
          )}
        </div>

        {/* Right Panel - Settings & Status */}
        <div className="w-80 border-l border-gray-200 bg-white p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaboration Settings</h3>

          {/* Connection Status */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Connection Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">WebSocket</span>
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Disconnected</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Project Room</span>
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Joined</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Not joined</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Collaboration Features */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Features</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Live Editing</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Enabled</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cursor Tracking</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Enabled</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conflict Resolution</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Auto</span>
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Keyboard Shortcuts</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Send Message</span>
                <span className="font-mono">Ctrl + Enter</span>
              </div>
              <div className="flex justify-between">
                <span>Focus Chat</span>
                <span className="font-mono">Ctrl + /</span>
              </div>
            </div>
          </div>

          {/* Conflict Resolution Modal */}
          {conflictResolution && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Conflict Detected</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Another user made changes that conflict with yours. How would you like to resolve this?
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => resolveConflict('mine')}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Keep My Changes
                  </button>
                  <button
                    onClick={() => resolveConflict('theirs')}
                    className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                  >
                    Use Their Changes
                  </button>
                  <button
                    onClick={() => resolveConflict('merge')}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Merge Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeCollaboration;