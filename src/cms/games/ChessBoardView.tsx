import React, { useState, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { Square, PieceSymbol, Color } from 'chess.js';
import { gameAudio } from './gameAudio';

interface ChessBoardViewProps {
  fen: string;
  myColor: 'white' | 'black' | 'spectator';
  isMyTurn: boolean;
  onMove: (from: string, to: string, promotion?: string) => void;
  lastMove?: { from: string; to: string } | null;
  disabled?: boolean;
}

// Vector SVG chess piece components
const ChessPieceSVG: React.FC<{ type: PieceSymbol; color: Color }> = ({ type, color }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#FFFFFF' : '#1A1A1A';
  const stroke = isWhite ? '#222222' : '#EDEDED';

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
        fontSize: 'clamp(28px, 5vw, 44px)',
        fontWeight: 'bold',
        lineHeight: 1,
        color: fill,
        textShadow: isWhite
          ? `0 0 2px ${stroke}, 0 2px 4px rgba(0,0,0,0.4)`
          : `0 0 2px ${stroke}, 0 2px 4px rgba(0,0,0,0.6)`,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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

  // Instantiate Chess.js instance based on FEN
  const chess = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  // Valid moves for selected square
  const validMoves = useMemo(() => {
    if (!selectedSquare || disabled || !isMyTurn) return [];
    try {
      return chess.moves({ square: selectedSquare, verbose: true });
    } catch {
      return [];
    }
  }, [chess, selectedSquare, disabled, isMyTurn]);

  // In-check status
  const inCheck = chess.inCheck();
  const turnColor = chess.turn();

  // Board orientation
  const isFlipped = myColor === 'black';

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayedRanks = isFlipped ? [...ranks].reverse() : ranks;
  const displayedFiles = isFlipped ? [...files].reverse() : files;

  const handleSquareClick = (square: Square) => {
    if (disabled || !isMyTurn) return;

    const piece = chess.get(square);
    const myPieceColor = myColor === 'white' ? 'w' : 'b';

    // If clicking own piece, select it
    if (piece && piece.color === myPieceColor) {
      setSelectedSquare(square);
      return;
    }

    // If a piece was selected and clicking destination square
    if (selectedSquare) {
      const move = validMoves.find((m) => m.to === square);
      if (move) {
        // Check for promotion (Pawn reaching 8th rank for white or 1st for black)
        const selectedPiece = chess.get(selectedSquare);
        if (
          selectedPiece?.type === 'p' &&
          ((selectedPiece.color === 'w' && square[1] === '8') ||
            (selectedPiece.color === 'b' && square[1] === '1'))
        ) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }

        // Normal move
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
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* 8x8 Chess Board Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, minmax(36px, 64px))',
          gridTemplateRows: 'repeat(8, minmax(36px, 64px))',
          border: '4px solid #334155',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(0,0,0,0.3)',
          backgroundColor: '#0F172A',
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

            // Background color logic
            let bg = isLight ? '#E2E8F0' : '#475569';
            if (isLastMoveFrom || isLastMoveTo) {
              bg = isLight ? '#FDE68A' : '#D97706'; // Amber highlight for last move
            }
            if (isSelected) {
              bg = isLight ? '#BAE6FD' : '#0284C7'; // Blue highlight for selected
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
                {/* File / Rank small label on corner */}
                {fileIdx === 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: '3px',
                      fontSize: '10px',
                      fontWeight: 600,
                      opacity: 0.4,
                      color: isLight ? '#1E293B' : '#F1F5F9',
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
                      fontWeight: 600,
                      opacity: 0.4,
                      color: isLight ? '#1E293B' : '#F1F5F9',
                    }}
                  >
                    {file}
                  </span>
                )}

                {/* Valid move indicator dot or capture ring */}
                {isValidDestination && (
                  <div
                    style={{
                      position: 'absolute',
                      width: piece ? '80%' : '28%',
                      height: piece ? '80%' : '28%',
                      borderRadius: '50%',
                      backgroundColor: piece ? 'transparent' : 'rgba(16, 185, 129, 0.65)',
                      border: piece ? '3px solid rgba(239, 68, 68, 0.85)' : 'none',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Piece Icon */}
                {piece && (
                  <div
                    style={{
                      zIndex: 3,
                      transform: isSelected ? 'scale(1.12)' : 'none',
                    }}
                  >
                    <ChessPieceSVG type={piece.type} color={piece.color} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Promotion Choice Dialog */}
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
            borderRadius: '10px',
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#098f64';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#334155';
                    }}
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
