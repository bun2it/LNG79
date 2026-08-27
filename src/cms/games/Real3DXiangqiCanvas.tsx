import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { XiangqiEngine } from './xiangqiEngine';
import type { XiangqiPieceType, XiangqiColor } from './xiangqiEngine';
import { gameAudio } from './gameAudio';
import type { XiangqiThemeKey } from './XiangqiBoardView';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface Real3DXiangqiCanvasProps {
  fen: string;
  myColor: 'red' | 'black' | 'spectator';
  isMyTurn: boolean;
  onMove: (from: { x: number; y: number }, to: { x: number; y: number }) => void;
  lastMove?: { from: { x: number; y: number }; to: { x: number; y: number } } | null;
  disabled?: boolean;
  themeKey?: XiangqiThemeKey;
}

// Generate Dynamic Canvas Texture for Xiangqi 3D Wooden Discs with Calligraphy
function createXiangqiPieceTexture(type: XiangqiPieceType, color: XiangqiColor): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const isRed = color === 'r';

  // Wood disc base color
  ctx.fillStyle = isRed ? '#FFF4E0' : '#2A2521';
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();

  // Carved border ring
  ctx.strokeStyle = isRed ? '#DC2626' : '#E2E8F0';
  ctx.lineWidth = 12;
  ctx.stroke();

  // Inner decorative ring
  ctx.strokeStyle = isRed ? 'rgba(220, 38, 38, 0.4)' : 'rgba(226, 232, 240, 0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(128, 128, 106, 0, Math.PI * 2);
  ctx.stroke();

  // Calligraphy Character
  const CHARS: Record<XiangqiPieceType, { r: string; b: string }> = {
    k: { r: '帥', b: '將' },
    a: { r: '仕', b: '士' },
    e: { r: '相', b: '象' },
    h: { r: '傌', b: '馬' },
    r: { r: '俥', b: '車' },
    c: { r: '炮', b: '砲' },
    p: { r: '兵', b: '卒' },
  };
  const char = CHARS[type]?.[color] || (isRed ? '兵' : '卒');

  ctx.fillStyle = isRed ? '#DC2626' : '#F8FAFC';
  ctx.font = 'bold 124px "Songti SC", "SimSun", "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 128, 134);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI / 2;
  return texture;
}

// Generate Board Grid Texture with River (楚河 漢界)
function createXiangqiBoardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1152;
  const ctx = canvas.getContext('2d')!;

  // Warm Wood Gradient Background
  const grad = ctx.createLinearGradient(0, 0, 1024, 1152);
  grad.addColorStop(0, '#E4BE8D');
  grad.addColorStop(0.5, '#D5AB75');
  grad.addColorStop(1, '#B8860B');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1152);

  // Outer border
  ctx.strokeStyle = '#4A2E0E';
  ctx.lineWidth = 14;
  ctx.strokeRect(40, 40, 944, 1072);

  // Grid offsets: 9 columns, 10 rows
  const padX = 64;
  const padY = 64;
  const stepX = (1024 - padX * 2) / 8; // 112px
  const stepY = (1152 - padY * 2) / 9; // 113.7px

  ctx.strokeStyle = '#4A2E0E';
  ctx.lineWidth = 5;

  // Horizontal lines
  for (let r = 0; r < 10; r++) {
    ctx.beginPath();
    ctx.moveTo(padX, padY + r * stepY);
    ctx.lineTo(padX + 8 * stepX, padY + r * stepY);
    ctx.stroke();
  }

  // Vertical lines (Top half)
  for (let c = 0; c < 9; c++) {
    ctx.beginPath();
    ctx.moveTo(padX + c * stepX, padY);
    ctx.lineTo(padX + c * stepX, padY + 4 * stepY);
    ctx.stroke();
  }

  // Vertical lines (Bottom half)
  for (let c = 0; c < 9; c++) {
    ctx.beginPath();
    ctx.moveTo(padX + c * stepX, padY + 5 * stepY);
    ctx.lineTo(padX + c * stepX, padY + 9 * stepY);
    ctx.stroke();
  }

  // Continuous outer vertical lines
  ctx.beginPath();
  ctx.moveTo(padX, padY + 4 * stepY);
  ctx.lineTo(padX, padY + 5 * stepY);
  ctx.moveTo(padX + 8 * stepX, padY + 4 * stepY);
  ctx.lineTo(padX + 8 * stepX, padY + 5 * stepY);
  ctx.stroke();

  // Palace Crosses (Top & Bottom)
  // Top Palace (c=3..5, r=0..2)
  ctx.beginPath();
  ctx.moveTo(padX + 3 * stepX, padY);
  ctx.lineTo(padX + 5 * stepX, padY + 2 * stepY);
  ctx.moveTo(padX + 5 * stepX, padY);
  ctx.lineTo(padX + 3 * stepX, padY + 2 * stepY);
  ctx.stroke();

  // Bottom Palace (c=3..5, r=7..9)
  ctx.beginPath();
  ctx.moveTo(padX + 3 * stepX, padY + 7 * stepY);
  ctx.lineTo(padX + 5 * stepX, padY + 9 * stepY);
  ctx.moveTo(padX + 5 * stepX, padY + 7 * stepY);
  ctx.lineTo(padX + 3 * stepX, padY + 9 * stepY);
  ctx.stroke();

  // River Text
  ctx.fillStyle = '#4A2E0E';
  ctx.font = 'bold 54px "Songti SC", "SimSun", "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('楚 河 (Sở Hà)', padX + 2 * stepX, padY + 4.5 * stepY);
  ctx.fillText('漢 界 (Hán Giới)', padX + 6 * stepX, padY + 4.5 * stepY);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export const Real3DXiangqiCanvas: React.FC<Real3DXiangqiCanvasProps> = ({
  fen,
  myColor,
  isMyTurn,
  onMove,
  lastMove,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPos, setSelectedPos] = useState<{ x: number; y: number } | null>(null);

  const engine = useMemo(() => new XiangqiEngine(fen), [fen]);

  const legalMoves = useMemo(() => {
    if (!selectedPos || disabled || !isMyTurn) return [];
    return engine.getLegalMoves(selectedPos.x, selectedPos.y);
  }, [engine, selectedPos, disabled, isMyTurn]);

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const piecesGroupRef = useRef<THREE.Group | null>(null);
  const highlightsGroupRef = useRef<THREE.Group | null>(null);
  const boardIntersectionsRef = useRef<THREE.Mesh[]>([]);

  // Camera Orbit State (radius: 10.2 to maximize board height in viewport)
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraOrbitRef = useRef({
    radius: 10.2,
    theta: myColor === 'black' ? Math.PI : 0,
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
      theta: myColor === 'black' ? Math.PI : 0,
      phi: 1.02,
    };
    updateCameraPosition();
  };

  const handleZoom = (delta: number) => {
    cameraOrbitRef.current.radius = Math.max(6.5, Math.min(18, cameraOrbitRef.current.radius + delta));
    updateCameraPosition();
  };

  // Convert board (x: 0..8, y: 0..9) to 3D world space (X, Z)
  const posToWorld = (x: number, y: number) => {
    const stepX = 1.05;
    const stepY = 1.05;
    const worldX = (x - 4) * stepX;
    const worldZ = (y - 4.5) * stepY;
    return { x: worldX, z: worldZ };
  };

  // Initial Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    cameraOrbitRef.current.theta = myColor === 'black' ? Math.PI : 0;
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

    const dirLight1 = new THREE.DirectionalLight(0xfff3e0, 1.4);
    dirLight1.position.set(8, 14, 8);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 35;
    dirLight1.shadow.camera.left = -7;
    dirLight1.shadow.camera.right = 7;
    dirLight1.shadow.camera.top = 7;
    dirLight1.shadow.camera.bottom = -7;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x80b0ff, 0.5);
    dirLight2.position.set(-8, 8, -8);
    scene.add(dirLight2);

    // 5. Board Base Slab (Thick wooden board)
    const boardTexture = createXiangqiBoardTexture();
    const boardMat = new THREE.MeshStandardMaterial({
      map: boardTexture,
      roughness: 0.35,
      metalness: 0.05,
    });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.5 });
    const materials = [sideMat, sideMat, boardMat, sideMat, sideMat, sideMat];

    const boardWidth = 9.8;
    const boardLength = 10.8;
    const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(boardWidth, 0.5, boardLength), materials);
    boardMesh.position.y = -0.25;
    boardMesh.receiveShadow = true;
    boardMesh.castShadow = true;
    scene.add(boardMesh);

    // 6. Clickable Invisible Intersection Meshes for Raycasting
    const intersectionMeshes: THREE.Mesh[] = [];
    const interGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16);
    const interMat = new THREE.MeshBasicMaterial({ visible: false });

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const mesh = new THREE.Mesh(interGeom, interMat);
        const { x: wx, z: wz } = posToWorld(x, y);
        mesh.position.set(wx, 0.05, wz);
        mesh.userData = { gridX: x, gridY: y };
        scene.add(mesh);
        intersectionMeshes.push(mesh);
      }
    }
    boardIntersectionsRef.current = intersectionMeshes;

    // 7. Pieces Group & Highlights Group
    const piecesGroup = new THREE.Group();
    scene.add(piecesGroup);
    piecesGroupRef.current = piecesGroup;

    const highlightsGroup = new THREE.Group();
    scene.add(highlightsGroup);
    highlightsGroupRef.current = highlightsGroup;

    // 8. Animation Loop
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
  }, []);

  // Update 3D Xiangqi Pieces based on FEN
  useEffect(() => {
    const piecesGroup = piecesGroupRef.current;
    if (!piecesGroup) return;

    while (piecesGroup.children.length > 0) {
      piecesGroup.remove(piecesGroup.children[0]);
    }

    const radius = 0.42;
    const height = 0.16;
    const discGeom = new THREE.CylinderGeometry(radius, radius * 0.96, height, 32);

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = engine.getPiece(x, y);
        if (piece) {
          const isRed = piece.color === 'r';
          const texture = createXiangqiPieceTexture(piece.type, piece.color);

          const topMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.25,
            metalness: 0.05,
          });
          const sideMat = new THREE.MeshStandardMaterial({
            color: isRed ? 0xdc2626 : 0x222222,
            roughness: 0.35,
          });
          const bottomMat = new THREE.MeshStandardMaterial({
            color: isRed ? 0xfff4e0 : 0x2a2521,
            roughness: 0.4,
          });

          const discMaterials = [sideMat, topMat, bottomMat];
          const mesh = new THREE.Mesh(discGeom, discMaterials);

          const { x: wx, z: wz } = posToWorld(x, y);
          const isSelected = selectedPos?.x === x && selectedPos?.y === y;

          mesh.position.set(wx, isSelected ? 0.45 : height / 2, wz);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { gridX: x, gridY: y, piece };

          piecesGroup.add(mesh);
        }
      }
    }
  }, [fen, selectedPos, engine]);

  // Update Move Highlights in 3D
  useEffect(() => {
    const hlGroup = highlightsGroupRef.current;
    if (!hlGroup) return;

    while (hlGroup.children.length > 0) {
      hlGroup.remove(hlGroup.children[0]);
    }

    // 1. Last Move Ring
    if (lastMove) {
      for (const pos of [lastMove.from, lastMove.to]) {
        const { x, z } = posToWorld(pos.x, pos.y);
        const ringGeom = new THREE.RingGeometry(0.38, 0.48, 32);
        ringGeom.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(ringGeom, mat);
        mesh.position.set(x, 0.015, z);
        hlGroup.add(mesh);
      }
    }

    // 2. Selected Position (Cyan Ring)
    if (selectedPos) {
      const { x, z } = posToWorld(selectedPos.x, selectedPos.y);
      const ringGeom = new THREE.RingGeometry(0.42, 0.52, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({ color: 0x00df89, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(ringGeom, mat);
      mesh.position.set(x, 0.02, z);
      hlGroup.add(mesh);
    }

    // 3. Legal Destination Dots
    for (const move of legalMoves) {
      const { x, z } = posToWorld(move.x, move.y);
      const targetPiece = engine.getPiece(move.x, move.y);

      if (targetPiece) {
        const ringGeom = new THREE.RingGeometry(0.38, 0.5, 32);
        ringGeom.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(ringGeom, mat);
        mesh.position.set(x, 0.02, z);
        hlGroup.add(mesh);
      } else {
        const dotGeom = new THREE.CircleGeometry(0.18, 24);
        dotGeom.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.85 });
        const mesh = new THREE.Mesh(dotGeom, mat);
        mesh.position.set(x, 0.02, z);
        hlGroup.add(mesh);
      }
    }
  }, [legalMoves, selectedPos, lastMove, engine]);

  // Pointer Handling for Drag Orbit and Raycasting
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 1 || e.buttons === 2) {
      const dx = e.clientX - prevMousePosRef.current.x;
      const dy = e.clientY - prevMousePosRef.current.y;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        isDraggingRef.current = true;
        cameraOrbitRef.current.theta += dx * 0.008;
        cameraOrbitRef.current.phi = Math.max(0.2, Math.min(1.4, cameraOrbitRef.current.phi - dy * 0.008));
        updateCameraPosition();
      }

      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) return;
    if (disabled || !isMyTurn) return;

    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObjects(boardIntersectionsRef.current, false);

    if (intersects.length > 0) {
      const gridX = intersects[0].object.userData.gridX as number;
      const gridY = intersects[0].object.userData.gridY as number;

      const piece = engine.getPiece(gridX, gridY);
      const myEngineColor: XiangqiColor = myColor === 'red' ? 'r' : 'b';

      if (piece && piece.color === myEngineColor) {
        setSelectedPos({ x: gridX, y: gridY });
        return;
      }

      if (selectedPos) {
        const isLegal = legalMoves.some((m) => m.x === gridX && m.y === gridY);
        if (isLegal) {
          const targetPiece = engine.getPiece(gridX, gridY);
          if (targetPiece) {
            gameAudio.playCaptureSound();
          } else {
            gameAudio.playMoveSound();
          }
          onMove(selectedPos, { x: gridX, y: gridY });
          setSelectedPos(null);
        } else {
          setSelectedPos(null);
        }
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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

      {/* Camera Controls Toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          display: 'flex',
          gap: '6px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '4px',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => handleZoom(-1.5)}
          title="Phóng to"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#E2E8F0',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
          }}
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={() => handleZoom(1.5)}
          title="Thu nhỏ"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#E2E8F0',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
          }}
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={handleResetCamera}
          title="Đặt lại góc nhìn"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#E2E8F0',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
          }}
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          fontSize: '11px',
          color: '#94A3B8',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          padding: '4px 8px',
          borderRadius: '6px',
          pointerEvents: 'none',
        }}
      >
        💡 Giữ & kéo chuột để xoay bàn cờ tướng 3D
      </div>
    </div>
  );
};
