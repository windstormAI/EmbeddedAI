import React from 'react';
import { Handle, Position } from 'react-flow-renderer';

const ArduinoNode = ({ data }) => {
  return (
    <div className="arduino-node">
      <div className="arduino-header">
        <span className="arduino-icon">🔧</span>
        <span className="arduino-label">{data.label}</span>
      </div>

      <div className="arduino-body">
        {/* Digital Pins */}
        <div className="pin-section">
          <h5>Digital</h5>
          <div className="pins-grid">
            {data.pins?.filter(pin => pin.type === 'digital').map((pin, index) => (
              <div key={pin.id} className="pin">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${pin.id}-out`}
                  style={{
                    background: pin.connected ? '#10b981' : '#6b7280',
                    width: '8px',
                    height: '8px'
                  }}
                />
                <span className="pin-label">{pin.id}</span>
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${pin.id}-in`}
                  style={{
                    background: pin.connected ? '#10b981' : '#6b7280',
                    width: '8px',
                    height: '8px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* PWM Pins */}
        <div className="pin-section">
          <h5>PWM</h5>
          <div className="pins-grid">
            {data.pins?.filter(pin => pin.type === 'pwm').map((pin, index) => (
              <div key={pin.id} className="pin pwm-pin">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${pin.id}-out`}
                  style={{
                    background: pin.connected ? '#f59e0b' : '#6b7280',
                    width: '8px',
                    height: '8px'
                  }}
                />
                <span className="pin-label">{pin.id}</span>
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${pin.id}-in`}
                  style={{
                    background: pin.connected ? '#f59e0b' : '#6b7280',
                    width: '8px',
                    height: '8px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Analog Pins */}
        <div className="pin-section">
          <h5>Analog</h5>
          <div className="pins-grid">
            {data.pins?.filter(pin => pin.type === 'analog').map((pin, index) => (
              <div key={pin.id} className="pin analog-pin">
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${pin.id}-out`}
                  style={{
                    background: pin.connected ? '#8b5cf6' : '#6b7280',
                    width: '8px',
                    height: '8px'
                  }}
                />
                <span className="pin-label">{pin.id}</span>
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${pin.id}-in`}
                  style={{
                    background: pin.connected ? '#8b5cf6' : '#6b7280',
                    width: '8px',
                    height: '8px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .arduino-node {
          background: white;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .arduino-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .arduino-icon {
          font-size: 1.25rem;
        }

        .arduino-label {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.875rem;
        }

        .arduino-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pin-section h5 {
          margin: 0 0 4px 0;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .pins-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
          gap: 4px;
        }

        .pin {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 4px 6px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #374151;
          position: relative;
        }

        .pin.pwm-pin {
          background: #fef3c7;
          border-color: #f59e0b;
        }

        .pin.analog-pin {
          background: #f3e8ff;
          border-color: #8b5cf6;
        }

        .pin-label {
          flex: 1;
          text-align: center;
          font-size: 0.7rem;
        }
      `}</style>
    </div>
  );
};

export default ArduinoNode;