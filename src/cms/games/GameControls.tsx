import React, { useState, useEffect, useRef } from 'react';
import { Clock, Flag, Handshake, RotateCcw, LogOut, Trophy, MessageSquare, Send, ListOrdered, Plus, Sliders, X, Check } from 'lucide-react';
import { supabase } from '../../shared/supabase/supabase';
import { gameAudio } from './gameAudio';

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface GameControlsProps {
  roomId: string;
  gameType: 'chess' | 'xiangqi' | 'go';
  roomName: string;
  hostName: string;
  guestName?: string;
  myRole: 'host' | 'guest' | 'spectator';
  currentTurn: 'white' | 'black' | 'red';
  status: 'waiting' | 'in_progress' | 'finished' | 'abandoned';
  winnerName?: string;
  winReason?: string | null;
  timeLimitMinutes?: number;
  hostTimeRemaining: number;
  guestTimeRemaining: number;
  moveHistory: Array<{ notation?: string; piece?: any }>;
  drawOfferedBy?: string | null;
  rematchRequestedBy?: string | null;
  currentUserId?: string;
  currentUserName?: string;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onResign: () => void;
  onRequestRematch: () => void;
  onLeaveRoom: () => void;
  onAdjustTime?: (newHostSeconds: number, newGuestSeconds: number, newLimitMinutes?: number) => void;
  onPassTurn?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  roomId,
  gameType,
  roomName,
  hostName,
  guestName,
  myRole,
  currentTurn,
  status,
  winnerName,
  winReason,
  timeLimitMinutes = 10,
  hostTimeRemaining,
  guestTimeRemaining,
  moveHistory,
  drawOfferedBy,
  rematchRequestedBy,
  currentUserId,
  currentUserName,
  onOfferDraw,
  onAcceptDraw,
  onResign,
  onRequestRematch,
  onLeaveRoom,
  onAdjustTime,
  onPassTurn,
}) => {
  const [activeTab, setActiveTab] = useState<'moves' | 'chat'>('chat');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [customHostMinutes, setCustomHostMinutes] = useState(Math.ceil(hostTimeRemaining / 60) || 10);
  const [customGuestMinutes, setCustomGuestMinutes] = useState(Math.ceil(guestTimeRemaining / 60) || 10);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender_id: 'system',
      sender_name: 'Hệ Thống',
      message: 'Chào mừng bạn vào bàn cờ! Hãy chúc đối thủ một ván cờ vui vẻ 🤝',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (timeLimitMinutes === 0) return '♾️ Vô tận';
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isHostTurn =
    gameType === 'chess'
      ? currentTurn === 'white'
      : gameType === 'xiangqi'
      ? currentTurn === 'red'
      : currentTurn === 'black'; // In Go, Host is Black (plays first)
  const isGuestTurn =
    gameType === 'chess'
      ? currentTurn === 'black'
      : gameType === 'xiangqi'
      ? currentTurn === 'black'
      : currentTurn === 'white'; // In Go, Guest is White

  const hostPieceLabel =
    gameType === 'chess'
      ? 'Quân Trắng (Đi trước)'
      : gameType === 'xiangqi'
      ? 'Quân Đỏ (Đi trước)'
      : 'Quân Đen (Đi trước)';
  const guestPieceLabel =
    gameType === 'chess'
      ? 'Quân Đen'
      : gameType === 'xiangqi'
      ? 'Quân Đen'
      : 'Quân Trắng';

  const isDrawOfferedToMe = drawOfferedBy && drawOfferedBy !== currentUserId;
  const isRematchRequested = rematchRequestedBy && rematchRequestedBy !== currentUserId;

  // Supabase Realtime Live Chat Broadcast Subscription
  useEffect(() => {
    if (!roomId || !supabase) return;

    const channel = supabase.channel(`game_chat_${roomId}`);
    channel
      .on('broadcast', { event: 'chat_msg' }, ({ payload }) => {
        if (payload && payload.sender_id !== currentUserId) {
          setChatMessages((prev) => [...prev, payload]);
          gameAudio.playMoveSound();
        }
      })
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [roomId, currentUserId]);

  // Auto scroll chat to bottom on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputMessage).trim();
    if (!text || !roomId || !supabase) return;

    const senderDisplayName =
      currentUserName || (myRole === 'host' ? hostName : myRole === 'guest' ? guestName || 'Đối thủ' : 'Khán giả');

    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender_id: currentUserId || 'anon',
      sender_name: senderDisplayName,
      message: text,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    if (!customText) setInputMessage('');

    const channel = supabase.channel(`game_chat_${roomId}`);
    await channel.send({
      type: 'broadcast',
      event: 'chat_msg',
      payload: newMsg,
    });
  };

  const handleAddMinutes = (side: 'host' | 'guest' | 'both', mins: number) => {
    if (!onAdjustTime) return;
    const addedSecs = mins * 60;
    const newHost = side === 'guest' ? hostTimeRemaining : hostTimeRemaining + addedSecs;
    const newGuest = side === 'host' ? guestTimeRemaining : guestTimeRemaining + addedSecs;
    onAdjustTime(newHost, newGuest, timeLimitMinutes === 0 ? 10 : timeLimitMinutes);
  };

  const handleSetUnlimited = () => {
    if (!onAdjustTime) return;
    onAdjustTime(99999, 99999, 0);
    setShowTimeModal(false);
  };

  const handleApplyCustomTime = () => {
    if (!onAdjustTime) return;
    const hostSecs = Math.max(1, customHostMinutes) * 60;
    const guestSecs = Math.max(1, customGuestMinutes) * 60;
    onAdjustTime(hostSecs, guestSecs, Math.max(customHostMinutes, customGuestMinutes));
    setShowTimeModal(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        width: '100%',
        height: '100%',
        backgroundColor: '#111827',
        padding: '1.25rem',
        boxSizing: 'border-box',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.65rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#F1F5F9', fontWeight: 600 }}>
            {roomName}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            {gameType === 'chess' ? '♟️ Cờ Vua Quốc Tế' : gameType === 'xiangqi' ? '🀄 Cờ Tướng Cổ Truyền' : '⚪⚫ Cờ Vây (Weiqi / Go)'} • {timeLimitMinutes === 0 ? '♾️ Tự do' : `${timeLimitMinutes}p`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onAdjustTime && (
            <button
              onClick={() => {
                setCustomHostMinutes(Math.ceil(hostTimeRemaining / 60) || 10);
                setCustomGuestMinutes(Math.ceil(guestTimeRemaining / 60) || 10);
                setShowTimeModal(true);
              }}
              title="Chỉnh sửa thời gian ván đấu ngay lập tức"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#34D399',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Sliders size={13} /> Chỉnh giờ
            </button>
          )}
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
      </div>

      {/* Opponent (Guest) Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.65rem 0.85rem',
          borderRadius: '8px',
          backgroundColor: isGuestTurn && status === 'in_progress' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.25)',
          border: isGuestTurn && status === 'in_progress' ? '1px solid #3B82F6' : '1px solid transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isGuestTurn && status === 'in_progress' ? '#10B981' : '#64748B' }} />
            <strong style={{ color: '#F1F5F9', fontSize: '0.85rem' }}>
              {guestName || 'Đang chờ đối thủ…'}
            </strong>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{guestPieceLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#0F172A', padding: '4px 8px', borderRadius: '6px' }}>
            <Clock size={13} color={timeLimitMinutes > 0 && guestTimeRemaining < 60 ? '#EF4444' : '#94A3B8'} />
            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: timeLimitMinutes > 0 && guestTimeRemaining < 60 ? '#EF4444' : '#F1F5F9' }}>
              {formatTime(guestTimeRemaining)}
            </span>
          </div>
          {onAdjustTime && status === 'in_progress' && (
            <button
              onClick={() => handleAddMinutes('guest', 1)}
              title="Thêm +1 phút cho bên Đen"
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#38BDF8',
                borderRadius: '4px',
                padding: '3px 6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              +1p
            </button>
          )}
        </div>
      </div>

      {/* Game Status Banner */}
      {status === 'waiting' && (
        <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', border: '1px solid #EAB308', borderRadius: '8px', padding: '0.65rem', textAlign: 'center' }}>
          <span style={{ color: '#FDE047', fontSize: '0.8rem', fontWeight: 500 }}>
            ⏳ Đang chờ người chơi thứ 2 tham gia bàn cờ…
          </span>
        </div>
      )}

      {status === 'finished' && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', padding: '0.65rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#34D399', fontWeight: 600, fontSize: '0.9rem' }}>
            <Trophy size={15} /> Ván cờ kết thúc!
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#E2E8F0', fontSize: '0.78rem' }}>
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
          padding: '0.65rem 0.85rem',
          borderRadius: '8px',
          backgroundColor: isHostTurn && status === 'in_progress' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.25)',
          border: isHostTurn && status === 'in_progress' ? '1px solid #3B82F6' : '1px solid transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isHostTurn && status === 'in_progress' ? '#10B981' : '#64748B' }} />
            <strong style={{ color: '#F1F5F9', fontSize: '0.85rem' }}>
              {hostName} (Host)
            </strong>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{hostPieceLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#0F172A', padding: '4px 8px', borderRadius: '6px' }}>
            <Clock size={13} color={timeLimitMinutes > 0 && hostTimeRemaining < 60 ? '#EF4444' : '#94A3B8'} />
            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: timeLimitMinutes > 0 && hostTimeRemaining < 60 ? '#EF4444' : '#F1F5F9' }}>
              {formatTime(hostTimeRemaining)}
            </span>
          </div>
          {onAdjustTime && status === 'in_progress' && (
            <button
              onClick={() => handleAddMinutes('host', 1)}
              title="Thêm +1 phút cho bên Trắng/Đỏ"
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#38BDF8',
                borderRadius: '4px',
                padding: '3px 6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              +1p
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher: Live Chat vs Moves History */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0F172A', padding: '3px', borderRadius: '8px' }}>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: activeTab === 'chat' ? '#1E293B' : 'transparent',
            color: activeTab === 'chat' ? '#00df89' : '#94A3B8',
            border: 'none',
            borderRadius: '6px',
            padding: '5px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <MessageSquare size={13} /> Trò Chuyện ({chatMessages.length})
        </button>
        <button
          onClick={() => setActiveTab('moves')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: activeTab === 'moves' ? '#1E293B' : 'transparent',
            color: activeTab === 'moves' ? '#00df89' : '#94A3B8',
            border: 'none',
            borderRadius: '6px',
            padding: '5px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ListOrdered size={13} /> Nước Đi ({moveHistory.length})
        </button>
      </div>

      {/* Tab Content: Live Chat */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '180px', gap: '0.5rem' }}>
          {/* Message List */}
          <div
            style={{
              flex: 1,
              maxHeight: '200px',
              overflowY: 'auto',
              backgroundColor: '#0F172A',
              borderRadius: '8px',
              padding: '0.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {chatMessages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const isSystem = msg.sender_id === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94A3B8', padding: '2px 4px', fontStyle: 'italic' }}>
                    {msg.message}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: isMe ? '#098f64' : '#1E293B',
                    color: '#FFF',
                    borderRadius: '8px',
                    padding: '5px 8px',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: isMe ? '#D1FAE5' : '#94A3B8', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span>{msg.sender_name}</span>
                    <span>{msg.created_at}</span>
                  </div>
                  <div>{msg.message}</div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Reaction Emojis */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
            {['👏', '🔥', '🤔', '☕', '🤝', '♟️', '👑'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendMessage(emoji)}
                style={{
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            style={{ display: 'flex', gap: '6px' }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              style={{
                flex: 1,
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFF',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              style={{
                backgroundColor: inputMessage.trim() ? '#00df89' : '#334155',
                color: inputMessage.trim() ? '#0B1120' : '#64748B',
                border: 'none',
                borderRadius: '6px',
                padding: '0 10px',
                cursor: inputMessage.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Tab Content: Move History */}
      {activeTab === 'moves' && (
        <div style={{ backgroundColor: '#0F172A', borderRadius: '8px', padding: '0.65rem', height: '180px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
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
      )}

      {/* In-Game Action Buttons */}
      {status === 'in_progress' && myRole !== 'spectator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: 'auto' }}>
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
                padding: '0.55rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Handshake size={15} /> Đối thủ xin hòa - Đồng ý hòa
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {gameType === 'go' && onPassTurn && (
                <button
                  onClick={onPassTurn}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    backgroundColor: 'rgba(234, 179, 8, 0.2)',
                    border: '1px solid #EAB308',
                    color: '#FDE047',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Bỏ lượt đi (Pass Turn)
                </button>
              )}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={onOfferDraw}
                  disabled={!!drawOfferedBy}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    backgroundColor: '#1E293B',
                    color: '#E2E8F0',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '0.45rem',
                    fontSize: '0.78rem',
                    cursor: drawOfferedBy ? 'not-allowed' : 'pointer',
                    opacity: drawOfferedBy ? 0.6 : 1,
                  }}
                >
                  <Handshake size={13} /> {drawOfferedBy ? 'Đã xin hòa' : 'Xin hòa'}
                </button>
                <button
                  onClick={onResign}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '0.45rem',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  <Flag size={13} /> Đầu hàng
                </button>
              </div>
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
            padding: '0.6rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 'auto',
          }}
        >
          <RotateCcw size={15} /> {isRematchRequested ? 'Đối thủ xin đấu lại - Chấp nhận' : 'Xin đấu lại (Rematch)'}
        </button>
      )}

      {/* TIME ADJUSTMENT POPUP MODAL */}
      {showTimeModal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(6px)',
            borderRadius: '12px',
            padding: '1.25rem',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            <strong style={{ color: '#F1F5F9', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#34D399" /> Chỉnh Giờ Trong Ván Đấu
            </strong>
            <button
              onClick={() => setShowTimeModal(false)}
              style={{ backgroundColor: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Thêm thời gian nhanh cho cả 2 bên:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => handleAddMinutes('both', 1)}
              style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#F1F5F9', borderRadius: '6px', padding: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Plus size={12} /> +1 Phút (Cả 2)
            </button>
            <button
              onClick={() => handleAddMinutes('both', 3)}
              style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#F1F5F9', borderRadius: '6px', padding: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Plus size={12} /> +3 Phút (Cả 2)
            </button>
            <button
              onClick={() => handleAddMinutes('both', 5)}
              style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.15)', color: '#F1F5F9', borderRadius: '6px', padding: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Plus size={12} /> +5 Phút (Cả 2)
            </button>
            <button
              onClick={handleSetUnlimited}
              style={{ backgroundColor: 'rgba(9, 143, 100, 0.25)', border: '1px solid #00df89', color: '#00df89', borderRadius: '6px', padding: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
            >
              ♾️ Không giới hạn
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.65rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '6px' }}>Đặt thời gian cụ thể (phút):</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#E2E8F0' }}>Host ({hostPieceLabel}):</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customHostMinutes}
                  onChange={(e) => setCustomHostMinutes(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '65px', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', borderRadius: '4px', padding: '4px 6px', fontSize: '0.8rem', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#E2E8F0' }}>Đối thủ ({guestPieceLabel}):</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customGuestMinutes}
                  onChange={(e) => setCustomGuestMinutes(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '65px', backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', borderRadius: '4px', padding: '4px 6px', fontSize: '0.8rem', textAlign: 'center' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
            <button
              onClick={() => setShowTimeModal(false)}
              style={{ flex: 1, backgroundColor: '#334155', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              Hủy
            </button>
            <button
              onClick={handleApplyCustomTime}
              style={{ flex: 1, backgroundColor: '#098f64', color: '#FFF', border: 'none', borderRadius: '6px', padding: '6px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Check size={14} /> Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
