import React from 'react';
import { Clock, Flag, Handshake, RotateCcw, LogOut, Trophy } from 'lucide-react';

interface GameControlsProps {
  gameType: 'chess' | 'xiangqi';
  roomName: string;
  hostName: string;
  guestName?: string;
  myRole: 'host' | 'guest' | 'spectator';
  currentTurn: 'white' | 'black' | 'red';
  status: 'waiting' | 'in_progress' | 'finished' | 'abandoned';
  winnerName?: string;
  winReason?: string | null;
  hostTimeRemaining: number;
  guestTimeRemaining: number;
  moveHistory: Array<{ notation?: string; piece?: any }>;
  drawOfferedBy?: string | null;
  rematchRequestedBy?: string | null;
  currentUserId?: string;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onResign: () => void;
  onRequestRematch: () => void;
  onLeaveRoom: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameType,
  roomName,
  hostName,
  guestName,
  myRole,
  currentTurn,
  status,
  winnerName,
  winReason,
  hostTimeRemaining,
  guestTimeRemaining,
  moveHistory,
  drawOfferedBy,
  rematchRequestedBy,
  currentUserId,
  onOfferDraw,
  onAcceptDraw,
  onResign,
  onRequestRematch,
  onLeaveRoom,
}) => {
  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isHostTurn = gameType === 'chess' ? currentTurn === 'white' : currentTurn === 'red';
  const isGuestTurn = currentTurn === 'black';

  const hostPieceLabel = gameType === 'chess' ? 'Quân Trắng (Đi trước)' : 'Quân Đỏ (Đi trước)';
  const guestPieceLabel = gameType === 'chess' ? 'Quân Đen' : 'Quân Đen';

  const isDrawOfferedToMe = drawOfferedBy && drawOfferedBy !== currentUserId;
  const isRematchRequested = rematchRequestedBy && rematchRequestedBy !== currentUserId;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
        maxWidth: '340px',
        backgroundColor: '#1E293B',
        borderRadius: '12px',
        padding: '1.25rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F1F5F9', fontWeight: 600 }}>
            {roomName}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'capitalize' }}>
            {gameType === 'chess' ? '♟️ Cờ Vua Quốc Tế' : '🀄 Cờ Tướng Cổ Truyền'}
          </span>
        </div>
        <button
          onClick={onLeaveRoom}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#94A3B8',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#EF4444';
            e.currentTarget.style.borderColor = '#EF4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94A3B8';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
        >
          <LogOut size={13} /> Rời phòng
        </button>
      </div>

      {/* Opponent (Guest) Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backgroundColor: isGuestTurn && status === 'in_progress' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.2)',
          border: isGuestTurn && status === 'in_progress' ? '1px solid #3B82F6' : '1px solid transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isGuestTurn && status === 'in_progress' ? '#10B981' : '#64748B' }} />
            <strong style={{ color: '#F1F5F9', fontSize: '0.9rem' }}>
              {guestName || 'Đang chờ đối thủ…'}
            </strong>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{guestPieceLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0F172A', padding: '4px 10px', borderRadius: '6px' }}>
          <Clock size={14} color={guestTimeRemaining < 60 ? '#EF4444' : '#94A3B8'} />
          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.95rem', color: guestTimeRemaining < 60 ? '#EF4444' : '#F1F5F9' }}>
            {formatTime(guestTimeRemaining)}
          </span>
        </div>
      </div>

      {/* Game Status Banner */}
      {status === 'waiting' && (
        <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', border: '1px solid #EAB308', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
          <span style={{ color: '#FDE047', fontSize: '0.85rem', fontWeight: 500 }}>
            ⏳ Đang chờ người chơi thứ 2 tham gia bàn cờ…
          </span>
        </div>
      )}

      {status === 'finished' && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#34D399', fontWeight: 600, fontSize: '0.95rem' }}>
            <Trophy size={16} /> Ván cờ kết thúc!
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#E2E8F0', fontSize: '0.8rem' }}>
            {winnerName ? `🎉 ${winnerName} chiến thắng (${winReason})` : '🤝 Ván cờ hòa'}
          </p>
        </div>
      )}

      {/* Host Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backgroundColor: isHostTurn && status === 'in_progress' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.2)',
          border: isHostTurn && status === 'in_progress' ? '1px solid #3B82F6' : '1px solid transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isHostTurn && status === 'in_progress' ? '#10B981' : '#64748B' }} />
            <strong style={{ color: '#F1F5F9', fontSize: '0.9rem' }}>
              {hostName} (Host)
            </strong>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{hostPieceLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0F172A', padding: '4px 10px', borderRadius: '6px' }}>
          <Clock size={14} color={hostTimeRemaining < 60 ? '#EF4444' : '#94A3B8'} />
          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.95rem', color: hostTimeRemaining < 60 ? '#EF4444' : '#F1F5F9' }}>
            {formatTime(hostTimeRemaining)}
          </span>
        </div>
      </div>

      {/* Move History / Notation Log */}
      <div style={{ backgroundColor: '#0F172A', borderRadius: '8px', padding: '0.75rem', height: '110px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, marginBottom: '4px' }}>
          Biên bản nước đi ({moveHistory.length}):
        </div>
        {moveHistory.length === 0 ? (
          <span style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>Chưa có nước đi nào</span>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '0.75rem' }}>
            {moveHistory.map((m, idx) => (
              <span key={idx} style={{ color: idx % 2 === 0 ? '#F8FAFC' : '#93C5FD' }}>
                {idx + 1}. {m.notation || 'Nước đi'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* In-Game Action Buttons */}
      {status === 'in_progress' && myRole !== 'spectator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {isDrawOfferedToMe ? (
            <button
              onClick={onAcceptDraw}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                backgroundColor: '#10B981',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                padding: '0.6rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Handshake size={16} /> Đối thủ xin hòa - Đồng ý hòa
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={onOfferDraw}
                disabled={!!drawOfferedBy}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: '#334155',
                  color: '#E2E8F0',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  cursor: drawOfferedBy ? 'not-allowed' : 'pointer',
                  opacity: drawOfferedBy ? 0.6 : 1,
                }}
              >
                <Handshake size={14} /> {drawOfferedBy ? 'Đã gửi xin hòa' : 'Xin hòa'}
              </button>
              <button
                onClick={onResign}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <Flag size={14} /> Đầu hàng
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rematch Button for Finished Game */}
      {status === 'finished' && myRole !== 'spectator' && (
        <button
          onClick={onRequestRematch}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: '#098f64',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            padding: '0.65rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={16} /> {isRematchRequested ? 'Đối thủ xin đấu lại - Chấp nhận' : 'Xin đấu lại (Rematch)'}
        </button>
      )}
    </div>
  );
};
