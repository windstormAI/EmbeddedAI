import React from 'react';
import { Handle, Position } from 'react-flow-renderer';

const ButtonNode = ({ data }) => {
  return (
    <div className="button-node">
      <div className="button-header">
        <span className="button-icon">🔘</span>
        <span className="button-label">{data.label}</span>
      </div>

      <div className="button-body">
        <div className="button-visual">
          <div className="button-switch">
            <div className="button-knob"></div>
          </div>
        </div>

        <div className="button-pins">
          <div className="pin signal">
            <Handle
              type="source"
              position={Position.Right}
              id="signal"
              style={{
                background: '#10b981',
                width: '10px',
                height: '10px'
              }}
            />
            <span className="pin-label">SIG</span>
          </div>

          <div className="pin ground">
            <Handle
              type="source"
              position={Position.Bottom}
              id="ground"
              style={{
                background: '#000000',
                width: '10px',
                height: '10px',
                top: 'auto',
                bottom: '-5px'
              }}
            />
            <span className="pin-label">GND</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .button-node {
          background: white;
          border: 2px solid #10b981;
          border-radius: 8px;
          padding: 12px;
          min-width: 120px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .button-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .button-icon {
          font-size: 1.25rem;
        }

        .button-label {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.875rem;
        }

        .button-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .button-visual {
          display: flex;
          justify-content: center;
        }

        .button-switch {
          width: 32px;
          height: 20px;
          background: #e5e7eb;
          border-radius: 10px;
          position: relative;
          border: 2px solid #d1d5db;
        }

        .button-knob {
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 1px;
          left: 1px;
          border: 1px solid #d1d5db;
          transition: transform 0.2s ease;
        }

        .button-pins {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .pin {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #374151;
          position: relative;
        }

        .pin.signal {
          background: #f0fdf4;
          border-color: #10b981;
          color: #10b981;
        }

        .pin.ground {
          background: #f9fafb;
          border-color: #374151;
          color: #374151;
        }

        .pin-label {
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  );
};

export default ButtonNode;