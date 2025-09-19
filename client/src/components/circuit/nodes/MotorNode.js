import React from 'react';
import { Handle, Position } from 'react-flow-renderer';

const MotorNode = ({ data }) => {
  return (
    <div className="motor-node">
      <div className="motor-header">
        <span className="motor-icon">⚙️</span>
        <span className="motor-label">{data.label}</span>
      </div>

      <div className="motor-body">
        <div className="motor-visual">
          <div className="motor-device">
            <div className="motor-body-shape">
              <div className="motor-shaft">
                <div className="motor-blade motor-blade-1"></div>
                <div className="motor-blade motor-blade-2"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="motor-pins">
          <div className="pin-group">
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
                position={Position.Right}
                id="negative"
                style={{
                  background: '#000000',
                  width: '10px',
                  height: '10px',
                  right: '-5px'
                }}
              />
              <span className="pin-label">−</span>
            </div>
          </div>

          <div className="pin pwm">
            <Handle
              type="target"
              position={Position.Bottom}
              id="pwm"
              style={{
                background: '#f59e0b',
                width: '10px',
                height: '10px',
                top: 'auto',
                bottom: '-5px'
              }}
            />
            <span className="pin-label">PWM</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .motor-node {
          background: white;
          border: 2px solid #f97316;
          border-radius: 8px;
          padding: 12px;
          min-width: 140px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .motor-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .motor-icon {
          font-size: 1.25rem;
        }

        .motor-label {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.875rem;
        }

        .motor-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .motor-visual {
          display: flex;
          justify-content: center;
        }

        .motor-device {
          position: relative;
        }

        .motor-body-shape {
          width: 36px;
          height: 24px;
          background: #fed7aa;
          border: 2px solid #f97316;
          border-radius: 6px;
          position: relative;
        }

        .motor-shaft {
          position: absolute;
          top: 50%;
          right: -8px;
          transform: translateY(-50%);
          width: 8px;
          height: 2px;
          background: #374151;
        }

        .motor-blade {
          position: absolute;
          width: 12px;
          height: 2px;
          background: #374151;
          border-radius: 1px;
        }

        .motor-blade-1 {
          top: -4px;
          right: 0;
          transform: rotate(45deg);
        }

        .motor-blade-2 {
          bottom: -4px;
          right: 0;
          transform: rotate(-45deg);
        }

        .motor-pins {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .pin-group {
          display: flex;
          justify-content: space-between;
          gap: 8px;
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
          min-width: 32px;
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

        .pin.pwm {
          background: #fef3c7;
          border-color: #f59e0b;
          color: #f59e0b;
          margin: 0 auto;
        }

        .pin-label {
          font-size: 0.65rem;
        }
      `}</style>
    </div>
  );
};

export default MotorNode;