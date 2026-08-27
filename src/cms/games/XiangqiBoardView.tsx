import React, { useState, useMemo } from 'react';
import { XiangqiEngine } from './xiangqiEngine';
import type { XiangqiPiece, XiangqiPieceType, XiangqiColor } from './xiangqiEngine';
import { gameAudio } from './gameAudio';
import { Palette, Box, Layers } from 'lucide-react';
import { Real3DXiangqiCanvas } from './Real3DXiangqiCanvas';

interface XiangqiBoardViewProps {
  fen: string;
  myColor: 'red' | 'black' | 'spectator';
  isMyTurn: boolean;
  onMove: (from: { x: number; y: number }, to: { x: number; y: number }) => void;
  lastMove?: { from: { x: number; y: number }; to: { x: number; y: number } } | null;
  disabled?: boolean;
}

export type XiangqiThemeKey = 'imperial' | 'bamboo' | 'xuanpaper' | 'jade';

interface XiangqiThemeConfig {
  name: string;
  boardBg: string;
  borderColor: string;
  lineColor: string;
  riverTextColor: string;
  redPieceBg: string;
  redPieceBorder: string;
  redPieceColor: string;
  blackPieceBg: string;
  blackPieceBorder: string;
  blackPieceColor: string;
}

export const XIANGQI_THEMES: Record<XiangqiThemeKey, XiangqiThemeConfig> = {
  imperial: {
    name: '🪵 Gỗ Cẩm Lai (Imperial Rosewood)',
    boardBg: 'linear-gradient(135deg, #DEB887 0%, #C89D66 50%, #B8860B 100%)',
    borderColor: '#5C3A14',
    lineColor: '#5C3A14',
    riverTextColor: '#5C3A14',
    redPieceBg: '#FFF1D6',
    redPieceBorder: '#DC2626',
    redPieceColor: '#DC2626',
    blackPieceBg: '#2A2521',
    blackPieceBorder: '#E2E8F0',
    blackPieceColor: '#F1F5F9',
  },
  bamboo: {
    name: '🎋 Gỗ Trúc Nhã Nhặn (Golden Bamboo)',
    boardBg: 'linear-gradient(135deg, #E6D4AE 0%, #D8C296 50%, #CBB07E 100%)',
    borderColor: '#6B542E',
    lineColor: '#6B542E',
    riverTextColor: '#6B542E',
    redPieceBg: '#FFF8EA',
    redPieceBorder: '#B91C1C',
    redPieceColor: '#B91C1C',
    blackPieceBg: '#332E27',
    blackPieceBorder: '#D1D5DB',
    blackPieceColor: '#F8FAFC',
  },
  xuanpaper: {
    name: '📜 Giấy Xuyến Thủy Mặc (Ancient Ink)',
    boardBg: 'linear-gradient(135deg, #F4EEDC 0%, #E9DFC9 100%)',
    borderColor: '#3F3931',
    lineColor: '#3F3931',
    riverTextColor: '#3F3931',
    redPieceBg: '#FAF5EE',
    redPieceBorder: '#C2410C',
    redPieceColor: '#C2410C',
    blackPieceBg: '#1C1917',
    blackPieceBorder: '#A8A29E',
    blackPieceColor: '#F5F5F4',
  },
  jade: {
    name: '💎 Ngọc Bích & Hoàng Kim (Imperial Jade)',
    boardBg: 'linear-gradient(135deg, #134E4A 0%, #042F2E 100%)',
    borderColor: '#D97706',
    lineColor: 'rgba(251, 191, 36, 0.65)',
    riverTextColor: '#FCD34D',
    redPieceBg: '#FEF2F2',
    redPieceBorder: '#EF4444',
    redPieceColor: '#DC2626',
    blackPieceBg: '#022C22',
    blackPieceBorder: '#34D399',
    blackPieceColor: '#6EE7B7',
  },
};

// Traditional Wood Carved Piece Disc Component
const XiangqiPieceDisc: React.FC<{
  piece: XiangqiPiece;
  theme: XiangqiThemeConfig;
  isSelected?: boolean;
}> = ({ piece, theme, isSelected = false }) => {
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

  const char = CHARS[piece.type]?.[piece.color] || (isRed ? '兵' : '卒');

  return (
    <div
      style={{
        width: 'clamp(32px, 4.3vw, 50px)',
        height: 'clamp(32px, 4.3vw, 50px)',
        borderRadius: '50%',
        backgroundColor: isRed ? theme.redPieceBg : theme.blackPieceBg,
        border: `3px solid ${isRed ? theme.redPieceBorder : theme.blackPieceBorder}`,
        boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isRed ? theme.redPieceColor : theme.blackPieceColor,
        fontSize: 'clamp(18px, 2.7vw, 26px)',
        fontWeight: 'bold',
        fontFamily: '"Songti SC", "SimSun", "Noto Serif SC", "STSong", serif',
        userSelect: 'none',
        transform: isSelected ? 'scale(1.15)' : 'none',
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
  const [themeKey, setThemeKey] = useState<XiangqiThemeKey>(() => {
    return (localStorage.getItem('lng79_xiangqi_theme') as XiangqiThemeKey) || 'imperial';
  });
  const [is3D, setIs3D] = useState<boolean>(() => {
    return localStorage.getItem('lng79_xiangqi_3d') === 'true';
  });
  const [showThemePicker, setShowThemePicker] = useState(false);

  const theme = XIANGQI_THEMES[themeKey] || XIANGQI_THEMES.imperial;

  const handleSelectTheme = (key: XiangqiThemeKey) => {
    setThemeKey(key);
    localStorage.setItem('lng79_xiangqi_theme', key);
    setShowThemePicker(false);
  };

  const handleToggle3D = () => {
    const nextVal = !is3D;
    setIs3D(nextVal);
    localStorage.setItem('lng79_xiangqi_3d', nextVal ? 'true' : 'false');
  };

  const engine = useMemo(() => new XiangqiEngine(fen), [fen]);

  const legalMoves = useMemo(() => {
    if (!selectedPos || disabled || !isMyTurn) return [];
    return engine.getLegalMoves(selectedPos.x, selectedPos.y);
  }, [engine, selectedPos, disabled, isMyTurn]);

  const isFlipped = myColor === 'black';

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

    if (piece && piece.color === myEngineColor) {
      setSelectedPos({ x, y });
      return;
    }

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
          {(Object.keys(XIANGQI_THEMES) as XiangqiThemeKey[]).map((tKey) => {
            const t = XIANGQI_THEMES[tKey];
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
                <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '3px', background: t.boardBg, border: '1px solid rgba(255,255,255,0.2)' }} />
                {t.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Board View: 3D WebGL Canvas or 2D Vector Board */}
      {is3D ? (
        <Real3DXiangqiCanvas
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
              position: 'relative',
              padding: '24px 18px',
              background: theme.boardBg,
              borderRadius: '12px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.7), inset 0 0 16px rgba(0,0,0,0.3)',
              border: `5px solid ${theme.borderColor}`,
              transition: 'all 0.25s ease',
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
            <rect x="0" y="0" width="400" height="450" fill="none" stroke={theme.lineColor} strokeWidth="2.5" />

            {/* Horizontal lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke={theme.lineColor} strokeWidth="1.3" />
            ))}

            {/* Vertical lines (Top half) */}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`vt-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="200" stroke={theme.lineColor} strokeWidth="1.3" />
            ))}

            {/* Vertical lines (Bottom half) */}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`vb-${i}`} x1={i * 50} y1="250" x2={i * 50} y2="450" stroke={theme.lineColor} strokeWidth="1.3" />
            ))}

            {/* Border vertical continuous lines */}
            <line x1="0" y1="200" x2="0" y2="250" stroke={theme.lineColor} strokeWidth="2.5" />
            <line x1="400" y1="200" x2="400" y2="250" stroke={theme.lineColor} strokeWidth="2.5" />

            {/* Palace Diagonal Crosses (Top & Bottom) */}
            <line x1="150" y1="0" x2="250" y2="100" stroke={theme.lineColor} strokeWidth="1.3" />
            <line x1="250" y1="0" x2="150" y2="100" stroke={theme.lineColor} strokeWidth="1.3" />

            <line x1="150" y1="350" x2="250" y2="450" stroke={theme.lineColor} strokeWidth="1.3" />
            <line x1="250" y1="350" x2="150" y2="450" stroke={theme.lineColor} strokeWidth="1.3" />

            {/* River Text */}
            <text x="100" y="232" textAnchor="middle" fill={theme.riverTextColor} fontSize="18" fontWeight="bold" fontFamily="serif">
              楚 河 (Sở Hà)
            </text>
            <text x="300" y="232" textAnchor="middle" fill={theme.riverTextColor} fontSize="18" fontWeight="bold" fontFamily="serif">
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
                    {(isLastMoveFrom || isLastMoveTo) && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '2px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(234, 179, 8, 0.45)',
                          zIndex: 1,
                        }}
                      />
                    )}

                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '0',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(56, 189, 248, 0.55)',
                          border: '2px solid #0284C7',
                          zIndex: 1,
                        }}
                      />
                    )}

                    {isKingInCheck && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '-4px',
                          borderRadius: '50%',
                          boxShadow: '0 0 18px 5px #EF4444',
                          zIndex: 1,
                          animation: 'pulse 1.2s infinite',
                        }}
                      />
                    )}

                    {isLegalDest && (
                      <div
                        style={{
                          position: 'absolute',
                          width: piece ? '85%' : '30%',
                          height: piece ? '85%' : '30%',
                          borderRadius: '50%',
                          backgroundColor: piece ? 'transparent' : 'rgba(16, 185, 129, 0.8)',
                          border: piece ? '3.5px solid rgba(239, 68, 68, 0.95)' : 'none',
                          zIndex: 3,
                          pointerEvents: 'none',
                        }}
                      />
                    )}

                    {piece && (
                      <div style={{ zIndex: 2 }}>
                        <XiangqiPieceDisc piece={piece} theme={theme} isSelected={isSelected} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
