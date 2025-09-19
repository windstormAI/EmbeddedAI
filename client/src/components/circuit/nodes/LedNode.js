import React from 'react';
import { Handle, Position } from 'react-flow-renderer';

const LedNode = ({ data }) => {
  return (
    <div className="led-node">
      <div className="led-header">
        <span className="led-icon">💡</span>
        <span className="led-label">{data.label}</span>
      </div>

      <div className="led-body">
        <div className="led-visual">
          <div className="led-bulb" style={{ backgroundColor: data.color || '#ff0000' }}></div>
        </div>

        <div className="led-pins">
          <div className="pin positive">
            <Handle
              type="target"
              position={Position.Left}
              id="positive"
              style={{
                background: '#dc2626',
                width: '10px',
                height: '10px',
                left: '-5px'
              }}
            />
            <span className="pin-label">+</span>
          </div>

          <div className="pin negative">
            <Handle
              type="target"
              position={Position.Bottom}
              id="negative"
              style={{
                background: '#000000',
                width: '10px',
                height: '10px',
                top: 'auto',
                bottom: '-5px'
              }}
            />
            <span className="pin-label">−</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .led-node {
          background: white;
          border: 2px solid #f59e0b;
          border-radius: 8px;
          padding: 12px;
          min-width: 120px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .led-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .led-icon {
          font-size: 1.25rem;
        }

        .led-label {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.875rem;
        }

        .led-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .led-visual {
          display: flex;
          justify-content: center;
        }

        .led-bulb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #374151;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
        }

        .led-pins {
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

        .pin.positive {
          background: #fef2f2;
          border-color: #dc2626;
          color: #dc2626;
        }

        .pin.negative {
          background: #f9fafb;
          border-color: #374151;
          color: #374151;
        }

        .pin-label {
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default LedNode;