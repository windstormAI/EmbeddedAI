import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import { IndexeddbPersistence } from 'y-indexeddb';
import { useProject } from './ProjectContext';
import { useAuth } from './AuthContext';

const CollaborationContext = createContext();

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

export const CollaborationProvider = ({ children }) => {
  const { currentProject } = useProject();
  const { user } = useAuth();

  // Yjs documents for different data types
  const ydocRef = useRef(null);
  const circuitYdocRef = useRef(null);
  const codeYdocRef = useRef(null);

  // Providers for WebRTC connections
  const providerRef = useRef(null);
  const circuitProviderRef = useRef(null);
  const codeProviderRef = useRef(null);

  // Collaboration state
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);
  const [roomId, setRoomId] = useState(null);

  // Awareness state for user presence
  const [awareness, setAwareness] = useState(null);

  // Initialize collaboration when project changes
  useEffect(() => {
    if (currentProject && user) {
      initializeCollaboration(currentProject._id);
    } else {
      disconnectCollaboration();
    }

    return () => {
      disconnectCollaboration();
    };
  }, [currentProject, user]);

  const initializeCollaboration = (projectId) => {
    try {
      // Create room ID based on project
      const room = `embedded-platform-${projectId}`;
      setRoomId(room);

      // Initialize main Yjs document
      ydocRef.current = new Y.Doc();

      // Initialize separate documents for different data types
      circuitYdocRef.current = new Y.Doc();
      codeYdocRef.current = new Y.Doc();

      // Set up persistence
      const persistence = new IndexeddbPersistence(room, ydocRef.current);
      const circuitPersistence = new IndexeddbPersistence(`${room}-circuit`, circuitYdocRef.current);
      const codePersistence = new IndexeddbPersistence(`${room}-code`, codeYdocRef.current);

      // Set up WebRTC providers
      providerRef.current = new WebrtcProvider(room, ydocRef.current, {
        signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com']
      });

      circuitProviderRef.current = new WebrtcProvider(`${room}-circuit`, circuitYdocRef.current, {
        signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com']
      });

      codeProviderRef.current = new WebrtcProvider(`${room}-code`, codeYdocRef.current, {
        signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com']
      });

      // Set up awareness for user presence
      const mainAwareness = providerRef.current.awareness;
      setAwareness(mainAwareness);

      // Set user information
      mainAwareness.setLocalStateField('user', {
        name: user.name || user.username,
        color: getRandomColor(),
        id: user._id
      });

      // Listen for connection changes
      providerRef.current.on('status', ({ connected }) => {
        setIsConnected(connected);
      });

      // Listen for awareness changes (users joining/leaving)
      mainAwareness.on('change', () => {
        const users = Array.from(mainAwareness.getStates().values())
          .filter(state => state.user)
          .map(state => state.user);
        setConnectedUsers(users);
      });

      setCollaborationEnabled(true);

    } catch (error) {
      console.error('Error initializing collaboration:', error);
      setCollaborationEnabled(false);
    }
  };

  const disconnectCollaboration = () => {
    try {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (circuitProviderRef.current) {
        circuitProviderRef.current.destroy();
        circuitProviderRef.current = null;
      }
      if (codeProviderRef.current) {
        codeProviderRef.current.destroy();
        codeProviderRef.current = null;
      }

      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }
      if (circuitYdocRef.current) {
        circuitYdocRef.current.destroy();
        circuitYdocRef.current = null;
      }
      if (codeYdocRef.current) {
        codeYdocRef.current.destroy();
        codeYdocRef.current = null;
      }

      setIsConnected(false);
      setConnectedUsers([]);
      setCollaborationEnabled(false);
      setAwareness(null);
      setRoomId(null);
    } catch (error) {
      console.error('Error disconnecting collaboration:', error);
    }
  };

  // Get Yjs maps for different data types
  const getCircuitMap = () => {
    if (!circuitYdocRef.current) return null;
    return circuitYdocRef.current.getMap('circuit');
  };

  const getCodeText = () => {
    if (!codeYdocRef.current) return null;
    return codeYdocRef.current.getText('code');
  };

  const getProjectMap = () => {
    if (!ydocRef.current) return null;
    return ydocRef.current.getMap('project');
  };

  // Utility function to generate random colors for users
  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Update user presence information
  const updatePresence = (data) => {
    if (awareness && data) {
      awareness.setLocalStateField('user', {
        ...awareness.getLocalState()?.user,
        ...data
      });
    }
  };

  const value = {
    // State
    isConnected,
    connectedUsers,
    collaborationEnabled,
    roomId,
    awareness,

    // Documents
    ydoc: ydocRef.current,
    circuitYdoc: circuitYdocRef.current,
    codeYdoc: codeYdocRef.current,

    // Maps/Texts
    getCircuitMap,
    getCodeText,
    getProjectMap,

    // Actions
    initializeCollaboration,
    disconnectCollaboration,
    updatePresence
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};