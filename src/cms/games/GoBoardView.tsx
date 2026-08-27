import React, { useState, useMemo } from 'react';
import { GoEngine } from './goEngine';
import { gameAudio } from './gameAudio';
import { GO_THEMES } from './Real3DGoCanvas';
import type { GoThemeKey } from './Real3DGoCanvas';
import { Real3DGoCanvas } from './Real3DGoCanvas';
import { Palette, Box, Layers, SkipForward } from 'lucide-react';

interface GoBoardViewProps {
  fen: string;
  myColor: 'black' | 'white' | 'spectator';
  isMyTurn: boolean;
  onMove: (x: number, y: number) => void;
  onPass?: () => void;
  lastMove?: { x: number; y: number } | null;
  disabled?: boolean;
}

export const GoBoardView: React.FC<GoBoardViewProps> = ({
  fen,
  myColor,
  isMyTurn,
  onMove,
  onPass,
  lastMove,
  disabled = false,
}) => {
  // 3D mode state
  const [is3D, setIs3D] = useState(() => {
    return localStorage.getItem('lng79_go_3d_mode') !== 'false';
  });

  // Theme selection
  const [themeKey, setThemeKey] = useState<GoThemeKey>(() => {
    const saved = localStorage.getItem('lng79_go_theme') as GoThemeKey;
    return saved && GO_THEMES[saved] ? saved : 'kaya';
  });
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null);

  const engine = useMemo(() => new GoEngine(fen), [fen]);
  const theme = GO_THEMES[themeKey];

  const handleToggle3D = () => {
    const next = !is3D;
    setIs3D(next);
    localStorage.setItem('lng79_go_3d_mode', String(next));
  };

  const handleSelectTheme = (key: GoThemeKey) => {
    setThemeKey(key);
    localStorage.setItem('lng79_go_theme', key);
    setShowThemePicker(false);
  };

  const handleIntersectionClick = (x: number, y: number) => {
    if (!isMyTurn || disabled) return;
    if (engine.get(x, y) !== null) return;

    gameAudio.playMoveSound();
    onMove(x, y);
  };

  const size = engine.size;
  const starPoints = engine.getStarPoints();
  const step = 400 / (size - 1);
  const pad = 24;

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

        {/* Pass Button */}
        {onPass && isMyTurn && !disabled && (
          <button
            onClick={onPass}
            title="Bỏ lượt đi (Pass Turn)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(234, 179, 8, 0.2)',
              border: '1px solid #EAB308',
              color: '#FDE047',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <SkipForward size={13} /> Bỏ lượt (Pass)
          </button>
        )}
      </div>

      {/* Floating Center Turn & Captures Indicator */}
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
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isMyTurn ? '#10B981' : '#94A3B8', animation: isMyTurn ? 'pulse 1.5s infinite' : 'none' }} />
        <span>{isMyTurn ? 'Lượt của bạn đặt quân' : 'Đang chờ đối thủ…'}</span>
        <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
          (Tù binh: ⚫ {engine.capturesB} | ⚪ {engine.capturesW})
        </span>
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
          {(Object.keys(GO_THEMES) as GoThemeKey[]).map((tKey) => {
            const t = GO_THEMES[tKey];
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
        <Real3DGoCanvas
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
              width: 'min(700px, 80vh)',
              aspectRatio: '1/1',
              background: theme.boardBg,
              borderRadius: '12px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.7), inset 0 0 16px rgba(0,0,0,0.3)',
              border: `6px solid ${theme.lineColor}`,
              padding: `${pad}px`,
              boxSizing: 'border-box',
              transition: 'all 0.25s ease',
            }}
          >
            {/* SVG Grid & Star Points */}
            <svg
              viewBox={`0 0 ${400 + pad * 2} ${400 + pad * 2}`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              {/* Grid Lines */}
              {Array.from({ length: size }).map((_, i) => {
                const pos = pad + i * step;
                return (
                  <g key={i}>
                    {/* Horizontal Line */}
                    <line x1={pad} y1={pos} x2={pad + 400} y2={pos} stroke={theme.lineColor} strokeWidth="1.5" />
                    {/* Vertical Line */}
                    <line x1={pos} y1={pad} x2={pos} y2={pad + 400} stroke={theme.lineColor} strokeWidth="1.5" />
                  </g>
                );
              })}

              {/* Star Points (Hoshi) */}
              {starPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pad + pt.x * step}
                  cy={pad + pt.y * step}
                  r={size === 19 ? 3.5 : 4.5}
                  fill={theme.lineColor}
                />
              ))}
            </svg>

            {/* Clickable Intersections & Stones Layer */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                gridTemplateRows: `repeat(${size}, 1fr)`,
                zIndex: 2,
              }}
            >
              {Array.from({ length: size }).map((_, y) =>
                Array.from({ length: size }).map((_, x) => {
                  const stone = engine.get(x, y);
                  const isLastMove = lastMove && lastMove.x === x && lastMove.y === y;
                  const isHovered = hoveredPoint && hoveredPoint.x === x && hoveredPoint.y === y;

                  return (
                    <div
                      key={`${x}-${y}`}
                      onClick={() => handleIntersectionClick(x, y)}
                      onMouseEnter={() => setHoveredPoint({ x, y })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: !stone && isMyTurn && !disabled ? 'pointer' : 'default',
                      }}
                    >
                      {/* Ghost Hover Stone */}
                      {isHovered && !stone && isMyTurn && !disabled && (
                        <div
                          style={{
                            width: '92%',
                            height: '92%',
                            borderRadius: '50%',
                            backgroundColor: myColor === 'white' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                            border: '2px solid #00df89',
                            boxShadow: '0 0 10px rgba(0, 223, 137, 0.6)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}

                      {/* Placed Go Stone */}
                      {stone && (
                        <div
                          style={{
                            width: '94%',
                            height: '94%',
                            borderRadius: '50%',
                            background:
                              stone === 'B'
                                ? 'radial-gradient(circle at 35% 35%, #444 0%, #151515 65%, #050505 100%)'
                                : 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #F1F5F9 60%, #CBD5E1 100%)',
                            boxShadow:
                              stone === 'B'
                                ? '0 5px 12px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.3)'
                                : '0 5px 12px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}
                        >
                          {/* Last move marker red dot */}
                          {isLastMove && (
                            <div
                              style={{
                                width: '22%',
                                height: '22%',
                                borderRadius: '50%',
                                backgroundColor: '#EF4444',
                                boxShadow: '0 0 6px #EF4444',
                              }}
                            />
                          )}
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
