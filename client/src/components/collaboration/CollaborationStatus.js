import React from 'react';
import { useCollaboration } from '../../context/CollaborationContext';
import { useAuth } from '../../context/AuthContext';

const CollaborationStatus = () => {
  const { isConnected, connectedUsers, collaborationEnabled, roomId } = useCollaboration();
  const { user } = useAuth();

  if (!collaborationEnabled) {
    return null;
  }

  const currentUser = connectedUsers.find(u => u.id === user?._id);
  const otherUsers = connectedUsers.filter(u => u.id !== user?._id);

  return (
    <div className="collaboration-status">
      <div className="status-header">
        <div className="connection-indicator">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
          <span className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {roomId && (
          <div className="room-info">
            <span className="room-label">Room:</span>
            <span className="room-id">{roomId.slice(-8)}</span>
          </div>
        )}
      </div>

      <div className="users-section">
        <div className="current-user">
          <div
            className="user-avatar"
            style={{ backgroundColor: currentUser?.color || '#6b7280' }}
          >
            {(user?.name || user?.username || 'U')[0].toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || user?.username} (You)</span>
            <span className="user-status">Online</span>
          </div>
        </div>

        {otherUsers.length > 0 && (
          <div className="other-users">
            <h4>Collaborators ({otherUsers.length})</h4>
            <div className="users-list">
              {otherUsers.map((collaborator, index) => (
                <div key={collaborator.id || index} className="collaborator">
                  <div
                    className="user-avatar"
                    style={{ backgroundColor: collaborator.color || '#6b7280' }}
                  >
                    {collaborator.name[0].toUpperCase()}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{collaborator.name}</span>
                    <span className="user-status">Online</span>
                  </div>
                  <div className="user-cursor" style={{ backgroundColor: collaborator.color }}></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherUsers.length === 0 && (
          <div className="no-collaborators">
            <p>No other collaborators online</p>
            <p className="invite-text">Share the project link to invite others!</p>
          </div>
        )}
      </div>

      <div className="collaboration-actions">
        <button
          className="action-btn copy-link"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            // Could add toast notification here
          }}
        >
          📋 Copy Project Link
        </button>

        <button
          className="action-btn share"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Join my embedded systems project',
                text: `Join me in collaborating on "${currentUser?.name}'s project"`,
                url: window.location.href
              });
            }
          }}
        >
          📤 Share Project
        </button>
      </div>

      <style jsx>{`
        .collaboration-status {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          min-width: 280px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .connection-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.connected {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        .status-dot.disconnected {
          background: #ef4444;
        }

        .status-text {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .room-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        .room-label {
          font-weight: 500;
        }

        .room-id {
          font-family: 'Monaco', monospace;
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        .users-section {
          margin-bottom: 1rem;
        }

        .current-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          display: block;
          font-weight: 500;
          color: #1f2937;
          font-size: 0.875rem;
        }

        .user-status {
          display: block;
          font-size: 0.75rem;
          color: #10b981;
        }

        .other-users h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .users-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .collaborator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .user-cursor {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          opacity: 0.8;
        }

        .no-collaborators {
          text-align: center;
          padding: 1.5rem;
          color: #6b7280;
        }

        .invite-text {
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .collaboration-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: white;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .action-btn:active {
          transform: translateY(1px);
        }

        @media (max-width: 768px) {
          .collaboration-status {
            min-width: 250px;
          }

          .status-header {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }

          .collaboration-actions {
            flex-direction: row;
            gap: 0.5rem;
          }

          .action-btn {
            flex: 1;
            font-size: 0.75rem;
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CollaborationStatus;