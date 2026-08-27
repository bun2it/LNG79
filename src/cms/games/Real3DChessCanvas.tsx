import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Chess } from 'chess.js';
import type { Square, PieceSymbol } from 'chess.js';
import { gameAudio } from './gameAudio';
import type { ChessThemeKey } from './ChessBoardView';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface Real3DChessCanvasProps {
  fen: string;
  myColor: 'white' | 'black' | 'spectator';
  isMyTurn: boolean;
  onMove: (from: string, to: string, promotion?: string) => void;
  lastMove?: { from: string; to: string } | null;
  disabled?: boolean;
  themeKey?: ChessThemeKey;
}

// Procedural 3D Mesh Generator for Staunton Chess Pieces
function createPieceMesh(type: PieceSymbol, isWhite: boolean): THREE.Group {
  const group = new THREE.Group();

  const pieceColor = isWhite ? 0xf5f5f0 : 0x222225;
  const pieceRoughness = isWhite ? 0.25 : 0.35;
  const pieceMetalness = isWhite ? 0.05 : 0.15;

  const mat = new THREE.MeshStandardMaterial({
    color: pieceColor,
    roughness: pieceRoughness,
    metalness: pieceMetalness,
  });

  const baseRadius = 0.34;
  const baseGeom = new THREE.CylinderGeometry(baseRadius * 0.85, baseRadius, 0.12, 24);
  const baseMesh = new THREE.Mesh(baseGeom, mat);
  baseMesh.position.y = 0.06;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  const torusGeom = new THREE.TorusGeometry(baseRadius * 0.75, 0.04, 12, 24);
  torusGeom.rotateX(Math.PI / 2);
  const torusMesh = new THREE.Mesh(torusGeom, mat);
  torusMesh.position.y = 0.12;
  torusMesh.castShadow = true;
  group.add(torusMesh);

  if (type === 'p') {
    // Pawn
    const bodyGeom = new THREE.CylinderGeometry(0.14, baseRadius * 0.65, 0.45, 20);
    const body = new THREE.Mesh(bodyGeom, mat);
    body.position.y = 0.34;
    body.castShadow = true;
    group.add(body);

    const headGeom = new THREE.SphereGeometry(0.18, 20, 20);
    const head = new THREE.Mesh(headGeom, mat);
    head.position.y = 0.65;
    head.castShadow = true;
    group.add(head);
  } else if (type === 'r') {
    // Rook (Castle)
    const bodyGeom = new THREE.CylinderGeometry(0.24, baseRadius * 0.7, 0.55, 24);
    const body = new THREE.Mesh(bodyGeom, mat);
    body.position.y = 0.38;
    body.castShadow = true;
    group.add(body);

    const topGeom = new THREE.CylinderGeometry(0.28, 0.24, 0.2, 24);
    const top = new THREE.Mesh(topGeom, mat);
    top.position.y = 0.72;
    top.castShadow = true;
    group.add(top);

    // Castle notches
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const notchGeom = new THREE.BoxGeometry(0.08, 0.1, 0.08);
      const notch = new THREE.Mesh(notchGeom, mat);
      notch.position.set(Math.cos(angle) * 0.2, 0.85, Math.sin(angle) * 0.2);
      notch.castShadow = true;
      group.add(notch);
    }
  } else if (type === 'n') {
    // Knight (Horse)
    const bodyGeom = new THREE.CylinderGeometry(0.22, baseRadius * 0.7, 0.35, 20);
    const body = new THREE.Mesh(bodyGeom, mat);
    body.position.y = 0.28;
    body.castShadow = true;
    group.add(body);

    // Horse head block
    const headGeom = new THREE.BoxGeometry(0.22, 0.45, 0.32);
    const head = new THREE.Mesh(headGeom, mat);
    head.position.set(0, 0.58, 0.04);
    head.rotation.x = 0.2;
    head.castShadow = true;
    group.add(head);

    // Snout
    const snoutGeom = new THREE.CylinderGeometry(0.08, 0.12, 0.22, 12);
    snoutGeom.rotateX(Math.PI / 3);
    const snout = new THREE.Mesh(snoutGeom, mat);
    snout.position.set(0, 0.58, 0.2);
    snout.castShadow = true;
    group.add(snout);

    // Ears
    for (const side of [-0.08, 0.08]) {
      const earGeom = new THREE.ConeGeometry(0.05, 0.12, 8);
      const ear = new THREE.Mesh(earGeom, mat);
      ear.position.set(side, 0.84, -0.05);
      ear.castShadow = true;
      group.add(ear);
    }
  } else if (type === 'b') {
    // Bishop
    const bodyGeom = new THREE.CylinderGeometry(0.18, baseRadius * 0.65, 0.6, 20);
    const body = new THREE.Mesh(bodyGeom, mat);
    body.position.y = 0.42;
    body.castShadow = true;
    group.add(body);

    const miterGeom = new THREE.SphereGeometry(0.2, 20, 20);
    miterGeom.scale(0.85, 1.3, 0.85);
    const miter = new THREE.Mesh(miterGeom, mat);
    miter.position.y = 0.82;
    miter.castShadow = true;
    group.add(miter);

    const tipGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const tip = new THREE.Mesh(tipGeom, mat);
    tip.position.y = 1.05;
    tip.castShadow = true;
    group.add(tip);
  } else if (type === 'q') {
    // Queen
    const bodyGeom = new THREE.CylinderGeometry(0.2, baseRadius * 0.7, 0.72, 24);
    const body = new THREE.Mesh(bodyGeom, mat);
    body.position.y = 0.48;
    body.castShadow = true;
    group.add(body);

    const coronetGeom = new THREE.CylinderGeometry(0.3, 0.18, 0.22, 24);
    const coronet = new THREE.Mesh(coronetGeom, mat);
    coronet.position.y = 0.92;
    coronet.castShadow = true;
    group.add(coronet);

    const tipGeom = new THREE.SphereGeometry(0.09, 16, 16);
    const tip = new THREE.Mesh(tipGeom, mat);
    tip.position.y = 1.1;
    tip.castShadow = true;
    group.add(tip);
  } else if (type === 'k') {
    // King
    const bodyGeom = new THREE.CylinderGeometry(0.22, baseRadius * 0.75, 0.78, 24);
    const body = new THREE.Mesh(bodyGeom, mat);
    body.position.y = 0.52;
    body.castShadow = true;
    group.add(body);

    const crownGeom = new THREE.CylinderGeometry(0.32, 0.2, 0.25, 24);
    const crown = new THREE.Mesh(crownGeom, mat);
    crown.position.y = 0.98;
    crown.castShadow = true;
    group.add(crown);

    // Cross
    const crossVGeom = new THREE.BoxGeometry(0.06, 0.22, 0.06);
    const crossV = new THREE.Mesh(crossVGeom, mat);
    crossV.position.y = 1.2;
    crossV.castShadow = true;
    group.add(crossV);

    const crossHGeom = new THREE.BoxGeometry(0.18, 0.06, 0.06);
    const crossH = new THREE.Mesh(crossHGeom, mat);
    crossH.position.y = 1.23;
    crossH.castShadow = true;
    group.add(crossH);
  }

  // Face black pieces towards white side
  if (!isWhite) {
    group.rotation.y = Math.PI;
  }

  return group;
}

export const Real3DChessCanvas: React.FC<Real3DChessCanvasProps> = ({
  fen,
  myColor,
  isMyTurn,
  onMove,
  lastMove,
  disabled = false,
  themeKey = 'emerald',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const validMoves = useMemo(() => {
    if (!selectedSquare || disabled || !isMyTurn) return [];
    try {
      return chess.moves({ square: selectedSquare, verbose: true });
    } catch {
      return [];
    }
  }, [chess, selectedSquare, disabled, isMyTurn]);

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const piecesGroupRef = useRef<THREE.Group | null>(null);
  const highlightsGroupRef = useRef<THREE.Group | null>(null);
  const squareMeshesRef = useRef<Map<Square, THREE.Mesh>>(new Map());

  // Camera Orbit State
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraOrbitRef = useRef({
    radius: 9.0,
    theta: myColor === 'black' ? Math.PI : 0, // azimuthal angle
    phi: 1.0, // polar elevation angle (radians from vertical)
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
      radius: 9.0,
      theta: myColor === 'black' ? Math.PI : 0,
      phi: 1.0,
    };
    updateCameraPosition();
  };

  const handleZoom = (delta: number) => {
    cameraOrbitRef.current.radius = Math.max(5.5, Math.min(16, cameraOrbitRef.current.radius + delta));
    updateCameraPosition();
  };

  // Convert board coordinate (file: 0..7, rank: 0..7) to 3D world space (X, Z)
  const squareToWorld = (fileIdx: number, rankIdx: number) => {
    // Center of 8x8 board of unit size 1.0 per square
    const x = fileIdx - 3.5;
    const z = 3.5 - rankIdx;
    return { x, z };
  };

  // Square string (e.g. 'e4') to 3D world
  const squareStringToWorld = (sq: Square) => {
    const fileIdx = sq.charCodeAt(0) - 'a'.charCodeAt(0);
    const rankIdx = parseInt(sq[1], 10) - 1;
    return squareToWorld(fileIdx, rankIdx);
  };

  // Initial Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5e6, 1.4);
    dirLight1.position.set(6, 12, 8);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 30;
    dirLight1.shadow.camera.left = -6;
    dirLight1.shadow.camera.right = 6;
    dirLight1.shadow.camera.top = 6;
    dirLight1.shadow.camera.bottom = -6;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x90b0ff, 0.6);
    dirLight2.position.set(-6, 8, -8);
    scene.add(dirLight2);

    // 5. Board Base Slab (Thick wooden table base)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x3d2714,
      roughness: 0.35,
      metalness: 0.1,
    });
    const boardBase = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.6, 9.4), baseMat);
    boardBase.position.y = -0.3;
    boardBase.receiveShadow = true;
    boardBase.castShadow = true;
    scene.add(boardBase);

    // Rim Bevel
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x22140a, roughness: 0.5 });
    const rim = new THREE.Mesh(new THREE.BoxGeometry(9.7, 0.3, 9.7), rimMat);
    rim.position.y = -0.45;
    rim.receiveShadow = true;
    scene.add(rim);

    // 6. Checkered Board Squares
    const squareMeshes = new Map<Square, THREE.Mesh>();
    const squareGroup = new THREE.Group();

    const lightColor = themeKey === 'wood' ? 0xf0d9b5 : themeKey === 'ocean' ? 0xe0e7ec : 0xeeeed2;
    const darkColor = themeKey === 'wood' ? 0xb58863 : themeKey === 'ocean' ? 0x6e8b9e : 0x769656;

    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const file = String.fromCharCode('a'.charCodeAt(0) + f);
        const rank = (r + 1).toString();
        const sq = `${file}${rank}` as Square;
        const isLight = (f + r) % 2 === 1;

        const sqMat = new THREE.MeshStandardMaterial({
          color: isLight ? lightColor : darkColor,
          roughness: 0.3,
          metalness: 0.05,
        });

        const sqGeom = new THREE.BoxGeometry(0.99, 0.04, 0.99);
        const sqMesh = new THREE.Mesh(sqGeom, sqMat);
        const { x, z } = squareToWorld(f, r);
        sqMesh.position.set(x, 0.02, z);
        sqMesh.receiveShadow = true;
        sqMesh.userData = { square: sq };

        squareMeshes.set(sq, sqMesh);
        squareGroup.add(sqMesh);
      }
    }
    scene.add(squareGroup);
    squareMeshesRef.current = squareMeshes;

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

    // Initial resize trigger
    setTimeout(handleResize, 50);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Pieces in 3D based on FEN
  useEffect(() => {
    const piecesGroup = piecesGroupRef.current;
    if (!piecesGroup) return;

    // Clear old pieces
    while (piecesGroup.children.length > 0) {
      piecesGroup.remove(piecesGroup.children[0]);
    }

    // Spawn new 3D piece meshes
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const file = String.fromCharCode('a'.charCodeAt(0) + f);
        const rank = (r + 1).toString();
        const sq = `${file}${rank}` as Square;
        const piece = chess.get(sq);

        if (piece) {
          const isWhite = piece.color === 'w';
          const mesh = createPieceMesh(piece.type, isWhite);
          const { x, z } = squareToWorld(f, r);

          const isSelected = selectedSquare === sq;
          mesh.position.set(x, isSelected ? 0.35 : 0.04, z);
          mesh.userData = { square: sq, piece };

          piecesGroup.add(mesh);
        }
      }
    }
  }, [fen, selectedSquare, chess]);

  // Update Move Highlights & In-Check Glow in 3D
  useEffect(() => {
    const hlGroup = highlightsGroupRef.current;
    if (!hlGroup) return;

    while (hlGroup.children.length > 0) {
      hlGroup.remove(hlGroup.children[0]);
    }

    // 1. Highlight Last Move (Amber glow disc)
    if (lastMove) {
      for (const sq of [lastMove.from as Square, lastMove.to as Square]) {
        const { x, z } = squareStringToWorld(sq);
        const geom = new THREE.PlaneGeometry(0.96, 0.96);
        geom.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.45,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, 0.045, z);
        hlGroup.add(mesh);
      }
    }

    // 2. Selected Square Highlight (Cyan ring)
    if (selectedSquare) {
      const { x, z } = squareStringToWorld(selectedSquare);
      const ringGeom = new THREE.RingGeometry(0.35, 0.45, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00df89,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.set(x, 0.05, z);
      hlGroup.add(ring);
    }

    // 3. Valid Destination Dots (Emerald Disc / Red Capture Ring)
    for (const move of validMoves) {
      const { x, z } = squareStringToWorld(move.to as Square);
      const isCapture = Boolean(move.captured);

      if (isCapture) {
        const ringGeom = new THREE.RingGeometry(0.32, 0.44, 32);
        ringGeom.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(ringGeom, mat);
        mesh.position.set(x, 0.05, z);
        hlGroup.add(mesh);
      } else {
        const dotGeom = new THREE.CircleGeometry(0.16, 24);
        dotGeom.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.85 });
        const mesh = new THREE.Mesh(dotGeom, mat);
        mesh.position.set(x, 0.05, z);
        hlGroup.add(mesh);
      }
    }
  }, [validMoves, selectedSquare, lastMove]);

  // Mouse Orbit Dragging & Raycast Selection
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
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Check hit on squares or pieces
    const squareMeshes = Array.from(squareMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(squareMeshes, false);

    if (intersects.length > 0) {
      const hitSquare = intersects[0].object.userData.square as Square;
      if (!hitSquare) return;

      const piece = chess.get(hitSquare);
      const myPieceColor = myColor === 'white' ? 'w' : 'b';

      // Clicking own piece
      if (piece && piece.color === myPieceColor) {
        setSelectedSquare(hitSquare);
        return;
      }

      // If a piece was selected and clicking destination
      if (selectedSquare) {
        const move = validMoves.find((m) => m.to === hitSquare);
        if (move) {
          const selectedPiece = chess.get(selectedSquare);
          if (
            selectedPiece?.type === 'p' &&
            ((selectedPiece.color === 'w' && hitSquare[1] === '8') ||
              (selectedPiece.color === 'b' && hitSquare[1] === '1'))
          ) {
            setPendingPromotion({ from: selectedSquare, to: hitSquare });
            return;
          }

          if (move.captured) {
            gameAudio.playCaptureSound();
          } else {
            gameAudio.playMoveSound();
          }

          onMove(selectedSquare, hitSquare);
          setSelectedSquare(null);
        } else {
          setSelectedSquare(null);
        }
      }
    }
  };

  const handleSelectPromotion = (pieceType: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    gameAudio.playCaptureSound();
    onMove(pendingPromotion.from, pendingPromotion.to, pieceType);
    setPendingPromotion(null);
    setSelectedSquare(null);
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

      {/* Floating 3D Camera Controls */}
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

      {/* Hint instructions */}
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
        💡 Giữ & kéo chuột để xoay bàn cờ 3D
      </div>

      {/* 3D Promotion Dialog */}
      {pendingPromotion && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            zIndex: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '2px solid #098f64',
              borderRadius: '12px',
              padding: '1.25rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#F1F5F9', fontWeight: 600, marginBottom: '1rem' }}>
              Chọn quân phong cấp (Promotion)
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(['q', 'r', 'b', 'n'] as const).map((pType) => {
                const labels: Record<string, string> = { q: 'Hậu (Q)', r: 'Xe (R)', b: 'Tượng (B)', n: 'Mã (N)' };
                return (
                  <button
                    key={pType}
                    onClick={() => handleSelectPromotion(pType)}
                    style={{
                      backgroundColor: '#334155',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      color: '#FFF',
                      fontWeight: 600,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#098f64')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
                  >
                    {labels[pType]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
