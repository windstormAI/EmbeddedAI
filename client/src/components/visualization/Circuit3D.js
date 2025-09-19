// ... existing imports and Arduino3D component ...

// 3D Sensor Component
function Sensor3D({ position, rotation = [0, 0, 0] }) {
  const sensorRef = useRef();
  const waveRef = useRef();

  useFrame((state) => {
    if (waveRef.current) {
      waveRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Sensor Body */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.8, 0.3, 0.6]} />
        <meshStandardMaterial color="#4a5568" />
      </mesh>

      {/* Sensor Lens */}
      <mesh position={[0, 0.25, 0.25]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        <meshStandardMaterial
          color="#60a5fa"
          transparent
          opacity={0.7}
          emissive="#60a5fa"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Ultrasonic Waves */}
      <mesh ref={waveRef} position={[0, 0.25, 0.35]}>
        <ringGeometry args={[0.2, 0.3, 16]} />
        <meshStandardMaterial
          color="#60a5fa"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sensor Pins */}
      <mesh position={[-0.3, -0.05, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
      <mesh position={[-0.1, -0.05, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
      <mesh position={[0.1, -0.05, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
      <mesh position={[0.3, -0.05, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>

      {/* Pin Labels */}
      <Text position={[-0.3, -0.15, 0]} fontSize={0.08} color="white" anchorX="center">VCC</Text>
      <Text position={[-0.1, -0.15, 0]} fontSize={0.08} color="white" anchorX="center">TRIG</Text>
      <Text position={[0.1, -0.15, 0]} fontSize={0.08} color="white" anchorX="center">ECHO</Text>
      <Text position={[0.3, -0.15, 0]} fontSize={0.08} color="white" anchorX="center">GND</Text>

      {/* Label */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.12}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Ultrasonic Sensor
      </Text>
    </group>
  );
}

// 3D Motor Component
function Motor3D({ position, rotation = [0, 0, 0] }) {
  const shaftRef = useRef();

  useFrame((state) => {
    if (shaftRef.current) {
      shaftRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Motor Body */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.6, 16]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* Motor Shaft */}
      <mesh ref={shaftRef} position={[0.4, 0.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      {/* Motor Blades */}
      <mesh position={[0.6, 0.2, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.1]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>
      <mesh position={[0.6, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.3, 0.02, 0.1]} />
        <meshStandardMaterial color="#6b7280" />
      </mesh>

      {/* Motor Mount */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.8]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Motor Pins */}
      <mesh position={[-0.2, -0.25, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>
      <mesh position={[0.2, -0.25, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshStandardMaterial color="#c0c0c0" />
      </mesh>

      {/* Pin Labels */}
      <Text position={[-0.2, -0.35, 0]} fontSize={0.08} color="white" anchorX="center">GND</Text>
      <Text position={[0, -0.35, 0]} fontSize={0.08} color="white" anchorX="center">PWM</Text>
      <Text position={[0.2, -0.35, 0]} fontSize={0.08} color="white" anchorX="center">VCC</Text>

      {/* Label */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.12}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        DC Motor
      </Text>
    </group>
  );
}

// 3D Breadboard Component
function Breadboard3D({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Breadboard Base */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[8, 0.1, 6]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>

      {/* Breadboard Surface */}
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[7.5, 0.02, 5.5]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>

      {/* Hole Grid */}
      {Array.from({ length: 10 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => (
          <mesh key={`hole-${row}-${col}`} position={[-3.5 + col * 0.9, 0.12, -2.5 + row * 0.6]}>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 8]} />
            <meshStandardMaterial color="#2d2d2d" />
          </mesh>
        ))
      )}

      {/* Label */}
      <Text
        position={[0, 0.25, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Breadboard
      </Text>
    </group>
  );
}

// ... existing Wire3D and Circuit3D components ...

      {/* 3D Components */}
      {components3D.map(component => {
        switch (component.type) {
          case 'arduino':
            return (
              <Arduino3D
                key={component.id}
                position={component.position}
                onClick={() => onComponentClick && onComponentClick(component)}
              />
            );
          case 'led':
            return (
              <LED3D
                key={component.id}
                position={component.position}
                color="#ff0000"
                onClick={() => onComponentClick && onComponentClick(component)}
              />
            );
          case 'button':
            return (
              <Button3D
                key={component.id}
                position={component.position}
                onClick={() => onComponentClick && onComponentClick(component)}
              />
            );
          case 'sensor':
            return (
              <Sensor3D
                key={component.id}
                position={component.position}
                onClick={() => onComponentClick && onComponentClick(component)}
              />
            );
          case 'motor':
            return (
              <Motor3D
                key={component.id}
                position={component.position}
                onClick={() => onComponentClick && onComponentClick(component)}
              />
            );
          case 'breadboard':
            return (
              <Breadboard3D
                key={component.id}
                position={component.position}
                onClick={() => onComponentClick && onComponentClick(component)}
              />
            );
          default:
            return null;
        }
      })}

// ... existing code ...