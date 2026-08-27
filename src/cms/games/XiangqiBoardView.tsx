import React, { useState, useMemo } from 'react';
import { XiangqiEngine } from './xiangqiEngine';
import type { XiangqiPiece, XiangqiPieceType, XiangqiColor } from './xiangqiEngine';
import { gameAudio } from './gameAudio';

interface XiangqiBoardViewProps {
  fen: string;
  myColor: 'red' | 'black' | 'spectator';
  isMyTurn: boolean;
  onMove: (from: { x: number; y: number }, to: { x: number; y: number }) => void;
  lastMove?: { from: { x: number; y: number }; to: { x: number; y: number } } | null;
  disabled?: boolean;
}

// Traditional Wood Carved Piece Disc Component
const XiangqiPieceDisc: React.FC<{ piece: XiangqiPiece }> = ({ piece }) => {
  const isRed = piece.color === 'r';

  const CHARS: Record<XiangqiPieceType, { r: string; b: string }> = {
    k: { r: '帥', b: '將' },
    a: { r: '仕', b: '士' },
    e: { r: '相', b: '象' },
    h: { r: '傌', b: '馬' },
    r: { r: '俥', b: '車' },
    c: { r: '炮', b: '砲' },
    p: { r: '兵', b: '卒' },
  };

  const char = CHARS[piece.type][piece.color];

  return (
    <div
      style={{
        width: 'clamp(32px, 4.2vw, 50px)',
        height: 'clamp(32px, 4.2vw, 50px)',
        borderRadius: '50%',
        backgroundColor: isRed ? '#FFF1D6' : '#2A2521',
        border: `3px solid ${isRed ? '#DC2626' : '#E2E8F0'}`,
        boxShadow: '0 4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isRed ? '#DC2626' : '#F1F5F9',
        fontSize: 'clamp(18px, 2.6vw, 26px)',
        fontWeight: 'bold',
        fontFamily: '"Songti SC", "SimSun", "Noto Serif SC", "STSong", serif',
        userSelect: 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      {char}
    </div>
  );
};

export const XiangqiBoardView: React.FC<XiangqiBoardViewProps> = ({
  fen,
  myColor,
  isMyTurn,
  onMove,
  lastMove,
  disabled = false,
}) => {
  const [selectedPos, setSelectedPos] = useState<{ x: number; y: number } | null>(null);

  // Engine instance
  const engine = useMemo(() => new XiangqiEngine(fen), [fen]);

  // Valid destinations for selected piece
  const legalMoves = useMemo(() => {
    if (!selectedPos || disabled || !isMyTurn) return [];
    return engine.getLegalMoves(selectedPos.x, selectedPos.y);
  }, [engine, selectedPos, disabled, isMyTurn]);

  const isFlipped = myColor === 'black';

  // Check state
  const isRedInCheck = engine.isCheck('r');
  const isBlackInCheck = engine.isCheck('b');

  const rows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const cols = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  const displayedRows = isFlipped ? [...rows].reverse() : rows;
  const displayedCols = isFlipped ? [...cols].reverse() : cols;

  const handleIntersectionClick = (x: number, y: number) => {
    if (disabled || !isMyTurn) return;

    const piece = engine.getPiece(x, y);
    const myEngineColor: XiangqiColor = myColor === 'red' ? 'r' : 'b';

    // Selecting own piece
    if (piece && piece.color === myEngineColor) {
      setSelectedPos({ x, y });
      return;
    }

    // Moving piece
    if (selectedPos) {
      const isLegal = legalMoves.some((m) => m.x === x && m.y === y);
      if (isLegal) {
        const targetPiece = engine.getPiece(x, y);
        if (targetPiece) {
          gameAudio.playCaptureSound();
        } else {
          gameAudio.playMoveSound();
        }
        onMove(selectedPos, { x, y });
        setSelectedPos(null);
      } else {
        setSelectedPos(null);
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Wooden Board Container */}
      <div
        style={{
          position: 'relative',
          padding: '24px 18px',
          background: 'linear-gradient(135deg, #DEB887 0%, #C89D66 50%, #B8860B 100%)',
          borderRadius: '12px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.6), inset 0 0 15px rgba(0,0,0,0.3)',
          border: '4px solid #5C3A14',
        }}
      >
        {/* SVG Board Grid lines (9 columns x 10 rows) */}
        <svg
          viewBox="0 0 400 450"
          style={{
            position: 'absolute',
            top: '24px',
            left: '18px',
            right: '18px',
            bottom: '24px',
            width: 'calc(100% - 36px)',
            height: 'calc(100% - 48px)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {/* Border line */}
          <rect x="0" y="0" width="400" height="450" fill="none" stroke="#5C3A14" strokeWidth="2.5" />

          {/* Horizontal lines */}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="#5C3A14" strokeWidth="1.2" />
          ))}

          {/* Vertical lines (Top half) */}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`vt-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="200" stroke="#5C3A14" strokeWidth="1.2" />
          ))}

          {/* Vertical lines (Bottom half) */}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`vb-${i}`} x1={i * 50} y1="250" x2={i * 50} y2="450" stroke="#5C3A14" strokeWidth="1.2" />
          ))}

          {/* Border vertical continuous lines */}
          <line x1="0" y1="200" x2="0" y2="250" stroke="#5C3A14" strokeWidth="2.5" />
          <line x1="400" y1="200" x2="400" y2="250" stroke="#5C3A14" strokeWidth="2.5" />

          {/* Palace Diagonal Crosses (Top & Bottom) */}
          <line x1="150" y1="0" x2="250" y2="100" stroke="#5C3A14" strokeWidth="1.2" />
          <line x1="250" y1="0" x2="150" y2="100" stroke="#5C3A14" strokeWidth="1.2" />

          <line x1="150" y1="350" x2="250" y2="450" stroke="#5C3A14" strokeWidth="1.2" />
          <line x1="250" y1="350" x2="150" y2="450" stroke="#5C3A14" strokeWidth="1.2" />

          {/* River Text */}
          <text x="100" y="232" textAnchor="middle" fill="#5C3A14" fontSize="18" fontWeight="bold" fontFamily="serif">
            楚 河 (Sở Hà)
          </text>
          <text x="300" y="232" textAnchor="middle" fill="#5C3A14" fontSize="18" fontWeight="bold" fontFamily="serif">
            漢 界 (Hán Giới)
          </text>
        </svg>

        {/* Clickable Intersections (9 cols x 10 rows) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'grid',
            gridTemplateColumns: 'repeat(9, minmax(36px, 54px))',
            gridTemplateRows: 'repeat(10, minmax(36px, 54px))',
          }}
        >
          {displayedRows.map((y) =>
            displayedCols.map((x) => {
              const piece = engine.getPiece(x, y);
              const isSelected = selectedPos?.x === x && selectedPos?.y === y;
              const isLegalDest = legalMoves.some((m) => m.x === x && m.y === y);
              const isLastMoveFrom = lastMove?.from.x === x && lastMove?.from.y === y;
              const isLastMoveTo = lastMove?.to.x === x && lastMove?.to.y === y;

              const isKingInCheck =
                piece?.type === 'k' &&
                ((piece.color === 'r' && isRedInCheck) || (piece.color === 'b' && isBlackInCheck));

              return (
                <div
                  key={`cell-${x}-${y}`}
                  onClick={() => handleIntersectionClick(x, y)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: isMyTurn && !disabled ? 'pointer' : 'default',
                  }}
                >
                  {/* Last move highlight ring */}
                  {(isLastMoveFrom || isLastMoveTo) && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: '2px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(234, 179, 8, 0.4)',
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* Selected piece highlight */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: '0',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(56, 189, 248, 0.5)',
                        border: '2px solid #0284C7',
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* In-check glow on General */}
                  {isKingInCheck && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: '-3px',
                        borderRadius: '50%',
                        boxShadow: '0 0 16px 4px #EF4444',
                        zIndex: 1,
                        animation: 'pulse 1.2s infinite',
                      }}
                    />
                  )}

                  {/* Destination indicator dot or capture ring */}
                  {isLegalDest && (
                    <div
                      style={{
                        position: 'absolute',
                        width: piece ? '85%' : '30%',
                        height: piece ? '85%' : '30%',
                        borderRadius: '50%',
                        backgroundColor: piece ? 'transparent' : 'rgba(16, 185, 129, 0.75)',
                        border: piece ? '3px solid rgba(239, 68, 68, 0.9)' : 'none',
                        zIndex: 3,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* Piece */}
                  {piece && (
                    <div
                      style={{
                        zIndex: 2,
                        transform: isSelected ? 'scale(1.15)' : 'none',
                      }}
                    >
                      <XiangqiPieceDisc piece={piece} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
