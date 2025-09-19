/**
 * Advanced 3D Circuit Viewer Component
 * Realistic 3D visualization with Three.js for circuit design and simulation
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';

const Circuit3DViewer = ({
  circuitData,
  onComponentSelect,
  onWireSelect,
  selectedComponents = [],
  simulationData = null,
  viewMode = 'design', // 'design', 'simulation', 'fabrication'
  quality = 'high' // 'low', 'medium', 'high'
}) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const composerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [performanceStats, setPerformanceStats] = useState({
    fps: 0,
    triangles: 0,
    drawCalls: 0
  });

  // Component meshes and materials cache
  const componentCache = useRef(new Map());
  const materialCache = useRef(new Map());

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const initScene = () => {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);
      scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(20, 15, 20);
      camera.lookAt(0, 0, 0);

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({
        antialias: quality !== 'low',
        alpha: false,
        powerPreference: 'high-performance'
      });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1));
      renderer.shadowMap.enabled = quality !== 'low';
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;

      mountRef.current.appendChild(renderer.domElement);

      // Controls setup
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 5;
      controls.maxDistance = 100;
      controls.maxPolarAngle = Math.PI / 2;

      // Lighting setup
      setupLighting(scene);

      // Post-processing setup
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      if (quality === 'high') {
        // Bloom effect for high quality
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(mountRef.current.clientWidth, mountRef.current.clientHeight),
          1.5, // strength
          0.4, // radius
          0.85 // threshold
        );
        composer.addPass(bloomPass);

        // Outline effect for selected components
        const outlinePass = new OutlinePass(
          new THREE.Vector2(mountRef.current.clientWidth, mountRef.current.clientHeight),
          scene,
          camera
        );
        outlinePass.edgeStrength = 3;
        outlinePass.edgeGlow = 0.5;
        outlinePass.edgeThickness = 2;
        outlinePass.visibleEdgeColor.set('#00ffff');
        outlinePass.hiddenEdgeColor.set('#00ffff');
        composer.addPass(outlinePass);
      }

      // Grid helper
      const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
      gridHelper.position.y = -0.01;
      scene.add(gridHelper);

      // Store references
      sceneRef.current = scene;
      rendererRef.current = renderer;
      cameraRef.current = camera;
      controlsRef.current = controls;
      composerRef.current = composer;

      setIsInitialized(true);

      // Start render loop
      animate();
    };

    const setupLighting = (scene) => {
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
      scene.add(ambientLight);

      // Main directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = quality !== 'low';
      directionalLight.shadow.mapSize.width = quality === 'high' ? 2048 : 1024;
      directionalLight.shadow.mapSize.height = quality === 'high' ? 2048 : 1024;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -20;
      directionalLight.shadow.camera.right = 20;
      directionalLight.shadow.camera.top = 20;
      directionalLight.shadow.camera.bottom = -20;
      scene.add(directionalLight);

      // Point lights for accent
      const pointLight1 = new THREE.PointLight(0x00ffff, 0.5, 20);
      pointLight1.position.set(-10, 5, -10);
      scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight(0xff00ff, 0.5, 20);
      pointLight2.position.set(10, 5, 10);
      scene.add(pointLight2);
    };

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (composerRef.current) {
        composerRef.current.render();
      } else if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      // Update performance stats
      updatePerformanceStats();
    };

    const updatePerformanceStats = () => {
      if (rendererRef.current && sceneRef.current) {
        const info = rendererRef.current.info;
        setPerformanceStats({
          fps: Math.round(1 / (performance.now() - (updatePerformanceStats.lastTime || performance.now())) * 1000),
          triangles: info.render.triangles,
          drawCalls: info.render.calls
        });
        updatePerformanceStats.lastTime = performance.now();
      }
    };

    initScene();

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      if (composerRef.current) {
        composerRef.current.dispose();
      }

      // Clear caches
      componentCache.current.clear();
      materialCache.current.clear();
    };
  }, [quality]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !mountRef.current) return;

      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);

      if (composerRef.current) {
        composerRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update circuit visualization
  useEffect(() => {
    if (!isInitialized || !sceneRef.current || !circuitData) return;

    updateCircuitVisualization();
  }, [circuitData, selectedComponents, simulationData, viewMode, isInitialized]);

  const updateCircuitVisualization = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear existing circuit objects
    clearCircuitObjects();

    // Create circuit components
    if (circuitData.components) {
      circuitData.components.forEach(component => {
        createComponentMesh(component);
      });
    }

    // Create wires/connections
    if (circuitData.connections) {
      circuitData.connections.forEach(connection => {
        createWireMesh(connection);
      });
    }

    // Update selection outlines
    updateSelectionOutlines();
  }, [circuitData, selectedComponents, simulationData]);

  const clearCircuitObjects = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove all circuit-related objects
    const objectsToRemove = [];
    scene.traverse((object) => {
      if (object.userData && (object.userData.type === 'component' || object.userData.type === 'wire')) {
        objectsToRemove.push(object);
      }
    });

    objectsToRemove.forEach(object => {
      scene.remove(object);
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  };

  const createComponentMesh = (component) => {
    const scene = sceneRef.current;
    if (!scene) return;

    let mesh;

    // Create different geometries based on component type
    switch (component.type) {
      case 'arduino-uno':
        mesh = createArduinoMesh(component);
        break;
      case 'esp32':
        mesh = createESP32Mesh(component);
        break;
      case 'led':
        mesh = createLEDMesh(component);
        break;
      case 'push-button':
        mesh = createButtonMesh(component);
        break;
      case 'temperature-sensor':
        mesh = createSensorMesh(component);
        break;
      default:
        mesh = createGenericComponentMesh(component);
    }

    if (mesh) {
      // Position the component
      mesh.position.set(component.x || 0, 0, component.y || 0);
      mesh.rotation.y = (component.rotation || 0) * Math.PI / 180;

      // Add user data for interaction
      mesh.userData = {
        type: 'component',
        componentId: component.id,
        componentType: component.type,
        originalData: component
      };

      // Add click handler
      mesh.addEventListener('click', () => {
        if (onComponentSelect) {
          onComponentSelect(component.id);
        }
      });

      scene.add(mesh);
    }
  };

  const createArduinoMesh = (component) => {
    const group = new THREE.Group();

    // Main board (rectangular PCB)
    const boardGeometry = new THREE.BoxGeometry(6, 0.2, 4);
    const boardMaterial = getMaterial('arduino-board', 0x00979C);
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.castShadow = true;
    board.receiveShadow = true;
    group.add(board);

    // Microcontroller chip
    const chipGeometry = new THREE.BoxGeometry(2, 0.5, 2);
    const chipMaterial = getMaterial('arduino-chip', 0x333333);
    const chip = new THREE.Mesh(chipGeometry, chipMaterial);
    chip.position.set(0, 0.35, 0);
    chip.castShadow = true;
    group.add(chip);

    // Pins
    for (let i = 0; i < 14; i++) {
      const pinGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8);
      const pinMaterial = getMaterial('arduino-pin', 0xC0C0C0);
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);

      const x = (i % 7 - 3) * 0.8;
      const z = i < 7 ? 2 : -2;
      pin.position.set(x, 0.5, z);
      pin.castShadow = true;
      group.add(pin);
    }

    return group;
  };

  const createLEDMesh = (component) => {
    const group = new THREE.Group();

    // LED body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2);
    const bodyMaterial = getMaterial('led-body', 0x333333);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);

    // LED lens
    const lensGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const lensMaterial = getMaterial('led-lens', component.color || 0xFFD700);
    lensMaterial.emissive = new THREE.Color(component.color || 0xFFD700);
    lensMaterial.emissiveIntensity = simulationData ? 0.3 : 0.1;
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.y = 0.15;
    lens.castShadow = true;
    group.add(lens);

    // Pins
    for (let i = 0; i < 2; i++) {
      const pinGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6);
      const pinMaterial = getMaterial('led-pin', 0xC0C0C0);
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);
      pin.position.set(i === 0 ? -0.2 : 0.2, -0.4, 0);
      pin.castShadow = true;
      group.add(pin);
    }

    return group;
  };

  const createWireMesh = (connection) => {
    const scene = sceneRef.current;
    if (!scene || !circuitData.components) return;

    const fromComponent = circuitData.components.find(c => c.id === connection.from?.componentId);
    const toComponent = circuitData.components.find(c => c.id === connection.to?.componentId);

    if (!fromComponent || !toComponent) return;

    // Calculate wire path
    const startPoint = new THREE.Vector3(fromComponent.x || 0, 0.5, fromComponent.y || 0);
    const endPoint = new THREE.Vector3(toComponent.x || 0, 0.5, toComponent.y || 0);

    // Create curved wire path
    const midPoint = new THREE.Vector3()
      .addVectors(startPoint, endPoint)
      .multiplyScalar(0.5);
    midPoint.y = Math.max(startPoint.y, endPoint.y) + 2;

    // Create wire geometry
    const curve = new THREE.QuadraticBezierCurve3(startPoint, midPoint, endPoint);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Wire material
    const material = new THREE.LineBasicMaterial({
      color: connection.color || 0x000000,
      linewidth: 3
    });

    const wire = new THREE.Line(geometry, material);
    wire.userData = {
      type: 'wire',
      connectionId: connection.id,
      originalData: connection
    };

    scene.add(wire);
  };

  const getMaterial = (key, color) => {
    if (materialCache.current.has(key)) {
      return materialCache.current.get(key);
    }

    const material = new THREE.MeshLambertMaterial({
      color: color,
      transparent: false
    });

    materialCache.current.set(key, material);
    return material;
  };

  const updateSelectionOutlines = () => {
    if (!composerRef.current) return;

    const selectedMeshes = [];
    sceneRef.current.traverse((object) => {
      if (object.userData?.type === 'component' &&
          selectedComponents.includes(object.userData.componentId)) {
        selectedMeshes.push(object);
      }
    });

    // Update outline pass if available
    composerRef.current.passes.forEach(pass => {
      if (pass instanceof OutlinePass) {
        pass.selectedObjects = selectedMeshes;
      }
    });
  };

  const createGenericComponentMesh = (component) => {
    const geometry = new THREE.BoxGeometry(2, 1, 1);
    const material = getMaterial(`generic-${component.type}`, 0x666666);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Additional component mesh creators would go here
  const createESP32Mesh = (component) => createGenericComponentMesh(component);
  const createButtonMesh = (component) => createGenericComponentMesh(component);
  const createSensorMesh = (component) => createGenericComponentMesh(component);

  // Export functionality
  const exportSTL = useCallback(() => {
    // Implementation for STL export
    console.log('Exporting circuit as STL...');
  }, []);

  const exportOBJ = useCallback(() => {
    // Implementation for OBJ export
    console.log('Exporting circuit as OBJ...');
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />

      {/* Performance Stats Overlay */}
      {quality === 'high' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs font-mono">
          <div>FPS: {performanceStats.fps}</div>
          <div>Triangles: {performanceStats.triangles}</div>
          <div>Draw Calls: {performanceStats.drawCalls}</div>
        </div>
      )}

      {/* View Mode Indicator */}
      <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded text-sm">
        {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Mode
      </div>

      {/* Quality Settings */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          onClick={() => {/* Toggle wireframe */}}
          className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
        >
          Wireframe
        </button>
        <button
          onClick={exportSTL}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
        >
          Export STL
        </button>
      </div>

      {/* Loading Indicator */}
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading 3D Circuit Viewer...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Circuit3DViewer;