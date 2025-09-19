/**
 * Circuit Designer 3D Component
 * Advanced 3D visualization of circuits using Three.js and React Three Fiber
 */

import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Text,
  Html,
  useTexture,
  useGLTF,
  useAnimations
} from '@react-three/drei';
import * as THREE from 'three';
import {
  Box,
  Cylinder,
  Sphere,
  Plane,
  Wireframe,
  Edges,
  RoundedBox,
  Text as Text3D
} from '@react-three/drei';

// 3D Component representations
const Component3D = ({ component, onClick, isSelected }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Component-specific 3D models
  const getComponentGeometry = (type) => {
    switch (type) {
      case 'arduino-uno':
        return (
          <RoundedBox
            ref={meshRef}
            args={[6, 4, 0.5]}
            radius={0.1}
            smoothness={4}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshStandardMaterial
              color={isSelected ? '#3b82f6' : hovered ? '#60a5fa' : '#4a90e2'}
              metalness={0.3}
              roughness={0.4}
            />
          </RoundedBox>
        );

      case 'esp32':
        return (
          <RoundedBox
            ref={meshRef}
            args={[5, 3, 0.3]}
            radius={0.1}
            smoothness={4}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshStandardMaterial
              color={isSelected ? '#dc2626' : hovered ? '#ef4444' : '#e7352c'}
              metalness={0.5}
              roughness={0.3}
            />
          </RoundedBox>
        );

      case 'led':
        return (
          <group onClick={onClick}>
            <Cylinder
              ref={meshRef}
              args={[0.3, 0.3, 0.8]}
              onPointerOver={() => setHovered(true)}
              onPointerOut={() => setHovered(false)}
            >
              <meshStandardMaterial
                color={isSelected ? '#fbbf24' : hovered ? '#fcd34d' : '#f59e0b'}
                emissive={isSelected ? '#fbbf24' : '#000000'}
                emissiveIntensity={isSelected ? 0.2 : 0}
              />
            </Cylinder>
            {/* LED lens */}
            <Sphere args={[0.25]} position={[0, 0.4, 0]}>
              <meshPhysicalMaterial
                color="#ffffff"
                transmission={0.9}
                opacity={0.7}
                metalness={0}
                roughness={0}
                thickness={0.1}
              />
            </Sphere>
          </group>
        );

      case 'push-button':
        return (
          <group onClick={onClick}>
            <Cylinder
              ref={meshRef}
              args={[0.8, 0.8, 0.3]}
              onPointerOver={() => setHovered(true)}
              onPointerOut={() => setHovered(false)}
            >
              <meshStandardMaterial
                color={isSelected ? '#3b82f6' : hovered ? '#60a5fa' : '#6b7280'}
                metalness={0.1}
                roughness={0.8}
              />
            </Cylinder>
            {/* Button top */}
            <Cylinder args={[0.6, 0.6, 0.2]} position={[0, 0.25, 0]}>
              <meshStandardMaterial
                color={isSelected ? '#60a5fa' : '#9ca3af'}
                metalness={0.2}
                roughness={0.6}
              />
            </Cylinder>
          </group>
        );

      case 'potentiometer':
        return (
          <group onClick={onClick}>
            <Box
              ref={meshRef}
              args={[1.5, 1, 0.5]}
              onPointerOver={() => setHovered(true)}
              onPointerOut={() => setHovered(false)}
            >
              <meshStandardMaterial
                color={isSelected ? '#10b981' : hovered ? '#34d399' : '#6b7280'}
                metalness={0.1}
                roughness={0.8}
              />
            </Box>
            {/* Knob */}
            <Cylinder args={[0.4, 0.4, 0.3]} position={[0, 0.4, 0]}>
              <meshStandardMaterial
                color={isSelected ? '#34d399' : '#9ca3af'}
                metalness={0.3}
                roughness={0.5}
              />
            </Cylinder>
          </group>
        );

      case 'buzzer':
        return (
          <group onClick={onClick}>
            <Cylinder
              ref={meshRef}
              args={[0.6, 0.6, 0.4]}
              onPointerOver={() => setHovered(true)}
              onPointerOut={() => setHovered(false)}
            >
              <meshStandardMaterial
                color={isSelected ? '#f59e0b' : hovered ? '#fbbf24' : '#d97706'}
                metalness={0.2}
                roughness={0.7}
              />
            </Cylinder>
            {/* Sound holes */}
            <Cylinder args={[0.05, 0.05, 0.1]} position={[0.3, 0.2, 0]}>
              <meshStandardMaterial color="#000000" />
            </Cylinder>
            <Cylinder args={[0.05, 0.05, 0.1]} position={[-0.3, 0.2, 0]}>
              <meshStandardMaterial color="#000000" />
            </Cylinder>
          </group>
        );

      case 'temperature-sensor':
        return (
          <group onClick={onClick}>
            <Box
              ref={meshRef}
              args={[1, 0.5, 0.3]}
              onPointerOver={() => setHovered(true)}
              onPointerOut={() => setHovered(false)}
            >
              <meshStandardMaterial
                color={isSelected ? '#dc2626' : hovered ? '#ef4444' : '#6b7280'}
                metalness={0.1}
                roughness={0.8}
              />
            </Box>
            {/* Sensor element */}
            <Cylinder args={[0.1, 0.1, 0.2]} position={[0, 0.2, 0]}>
              <meshStandardMaterial color="#9ca3af" />
            </Cylinder>
          </group>
        );

      case 'photoresistor':
        return (
          <group onClick={onClick}>
            <Box
              ref={meshRef}
              args={[1.2, 0.4, 0.2]}
              onPointerOver={() => setHovered(true)}
              onPointerOut={() => setHovered(false)}
            >
              <meshStandardMaterial
                color={isSelected ? '#8b5cf6' : hovered ? '#a78bfa' : '#6b7280'}
                metalness={0.1}
                roughness={0.8}
              />
            </Box>
            {/* Light sensor surface */}
            <Box args={[0.8, 0.2, 0.05]} position={[0, 0.1, 0]}>
              <meshStandardMaterial color="#374151" />
            </Box>
          </group>
        );

      default:
        return (
          <Box
            ref={meshRef}
            args={[1, 1, 0.5]}
            onClick={onClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <meshStandardMaterial
              color={isSelected ? '#3b82f6' : hovered ? '#60a5fa' : '#6b7280'}
              metalness={0.1}
              roughness={0.8}
            />
          </Box>
        );
    }
  };

  // Animation for selected/hovered states
  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.rotation.y += 0.01;
      } else if (hovered) {
        meshRef.current.scale.setScalar(1.1);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group position={[component.x / 10, 0, component.y / 10]}>
      {getComponentGeometry(component.type)}

      {/* Component label */}
      <Html position={[0, 2, 0]} center>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-white'
        }`}>
          {component.name}
        </div>
      </Html>

      {/* Connection points visualization */}
      {isSelected && (
        <>
          <Sphere args={[0.1]} position={[-1, 0, 0]}>
            <meshStandardMaterial color="#10b981" />
          </Sphere>
          <Sphere args={[0.1]} position={[1, 0, 0]}>
            <meshStandardMaterial color="#10b981" />
          </Sphere>
        </>
      )}
    </group>
  );
};

// Connection visualization
const Connection3D = ({ connection, components }) => {
  const fromComp = components.find(c => c.id === connection.from.componentId);
  const toComp = components.find(c => c.id === connection.to.componentId);

  if (!fromComp || !toComp) return null;

  const start = new THREE.Vector3(fromComp.x / 10, 0, fromComp.y / 10);
  const end = new THREE.Vector3(toComp.x / 10, 0, toComp.y / 10);
  const mid = start.clone().lerp(end, 0.5);
  mid.y = 1; // Arc up for better visibility

  // Create curved line
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(50);

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b82f6" linewidth={3} />
      </line>

      {/* Connection direction indicator */}
      <Sphere args={[0.05]} position={[mid.x, mid.y, mid.z]}>
        <meshStandardMaterial color="#3b82f6" />
      </Sphere>
    </group>
  );
};

// Grid component
const Grid = () => {
  return (
    <group>
      {/* Ground plane */}
      <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#f3f4f6" transparent opacity={0.8} />
      </Plane>

      {/* Grid lines */}
      {Array.from({ length: 21 }, (_, i) => (
        <group key={i}>
          <Plane
            args={[100, 0.1]}
            position={[0, 0, (i - 10) * 5]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <meshStandardMaterial color="#e5e7eb" transparent opacity={0.3} />
          </Plane>
          <Plane
            args={[0.1, 100]}
            position={[(i - 10) * 5, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <meshStandardMaterial color="#e5e7eb" transparent opacity={0.3} />
          </Plane>
        </group>
      ))}
    </group>
  );
};

// Main 3D Circuit Designer Component
const CircuitDesigner3D = ({ components = [], connections = [], onComponentSelect }) => {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [cameraPosition, setCameraPosition] = useState([20, 15, 20]);
  const [autoRotate, setAutoRotate] = useState(false);

  const handleComponentClick = (componentId) => {
    setSelectedComponent(componentId);
    if (onComponentSelect) {
      onComponentSelect(componentId);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800 relative">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 rounded-lg p-4 text-white">
        <h3 className="text-lg font-semibold mb-3">3D Circuit View</h3>
        <div className="space-y-2">
          <button
            onClick={() => setCameraPosition([20, 15, 20])}
            className="block w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            Top View
          </button>
          <button
            onClick={() => setCameraPosition([0, 20, 0])}
            className="block w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            Side View
          </button>
          <button
            onClick={() => setCameraPosition([30, 10, 30])}
            className="block w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            Isometric View
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`block w-full px-3 py-2 rounded text-sm ${
              autoRotate ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {autoRotate ? 'Stop Rotation' : 'Auto Rotate'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 rounded-lg p-4 text-white">
        <div className="text-sm space-y-1">
          <div>Components: {components.length}</div>
          <div>Connections: {connections.length}</div>
          <div>Selected: {selectedComponent || 'None'}</div>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 60 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* Environment */}
          <Environment preset="studio" />

          {/* Camera controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={100}
          />

          {/* Grid */}
          <Grid />

          {/* Components */}
          {components.map(component => (
            <Component3D
              key={component.id}
              component={component}
              onClick={() => handleComponentClick(component.id)}
              isSelected={selectedComponent === component.id}
            />
          ))}

          {/* Connections */}
          {connections.map(connection => (
            <Connection3D
              key={connection.id}
              connection={connection}
              components={components}
            />
          ))}

          {/* Contact shadows */}
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.4}
            scale={50}
            blur={2.5}
            far={4.5}
          />

          {/* Performance monitor (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <Html position={[-10, 10, 0]}>
              <div className="bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                <div>FPS: --</div>
                <div>Triangles: --</div>
                <div>Geometries: --</div>
              </div>
            </Html>
          )}
        </Suspense>
      </Canvas>

      {/* Loading indicator */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded text-sm">
          3D Circuit Designer Active
        </div>
      </div>
    </div>
  );
};

export default CircuitDesigner3D;