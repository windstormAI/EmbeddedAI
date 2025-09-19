import React from 'react';
import { Handle, Position } from 'react-flow-renderer';

const SensorNode = ({ data }) => {
  return (
    <div className="sensor-node">
      <div className="sensor-header">
        <span className="sensor-icon">📡</span>
        <span className="sensor-label">{data.label}</span>
      </div>

      <div className="sensor-body">
        <div className="sensor-visual">
          <div className="sensor-device">
            <div className="sensor-eye"></div>
            <div className="sensor-waves">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
          </div>
        </div>

        <div className="sensor-pins">
          <div className="pin vcc">
            <Handle
              type="target"
              position={Position.Top}
              id="vcc"
              style={{
                background: '#dc2626',
                width: '10px',
                height: '10px',
                top: '-5px'
              }}
            />
            <span className="pin-label">VCC</span>
          </div>

          <div className="pin signal">
            <Handle
              type="source"
              position={Position.Right}
              id="signal"
              style={{
                background: '#8b5cf6',
                width: '10px',
                height: '10px'
              }}
            />
            <span className="pin-label">SIG</span>
          </div>

          <div className="pin ground">
            <Handle
              type="target"
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
        .sensor-node {
          background: white;
          border: 2px solid #8b5cf6;
          border-radius: 8px;
          padding: 12px;
          min-width: 120px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .sensor-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .sensor-icon {
          font-size: 1.25rem;
        }

        .sensor-label {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.875rem;
        }

        .sensor-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .sensor-visual {
          display: flex;
          justify-content: center;
        }

        .sensor-device {
          position: relative;
          width: 32px;
          height: 24px;
          background: #f3e8ff;
          border: 2px solid #8b5cf6;
          border-radius: 4px;
        }

        .sensor-eye {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          background: #8b5cf6;
          border-radius: 50%;
        }

        .sensor-waves {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 2px;
        }

        .wave {
          width: 2px;
          height: 4px;
          background: #8b5cf6;
          border-radius: 1px;
          opacity: 0.6;
        }

        .sensor-pins {
          display: flex;
          flex-direction: column;
          gap: 6px;
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
          font-size: 0.7rem;
          font-weight: 600;
          color: #374151;
          position: relative;
        }

        .pin.vcc {
          background: #fef2f2;
          border-color: #dc2626;
          color: #dc2626;
        }

        .pin.signal {
          background: #f3e8ff;
          border-color: #8b5cf6;
          color: #8b5cf6;
        }

        .pin.ground {
          background: #f9fafb;
          border-color: #374151;
          color: #374151;
        }

        .pin-label {
          font-size: 0.65rem;
        }
      `}</style>
    </div>
  );
};

export default SensorNode;