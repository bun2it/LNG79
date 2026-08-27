import React, { useState, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { Square, PieceSymbol, Color } from 'chess.js';
import { gameAudio } from './gameAudio';
import { Palette, Box, Layers } from 'lucide-react';
import { Real3DChessCanvas } from './Real3DChessCanvas';

interface ChessBoardViewProps {
  fen: string;
  myColor: 'white' | 'black' | 'spectator';
  isMyTurn: boolean;
  onMove: (from: string, to: string, promotion?: string) => void;
  lastMove?: { from: string; to: string } | null;
  disabled?: boolean;
}

export type ChessThemeKey = 'emerald' | 'wood' | 'ocean' | 'slate' | 'ruby';

interface ChessThemeConfig {
  name: string;
  light: string;
  dark: string;
  border: string;
  lastLight: string;
  lastDark: string;
  selectLight: string;
  selectDark: string;
  outerBg: string;
}

export const CHESS_THEMES: Record<ChessThemeKey, ChessThemeConfig> = {
  emerald: {
    name: '🌿 Ngọc Lục Bảo (Emerald)',
    light: '#EEEED2',
    dark: '#769656',
    border: '#465F2B',
    lastLight: '#F7F785',
    lastDark: '#BACA44',
    selectLight: '#B9E0A5',
    selectDark: '#5B7A38',
    outerBg: '#1B2816',
  },
  wood: {
    name: '🪵 Gỗ Hoàng Gia (Walnut)',
    light: '#F0D9B5',
    dark: '#B58863',
    border: '#5C3A21',
    lastLight: '#CED26B',
    lastDark: '#AAA23A',
    selectLight: '#E8CA9B',
    selectDark: '#936946',
    outerBg: '#2A180E',
  },
  ocean: {
    name: '🌊 Biển Sâu (Ocean)',
    light: '#E0E7EC',
    dark: '#6E8B9E',
    border: '#374E5D',
    lastLight: '#C3DCEB',
    lastDark: '#50758A',
    selectLight: '#BAD6E8',
    selectDark: '#4F7287',
    outerBg: '#13212C',
  },
  slate: {
    name: '⚡ Đá Phiến (Modern Slate)',
    light: '#E2E8F0',
    dark: '#475569',
    border: '#1E293B',
    lastLight: '#FDE68A',
    lastDark: '#D97706',
    selectLight: '#BAE6FD',
    selectDark: '#0284C7',
    outerBg: '#0F172A',
  },
  ruby: {
    name: '🍷 Hồng Ngọc (Ruby Velvet)',
    light: '#FCE7E7',
    dark: '#9F3E3E',
    border: '#601F1F',
    lastLight: '#FFE29A',
    lastDark: '#D47E3B',
    selectLight: '#F5BEBE',
    selectDark: '#782626',
    outerBg: '#280D0D',
  },
};

// Vector SVG chess piece components
const ChessPieceSVG: React.FC<{ type: PieceSymbol; color: Color; isSelected?: boolean }> = ({
  type,
  color,
  isSelected = false,
}) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#FFFFFF' : '#18181B';
  const stroke = isWhite ? '#27272A' : '#F4F4F5';

  const symbols: Record<PieceSymbol, string> = {
    p: isWhite ? '♙' : '♟',
    n: isWhite ? '♘' : '♞',
    b: isWhite ? '♗' : '♝',
    r: isWhite ? '♖' : '♜',
    q: isWhite ? '♕' : '♛',
    k: isWhite ? '♔' : '♚',
  };

  return (
    <div
      style={{
        fontSize: 'clamp(30px, 5.2vw, 46px)',
        fontWeight: 'bold',
        lineHeight: 1,
        color: fill,
        textShadow: isWhite
          ? `0 0 2px ${stroke}, 0 2px 5px rgba(0,0,0,0.4)`
          : `0 0 2px ${stroke}, 0 2px 5px rgba(0,0,0,0.7)`,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: isSelected ? 'scale(1.15)' : 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      {symbols[type]}
    </div>
  );
};

export const ChessBoardView: React.FC<ChessBoardViewProps> = ({
  fen,
  myColor,
  isMyTurn,
  onMove,
  lastMove,
  disabled = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [themeKey, setThemeKey] = useState<ChessThemeKey>(() => {
    return (localStorage.getItem('lng79_chess_theme') as ChessThemeKey) || 'wood';
  });
  const [is3D, setIs3D] = useState<boolean>(() => {
    return localStorage.getItem('lng79_chess_3d') === 'true';
  });
  const [showThemePicker, setShowThemePicker] = useState(false);

  const theme = CHESS_THEMES[themeKey] || CHESS_THEMES.wood;

  const handleSelectTheme = (key: ChessThemeKey) => {
    setThemeKey(key);
    localStorage.setItem('lng79_chess_theme', key);
    setShowThemePicker(false);
  };

  const handleToggle3D = () => {
    const nextVal = !is3D;
    setIs3D(nextVal);
    localStorage.setItem('lng79_chess_3d', nextVal ? 'true' : 'false');
  };

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

  const inCheck = chess.inCheck();
  const turnColor = chess.turn();
  const isFlipped = myColor === 'black';

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayedRanks = isFlipped ? [...ranks].reverse() : ranks;
  const displayedFiles = isFlipped ? [...files].reverse() : files;

  const handleSquareClick = (square: Square) => {
    if (disabled || !isMyTurn) return;

    const piece = chess.get(square);
    const myPieceColor = myColor === 'white' ? 'w' : 'b';

    if (piece && piece.color === myPieceColor) {
      setSelectedSquare(square);
      return;
    }

    if (selectedSquare) {
      const move = validMoves.find((m) => m.to === square);
      if (move) {
        const selectedPiece = chess.get(selectedSquare);
        if (
          selectedPiece?.type === 'p' &&
          ((selectedPiece.color === 'w' && square[1] === '8') ||
            (selectedPiece.color === 'b' && square[1] === '1'))
        ) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }

        if (move.captured) {
          gameAudio.playCaptureSound();
        } else {
          gameAudio.playMoveSound();
        }
        onMove(selectedSquare, square);
        setSelectedSquare(null);
      } else {
        setSelectedSquare(null);
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
        width: '100%',
        height: '100%',
        minHeight: '640px',
      }}
    >
      {/* Floating Control Toolbar (Theme & 3D Toggle) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 25,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '10px',
          padding: '6px 10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
      >
        {/* Theme Selector */}
        <button
          onClick={() => setShowThemePicker(!showThemePicker)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#1E293B',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#E2E8F0',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
        >
          <Palette size={13} color="#00df89" /> {theme.name}
        </button>

        {/* 3D WebGL Toggle Button */}
        <button
          onClick={handleToggle3D}
          title="Chuyển đổi giữa WebGL 3D thực tế và 2D"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: is3D ? 'rgba(9, 143, 100, 0.3)' : '#1E293B',
            border: is3D ? '1px solid #00df89' : '1px solid rgba(255,255,255,0.15)',
            color: is3D ? '#00df89' : '#E2E8F0',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
        >
          {is3D ? <Box size={14} /> : <Layers size={14} />}
          {is3D ? '💎 3D WebGL (Đang bật)' : '📐 2D Classic'}
        </button>
      </div>

      {/* Floating Center Turn Indicator */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 25,
          backgroundColor: isMyTurn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
          border: isMyTurn ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          borderRadius: '9999px',
          padding: '6px 16px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: isMyTurn ? '#34D399' : '#CBD5E1',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isMyTurn ? '#10B981' : '#94A3B8', animation: isMyTurn ? 'pulse 1.5s infinite' : 'none' }} />
        {isMyTurn ? 'Lượt của bạn đi cờ' : 'Đang chờ đối thủ…'}
      </div>

      {/* Theme Picker Dropdown */}
      {showThemePicker && (
        <div
          style={{
            position: 'absolute',
            top: '64px',
            left: '16px',
            backgroundColor: '#0F172A',
            border: '1px solid #098f64',
            borderRadius: '10px',
            padding: '0.6rem',
            zIndex: 35,
            boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {(Object.keys(CHESS_THEMES) as ChessThemeKey[]).map((tKey) => {
            const t = CHESS_THEMES[tKey];
            const isCur = tKey === themeKey;
            return (
              <button
                key={tKey}
                onClick={() => handleSelectTheme(tKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: isCur ? 'rgba(9, 143, 100, 0.25)' : 'transparent',
                  color: isCur ? '#34D399' : '#F1F5F9',
                  border: isCur ? '1px solid #098f64' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'inline-flex', width: '18px', height: '18px', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ width: '50%', height: '100%', backgroundColor: t.light }} />
                  <span style={{ width: '50%', height: '100%', backgroundColor: t.dark }} />
                </span>
                {t.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Board View: 3D WebGL Canvas or 2D Vector Board */}
      {is3D ? (
        <Real3DChessCanvas
          fen={fen}
          myColor={myColor}
          isMyTurn={isMyTurn}
          onMove={onMove}
          lastMove={lastMove}
          disabled={disabled}
          themeKey={themeKey}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '2rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, minmax(44px, 80px))',
              gridTemplateRows: 'repeat(8, minmax(44px, 80px))',
              border: `6px solid ${theme.border}`,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7), inset 0 0 12px rgba(0,0,0,0.3)',
              backgroundColor: theme.outerBg,
              transition: 'all 0.25s ease',
            }}
          >
          {displayedRanks.map((rank, rankIdx) =>
            displayedFiles.map((file, fileIdx) => {
              const square = `${file}${rank}` as Square;
              const piece = chess.get(square);
              const isLight = (rankIdx + fileIdx) % 2 === 0;

              const isSelected = selectedSquare === square;
              const isValidDestination = validMoves.some((m) => m.to === square);
              const isLastMoveFrom = lastMove?.from === square;
              const isLastMoveTo = lastMove?.to === square;
              const isKingInCheck = inCheck && piece?.type === 'k' && piece?.color === turnColor;

              let bg = isLight ? theme.light : theme.dark;
              if (isLastMoveFrom || isLastMoveTo) {
                bg = isLight ? theme.lastLight : theme.lastDark;
              }
              if (isSelected) {
                bg = isLight ? theme.selectLight : theme.selectDark;
              }

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    backgroundColor: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: isMyTurn && !disabled ? 'pointer' : 'default',
                    boxShadow: isKingInCheck ? 'inset 0 0 16px 4px #EF4444' : undefined,
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {fileIdx === 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: '3px',
                        fontSize: '10px',
                        fontWeight: 700,
                        opacity: 0.55,
                        color: isLight ? theme.dark : theme.light,
                      }}
                    >
                      {rank}
                    </span>
                  )}
                  {rankIdx === 7 && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '3px',
                        fontSize: '10px',
                        fontWeight: 700,
                        opacity: 0.55,
                        color: isLight ? theme.dark : theme.light,
                      }}
                    >
                      {file}
                    </span>
                  )}

                  {isValidDestination && (
                    <div
                      style={{
                        position: 'absolute',
                        width: piece ? '80%' : '28%',
                        height: piece ? '80%' : '28%',
                        borderRadius: '50%',
                        backgroundColor: piece ? 'transparent' : 'rgba(16, 185, 129, 0.75)',
                        border: piece ? '3.5px solid rgba(239, 68, 68, 0.85)' : 'none',
                        zIndex: 2,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {piece && (
                    <div style={{ zIndex: 3 }}>
                      <ChessPieceSVG type={piece.type} color={piece.color} isSelected={isSelected} />
                    </div>
                  )}
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {/* Promotion Choice Dialog for 2D mode */}
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
            zIndex: 10,
          }}
        >
          <div
            style={{
              backgroundColor: '#1E293B',
              border: '2px solid #098f64',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
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
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: '#334155',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '0.75rem 0.5rem',
                      cursor: 'pointer',
                      color: '#FFF',
                      minWidth: '60px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#098f64')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
                  >
                    <ChessPieceSVG type={pType} color={myColor === 'black' ? 'b' : 'w'} />
                    <span style={{ fontSize: '11px', marginTop: '4px' }}>{labels[pType]}</span>
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
