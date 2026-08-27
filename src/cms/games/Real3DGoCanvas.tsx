import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { GoEngine } from './goEngine';
import { gameAudio } from './gameAudio';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

export type GoThemeKey = 'kaya' | 'bamboo' | 'scroll' | 'cyber';

export interface GoTheme {
  id: GoThemeKey;
  name: string;
  boardBg: string;
  lineColor: string;
  woodColor: number;
}

export const GO_THEMES: Record<GoThemeKey, GoTheme> = {
  kaya: {
    id: 'kaya',
    name: '🌳 Gỗ Shin Kaya (Nhật)',
    boardBg: '#E9C088',
    lineColor: '#3F2817',
    woodColor: 0xdeb887,
  },
  bamboo: {
    id: 'bamboo',
    name: '🎋 Trúc Hoàng Gia (Bamboo)',
    boardBg: '#D8B168',
    lineColor: '#2B1A0E',
    woodColor: 0xcda250,
  },
  scroll: {
    id: 'scroll',
    name: '📜 Giấy Xuyến Thủy Mặc',
    boardBg: '#EDE4D3',
    lineColor: '#1E293B',
    woodColor: 0xd9ceb8,
  },
  cyber: {
    id: 'cyber',
    name: '🌌 Cyber Neon Obsidian',
    boardBg: '#0F172A',
    lineColor: '#00DF89',
    woodColor: 0x1e293b,
  },
};

interface Real3DGoCanvasProps {
  fen: string;
  myColor: 'black' | 'white' | 'spectator';
  isMyTurn: boolean;
  onMove: (x: number, y: number) => void;
  lastMove?: { x: number; y: number } | null;
  disabled?: boolean;
  themeKey?: GoThemeKey;
}

// Generate Go Board Grid Texture with Star Points (Hoshi)
function createGoBoardTexture(size: number, theme: GoTheme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = theme.boardBg;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle wood grain noise/gradient
  const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.03)');
  grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Outer border line
  ctx.strokeStyle = theme.lineColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(36, 36, 952, 952);

  const pad = 56;
  const step = (1024 - pad * 2) / (size - 1);

  ctx.lineWidth = 3.5;
  ctx.strokeStyle = theme.lineColor;

  // Grid lines
  for (let i = 0; i < size; i++) {
    const pos = pad + i * step;
    // Horizontal
    ctx.beginPath();
    ctx.moveTo(pad, pos);
    ctx.lineTo(1024 - pad, pos);
    ctx.stroke();

    // Vertical
    ctx.beginPath();
    ctx.moveTo(pos, pad);
    ctx.lineTo(pos, 1024 - pad);
    ctx.stroke();
  }

  // Star Points (Hoshi)
  const engine = new GoEngine(size);
  const starPoints = engine.getStarPoints();
  ctx.fillStyle = theme.lineColor;

  for (const pt of starPoints) {
    const px = pad + pt.x * step;
    const py = pad + pt.y * step;
    ctx.beginPath();
    ctx.arc(px, py, size === 19 ? 7 : 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

// Generate Bi-Convex Go Stone Geometry (Convex lens shape)
function createGoStoneGeometry(radius: number): THREE.BufferGeometry {
  // Lathe geometry creates a realistic smooth bi-convex Go stone
  const points: THREE.Vector2[] = [];
  const thickness = radius * 0.58;
  const segments = 16;

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI;
    const r = Math.sin(t) * radius;
    const y = -Math.cos(t) * (thickness / 2);
    points.push(new THREE.Vector2(r, y));
  }

  return new THREE.LatheGeometry(points, 32);
}

export const Real3DGoCanvas: React.FC<Real3DGoCanvasProps> = ({
  fen,
  myColor,
  isMyTurn,
  onMove,
  lastMove,
  disabled = false,
  themeKey = 'kaya',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const engine = useMemo(() => new GoEngine(fen), [fen]);
  const theme = GO_THEMES[themeKey] || GO_THEMES.kaya;

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const stonesGroupRef = useRef<THREE.Group | null>(null);
  const ghostStoneMeshRef = useRef<THREE.Mesh | null>(null);
  const lastMoveMarkerRef = useRef<THREE.Mesh | null>(null);
  const boardIntersectionsRef = useRef<THREE.Mesh[]>([]);

  // Camera Orbit State
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraOrbitRef = useRef({
    radius: 10.2,
    theta: myColor === 'white' ? Math.PI : 0,
    phi: 1.02,
  });

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraOrbitRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  };

  const handleResetCamera = () => {
    cameraOrbitRef.current = {
      radius: 10.2,
      theta: myColor === 'white' ? Math.PI : 0,
      phi: 1.02,
    };
    updateCameraPosition();
  };

  const handleZoom = (delta: number) => {
    cameraOrbitRef.current.radius = Math.max(6.5, Math.min(18, cameraOrbitRef.current.radius + delta));
    updateCameraPosition();
  };

  // Convert board coordinate (x: 0..size-1, y: 0..size-1) to 3D world space (X, Z)
  const posToWorld = (x: number, y: number) => {
    const boardSpan = 8.6;
    const step = boardSpan / (engine.size - 1);
    const half = boardSpan / 2;
    const wx = x * step - half;
    const wz = y * step - half;
    return { x: wx, z: wz };
  };

  // Initial Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 700;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;
    cameraOrbitRef.current.theta = myColor === 'white' ? Math.PI : 0;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5e6, 1.4);
    dirLight1.position.set(8, 14, 8);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 35;
    dirLight1.shadow.camera.left = -6;
    dirLight1.shadow.camera.right = 6;
    dirLight1.shadow.camera.top = 6;
    dirLight1.shadow.camera.bottom = -6;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x80b0ff, 0.5);
    dirLight2.position.set(-8, 8, -8);
    scene.add(dirLight2);

    // 5. Board Base Slab (Thick wooden Goban)
    const boardTexture = createGoBoardTexture(engine.size, theme);
    const boardMat = new THREE.MeshStandardMaterial({
      map: boardTexture,
      roughness: 0.35,
      metalness: 0.05,
    });
    const sideMat = new THREE.MeshStandardMaterial({ color: theme.woodColor, roughness: 0.45 });
    const materials = [sideMat, sideMat, boardMat, sideMat, sideMat, sideMat];

    const boardWidth = 9.6;
    const boardLength = 9.6;
    const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(boardWidth, 0.6, boardLength), materials);
    boardMesh.position.y = -0.3;
    boardMesh.receiveShadow = true;
    boardMesh.castShadow = true;
    scene.add(boardMesh);

    // 6. Clickable Invisible Intersection Meshes for Raycasting
    const intersectionMeshes: THREE.Mesh[] = [];
    const stoneRadius = 8.6 / (engine.size - 1) * 0.48;
    const interGeom = new THREE.CylinderGeometry(stoneRadius * 0.95, stoneRadius * 0.95, 0.1, 16);
    const interMat = new THREE.MeshBasicMaterial({ visible: false });

    for (let y = 0; y < engine.size; y++) {
      for (let x = 0; x < engine.size; x++) {
        const mesh = new THREE.Mesh(interGeom, interMat);
        const { x: wx, z: wz } = posToWorld(x, y);
        mesh.position.set(wx, 0.05, wz);
        mesh.userData = { gridX: x, gridY: y };
        scene.add(mesh);
        intersectionMeshes.push(mesh);
      }
    }
    boardIntersectionsRef.current = intersectionMeshes;

    // 7. Ghost Hover Stone
    const ghostGeom = createGoStoneGeometry(stoneRadius);
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x00df89,
      transparent: true,
      opacity: 0.5,
      roughness: 0.2,
    });
    const ghostMesh = new THREE.Mesh(ghostGeom, ghostMat);
    ghostMesh.visible = false;
    ghostMesh.position.y = 0.15;
    scene.add(ghostMesh);
    ghostStoneMeshRef.current = ghostMesh;

    // 8. Last Move Red Dot Marker
    const markerGeom = new THREE.SphereGeometry(stoneRadius * 0.22, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const lastMoveMarker = new THREE.Mesh(markerGeom, markerMat);
    lastMoveMarker.visible = false;
    scene.add(lastMoveMarker);
    lastMoveMarkerRef.current = lastMoveMarker;

    // 9. Stones Group
    const stonesGroup = new THREE.Group();
    scene.add(stonesGroup);
    stonesGroupRef.current = stonesGroup;

    // 10. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize Handler with ResizeObserver
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 700;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    setTimeout(handleResize, 50);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [engine.size, themeKey]);

  // Update Stones based on FEN
  useEffect(() => {
    const stonesGroup = stonesGroupRef.current;
    if (!stonesGroup) return;

    while (stonesGroup.children.length > 0) {
      stonesGroup.remove(stonesGroup.children[0]);
    }

    const stoneRadius = 8.6 / (engine.size - 1) * 0.48;
    const stoneGeom = createGoStoneGeometry(stoneRadius);

    // Black Slate Material
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.28,
      metalness: 0.1,
    });

    // White Shell Material
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.18,
      metalness: 0.05,
    });

    for (let y = 0; y < engine.size; y++) {
      for (let x = 0; x < engine.size; x++) {
        const color = engine.get(x, y);
        if (color) {
          const isBlack = color === 'B';
          const mesh = new THREE.Mesh(stoneGeom, isBlack ? blackMat : whiteMat);
          const { x: wx, z: wz } = posToWorld(x, y);

          mesh.position.set(wx, stoneRadius * 0.28, wz);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { gridX: x, gridY: y, color };

          stonesGroup.add(mesh);
        }
      }
    }

    // Update Last Move Marker
    if (lastMove && lastMoveMarkerRef.current) {
      const { x: lx, z: lz } = posToWorld(lastMove.x, lastMove.y);
      lastMoveMarkerRef.current.position.set(lx, stoneRadius * 0.65, lz);
      lastMoveMarkerRef.current.visible = true;
    } else if (lastMoveMarkerRef.current) {
      lastMoveMarkerRef.current.visible = false;
    }
  }, [fen, engine, lastMove]);

  // Raycasting & Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const dx = e.clientX - prevMousePosRef.current.x;
    const dy = e.clientY - prevMousePosRef.current.y;

    if (e.buttons === 1 || e.buttons === 2) {
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDraggingRef.current = true;
      }

      cameraOrbitRef.current.theta -= dx * 0.007;
      cameraOrbitRef.current.phi = Math.max(
        0.2,
        Math.min(Math.PI / 2 - 0.05, cameraOrbitRef.current.phi - dy * 0.007)
      );
      updateCameraPosition();
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Hover Raycasting
    if (!isDraggingRef.current && isMyTurn && !disabled && containerRef.current && cameraRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(boardIntersectionsRef.current);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const gx = hit.userData.gridX;
        const gy = hit.userData.gridY;

        if (engine.get(gx, gy) === null) {
          if (ghostStoneMeshRef.current) {
            const { x: wx, z: wz } = posToWorld(gx, gy);
            ghostStoneMeshRef.current.position.set(wx, 0.12, wz);
            ghostStoneMeshRef.current.visible = true;
          }
          return;
        }
      }
    }

    if (ghostStoneMeshRef.current) {
      ghostStoneMeshRef.current.visible = false;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    if (!isMyTurn || disabled || !containerRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(boardIntersectionsRef.current);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const gx = hit.userData.gridX;
      const gy = hit.userData.gridY;

      if (engine.get(gx, gy) === null) {
        gameAudio.playMoveSound();
        onMove(gx, gy);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: isMyTurn && !disabled ? 'pointer' : 'grab',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
          backgroundColor: '#0A0F1D',
        }}
      />

      {/* Floating 3D Interaction Tooltip */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '4px 14px',
          color: '#94A3B8',
          fontSize: '0.72rem',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        💡 Giữ & kéo chuột để xoay bàn cờ Vây 3D
      </div>

      {/* Camera Controls (Zoom, Reset) */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          gap: '6px',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => handleZoom(-1.5)}
          title="Phóng to"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#FFF',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
          }}
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => handleZoom(1.5)}
          title="Thu nhỏ"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#FFF',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
          }}
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={handleResetCamera}
          title="Đặt lại góc nhìn"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.85)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#FFF',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};
