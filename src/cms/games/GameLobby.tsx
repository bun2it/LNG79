import React, { useState, useEffect, useCallback } from 'react';
import { Swords, Plus, RefreshCw, Play, ArrowLeft, Trash2 } from 'lucide-react';
import { supabase } from '../../shared/supabase/supabase';
import { ChessBoardView } from './ChessBoardView';
import { XiangqiBoardView } from './XiangqiBoardView';
import { GoBoardView } from './GoBoardView';
import { GameControls } from './GameControls';
import { INITIAL_XIANGQI_FEN, XiangqiEngine } from './xiangqiEngine';
import { GoEngine } from './goEngine';
import { gameAudio } from './gameAudio';
import { Chess } from 'chess.js';

interface GameRoom {
  id: string;
  game_type: 'chess' | 'xiangqi' | 'go';
  room_name: string;
  time_limit_minutes: number;
  host_user_id: string;
  guest_user_id: string | null;
  status: 'waiting' | 'in_progress' | 'finished' | 'abandoned';
  fen: string;
  current_turn: 'white' | 'black' | 'red';
  host_time_remaining: number;
  guest_time_remaining: number;
  move_history: any[];
  winner_user_id: string | null;
  win_reason: string | null;
  draw_offered_by: string | null;
  rematch_requested_by: string | null;
  created_at: string;
  updated_at: string;
  host_profile?: { name?: string; email?: string; username?: string };
  guest_profile?: { name?: string; email?: string; username?: string };
}

interface GameLobbyProps {
  currentUserId?: string;
  currentUserName?: string;
}

export const GameLobby: React.FC<GameLobbyProps> = ({ currentUserId, currentUserName }) => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form states for creating room
  const [newGameType, setNewGameType] = useState<'chess' | 'xiangqi' | 'go'>('chess');
  const [newGoSize, setNewGoSize] = useState<19 | 13 | 9>(19);
  const [newRoomName, setNewRoomName] = useState('Bàn Cờ Thư Giãn #1');
  const [newTimeLimit, setNewTimeLimit] = useState(10);
  const [creatingLoading, setCreatingLoading] = useState(false);

  // Fetch rooms list
  const fetchRooms = useCallback(async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('game_rooms')
        .select(`
          *,
          host_profile:users!game_rooms_host_user_id_fkey(name, email, username),
          guest_profile:users!game_rooms_guest_user_id_fkey(name, email, username)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setRooms(data as unknown as GameRoom[]);
      }
    } catch (err) {
      console.error('Failed to fetch game rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load & periodic refresh
  useEffect(() => {
    void fetchRooms();
  }, [fetchRooms]);

  // Subscribe to realtime room list changes
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('public:game_rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms' },
        () => {
          void fetchRooms();
        }
      )
      .subscribe();

    return () => {
      const client = supabase;
      if (client) void client.removeChannel(channel);
    };
  }, [fetchRooms]);

  // Subscribe to active room changes
  useEffect(() => {
    if (!activeRoomId || !supabase) return;
    const client = supabase;

    const fetchSingleRoom = async () => {
      const { data, error } = await client
        .from('game_rooms')
        .select(`
          *,
          host_profile:users!game_rooms_host_user_id_fkey(name, email, username),
          guest_profile:users!game_rooms_guest_user_id_fkey(name, email, username)
        `)
        .eq('id', activeRoomId)
        .single();

      if (!error && data) {
        setActiveRoom(data as unknown as GameRoom);
      }
    };

    void fetchSingleRoom();

    const channel = client
      .channel(`game_room_${activeRoomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${activeRoomId}` },
        (payload) => {
          const updated = payload.new as GameRoom;
          setActiveRoom((prev) => (prev ? { ...prev, ...updated } : updated));
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [activeRoomId]);

  // Game clock countdown interval for active in_progress room
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'in_progress' || activeRoom.time_limit_minutes === 0) return;

    const timer = setInterval(() => {
      setActiveRoom((prev) => {
        if (!prev || prev.status !== 'in_progress') return prev;

        const isHostTurn =
          prev.game_type === 'chess'
            ? prev.current_turn === 'white'
            : prev.game_type === 'xiangqi'
            ? prev.current_turn === 'red'
            : prev.current_turn === 'black'; // In Go, Host is Black (plays first)

        let newHostTime = prev.host_time_remaining;
        let newGuestTime = prev.guest_time_remaining;

        if (isHostTurn) {
          newHostTime = Math.max(0, newHostTime - 1);
        } else {
          newGuestTime = Math.max(0, newGuestTime - 1);
        }

        // Handle timeout
        if (newHostTime === 0 || newGuestTime === 0) {
          const winnerId = newHostTime === 0 ? prev.guest_user_id : prev.host_user_id;
          void handleGameEnd(winnerId, 'Hết giờ (Timeout)');
        }

        return {
          ...prev,
          host_time_remaining: newHostTime,
          guest_time_remaining: newGuestTime,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRoom?.status, activeRoom?.current_turn]);

  // Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !currentUserId) return;

    try {
      setCreatingLoading(true);
      let initialFen = '';
      let initialTurn: 'white' | 'black' | 'red' = 'white';

      if (newGameType === 'chess') {
        initialFen = new Chess().fen();
        initialTurn = 'white';
      } else if (newGameType === 'xiangqi') {
        initialFen = INITIAL_XIANGQI_FEN;
        initialTurn = 'red';
      } else if (newGameType === 'go') {
        initialFen = GoEngine.initialFen(newGoSize);
        initialTurn = 'black'; // Black plays first in Go
      }

      const timeInSec = newTimeLimit > 0 ? newTimeLimit * 60 : 0;

      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          game_type: newGameType,
          room_name: newRoomName || `Bàn Cờ #${Math.floor(Math.random() * 1000)}`,
          time_limit_minutes: newTimeLimit,
          host_user_id: currentUserId,
          status: 'waiting',
          fen: initialFen,
          current_turn: initialTurn,
          host_time_remaining: timeInSec,
          guest_time_remaining: timeInSec,
          move_history: [],
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setIsCreating(false);
        setActiveRoomId(data.id);
        gameAudio.playGameStartSound();
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Không thể tạo phòng cờ, vui lòng thử lại.');
    } finally {
      setCreatingLoading(false);
    }
  };

  // Join Room (as Guest)
  const handleJoinRoom = async (room: GameRoom) => {
    if (!supabase || !currentUserId) return;

    // If I'm already host, just enter room
    if (room.host_user_id === currentUserId) {
      setActiveRoomId(room.id);
      return;
    }

    // If already has guest, just spectate/enter
    if (room.guest_user_id && room.guest_user_id !== currentUserId) {
      setActiveRoomId(room.id);
      return;
    }

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({
          guest_user_id: currentUserId,
          status: 'in_progress',
        })
        .eq('id', room.id);

      if (error) throw error;
      setActiveRoomId(room.id);
      gameAudio.playGameStartSound();
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  // Handle Move execution (Cờ Vua)
  const handleChessMove = async (from: string, to: string, promotion?: string) => {
    if (!activeRoom || !supabase) return;
    try {
      const game = new Chess(activeRoom.fen);
      const moveResult = game.move({ from, to, promotion });
      if (!moveResult) return;

      gameAudio.playMoveSound();

      const nextTurn = game.turn() === 'w' ? 'white' : 'black';
      let winnerId: string | null = null;
      let winReason: string | null = null;
      const isOver = game.isGameOver();

      if (isOver) {
        if (game.isCheckmate()) {
          winnerId = game.turn() === 'w' ? activeRoom.guest_user_id : activeRoom.host_user_id;
          winReason = 'Chiếu bí (Checkmate)';
          gameAudio.playVictorySound();
        } else if (game.isDraw()) {
          winReason = game.isStalemate() ? 'Hòa do hết nước đi (Stalemate)' : 'Hòa cờ';
        }
      } else if (game.inCheck()) {
        gameAudio.playCheckSound();
      }

      const updatedHistory = [
        ...activeRoom.move_history,
        {
          from,
          to,
          san: moveResult.san,
          notation: moveResult.san,
          piece: moveResult.piece,
          color: moveResult.color,
        },
      ];

      await supabase
        .from('game_rooms')
        .update({
          fen: game.fen(),
          current_turn: nextTurn,
          move_history: updatedHistory,
          status: isOver ? 'finished' : 'in_progress',
          winner_user_id: winnerId,
          win_reason: winReason,
          host_time_remaining: activeRoom.host_time_remaining,
          guest_time_remaining: activeRoom.guest_time_remaining,
          last_move_at: new Date().toISOString(),
        })
        .eq('id', activeRoom.id);
    } catch (err) {
      console.error('Error handling chess move:', err);
    }
  };

  // Handle Move execution (Cờ Tướng)
  const handleXiangqiMove = async (from: { x: number; y: number }, to: { x: number; y: number }) => {
    if (!activeRoom || !supabase) return;
    try {
      const engine = new XiangqiEngine(activeRoom.fen);
      const moveResult = engine.makeMove(from, to);
      if (!moveResult) return;

      gameAudio.playMoveSound();

      const nextTurn = engine.turn === 'r' ? 'red' : 'black';
      let winnerId: string | null = null;
      let winReason: string | null = null;
      const isOver = engine.isGameOver;

      if (isOver) {
        if (engine.winner === 'r') {
          winnerId = activeRoom.host_user_id;
          winReason = 'Chiếu bí (Checkmate)';
          gameAudio.playVictorySound();
        } else if (engine.winner === 'b') {
          winnerId = activeRoom.guest_user_id;
          winReason = 'Chiếu bí (Checkmate)';
          gameAudio.playVictorySound();
        } else {
          winReason = 'Hòa cờ';
        }
      } else if (engine.isCheck(engine.turn)) {
        gameAudio.playCheckSound();
      }

      const updatedHistory = [
        ...activeRoom.move_history,
        engine.moveHistory[engine.moveHistory.length - 1],
      ];

      await supabase
        .from('game_rooms')
        .update({
          fen: engine.toFen(),
          current_turn: nextTurn,
          move_history: updatedHistory,
          status: isOver ? 'finished' : 'in_progress',
          winner_user_id: winnerId,
          win_reason: winReason,
          host_time_remaining: activeRoom.host_time_remaining,
          guest_time_remaining: activeRoom.guest_time_remaining,
          last_move_at: new Date().toISOString(),
        })
        .eq('id', activeRoom.id);
    } catch (err) {
      console.error('Error handling xiangqi move:', err);
    }
  };

  // Handle Move execution (Cờ Vây)
  const handleGoMove = async (x: number, y: number) => {
    if (!activeRoom || !supabase) return;
    try {
      const engine = new GoEngine(activeRoom.fen);
      const moveResult = engine.play(x, y);
      if (!moveResult.valid) {
        if (moveResult.error) alert(moveResult.error);
        return;
      }

      gameAudio.playMoveSound();
      const nextTurn = engine.turn === 'B' ? 'black' : 'white';

      const colName = String.fromCharCode('A'.charCodeAt(0) + (x >= 8 ? x + 1 : x)); // Skip 'I'
      const rowName = engine.size - y;
      const notation = `${activeRoom.current_turn === 'black' ? '⚫' : '⚪'} ${colName}${rowName}${
        moveResult.captured.length > 0 ? ` (Ăn ${moveResult.captured.length})` : ''
      }`;

      const updatedHistory = [
        ...activeRoom.move_history,
        {
          x,
          y,
          notation,
          captured: moveResult.captured.length,
        },
      ];

      await supabase
        .from('game_rooms')
        .update({
          fen: engine.toFen(),
          current_turn: nextTurn,
          move_history: updatedHistory,
          status: 'in_progress',
          host_time_remaining: activeRoom.host_time_remaining,
          guest_time_remaining: activeRoom.guest_time_remaining,
          last_move_at: new Date().toISOString(),
        })
        .eq('id', activeRoom.id);
    } catch (err) {
      console.error('Error handling go move:', err);
    }
  };

  // Handle Pass Turn (Cờ Vây)
  const handleGoPass = async () => {
    if (!activeRoom || !supabase) return;
    try {
      const engine = new GoEngine(activeRoom.fen);
      const { isGameOver } = engine.pass();

      gameAudio.playCheckSound();
      const nextTurn = engine.turn === 'B' ? 'black' : 'white';

      const updatedHistory = [
        ...activeRoom.move_history,
        {
          notation: `${activeRoom.current_turn === 'black' ? '⚫' : '⚪'} Bỏ lượt (Pass)`,
        },
      ];

      let winnerId: string | null = null;
      let winReason: string | null = null;

      if (isGameOver) {
        const score = engine.estimateScore();
        winnerId = score.winner === 'B' ? activeRoom.host_user_id : activeRoom.guest_user_id;
        winReason = `Cả 2 bên bỏ lượt - Tính điểm lãnh thổ: Đen ${score.scoreB} vs Trắng ${score.scoreW} (+6.5 Komi)`;
        gameAudio.playVictorySound();
      }

      await supabase
        .from('game_rooms')
        .update({
          fen: engine.toFen(),
          current_turn: nextTurn,
          move_history: updatedHistory,
          status: isGameOver ? 'finished' : 'in_progress',
          winner_user_id: winnerId,
          win_reason: winReason,
          host_time_remaining: activeRoom.host_time_remaining,
          guest_time_remaining: activeRoom.guest_time_remaining,
          last_move_at: new Date().toISOString(),
        })
        .eq('id', activeRoom.id);
    } catch (err) {
      console.error('Error handling go pass:', err);
    }
  };

  // Handle Resign
  const handleResign = async () => {
    if (!activeRoom || !supabase || !currentUserId) return;
    if (!confirm('Bạn có chắc chắn muốn đầu hàng ván cờ này?')) return;

    const winnerId = currentUserId === activeRoom.host_user_id ? activeRoom.guest_user_id : activeRoom.host_user_id;
    await handleGameEnd(winnerId, 'Đối thủ đầu hàng (Resignation)');
  };

  // Handle Game End helper
  const handleGameEnd = async (winnerId: string | null, reason: string) => {
    if (!activeRoom || !supabase) return;
    await supabase
      .from('game_rooms')
      .update({
        status: 'finished',
        winner_user_id: winnerId,
        win_reason: reason,
      })
      .eq('id', activeRoom.id);
  };

  // Handle Offer Draw
  const handleOfferDraw = async () => {
    if (!activeRoom || !supabase || !currentUserId) return;
    await supabase
      .from('game_rooms')
      .update({ draw_offered_by: currentUserId })
      .eq('id', activeRoom.id);
  };

  // Handle Accept Draw
  const handleAcceptDraw = async () => {
    if (!activeRoom || !supabase) return;
    await handleGameEnd(null, 'Đồng ý hòa (Draw)');
  };

  // Handle Rematch
  const handleRematch = async () => {
    if (!activeRoom || !supabase || !currentUserId) return;
    let initialFen = '';
    let initialTurn: 'white' | 'black' | 'red' = 'white';

    if (activeRoom.game_type === 'chess') {
      initialFen = new Chess().fen();
      initialTurn = 'white';
    } else if (activeRoom.game_type === 'xiangqi') {
      initialFen = INITIAL_XIANGQI_FEN;
      initialTurn = 'red';
    } else if (activeRoom.game_type === 'go') {
      const oldEngine = new GoEngine(activeRoom.fen);
      initialFen = GoEngine.initialFen(oldEngine.size);
      initialTurn = 'black';
    }

    const timeInSec = activeRoom.time_limit_minutes > 0 ? activeRoom.time_limit_minutes * 60 : 0;

    await supabase
      .from('game_rooms')
      .update({
        fen: initialFen,
        current_turn: initialTurn,
        status: 'in_progress',
        winner_user_id: null,
        win_reason: null,
        draw_offered_by: null,
        rematch_requested_by: null,
        host_time_remaining: timeInSec,
        guest_time_remaining: timeInSec,
        move_history: [],
      })
      .eq('id', activeRoom.id);
  };

  // Determine user role in active room
  const myRole: 'host' | 'guest' | 'spectator' =
    activeRoom?.host_user_id === currentUserId
      ? 'host'
      : activeRoom?.guest_user_id === currentUserId
      ? 'guest'
      : 'spectator';

  const myChessColor = myRole === 'host' ? 'white' : myRole === 'guest' ? 'black' : 'spectator';
  const myXiangqiColor = myRole === 'host' ? 'red' : myRole === 'guest' ? 'black' : 'spectator';
  const myGoColor = myRole === 'host' ? 'black' : myRole === 'guest' ? 'white' : 'spectator';

  const isMyTurn =
    activeRoom?.status === 'in_progress' &&
    ((activeRoom.game_type === 'chess' &&
      ((myRole === 'host' && activeRoom.current_turn === 'white') ||
        (myRole === 'guest' && activeRoom.current_turn === 'black'))) ||
      (activeRoom.game_type === 'xiangqi' &&
        ((myRole === 'host' && activeRoom.current_turn === 'red') ||
          (myRole === 'guest' && activeRoom.current_turn === 'black'))) ||
      (activeRoom.game_type === 'go' &&
        ((myRole === 'host' && activeRoom.current_turn === 'black') ||
          (myRole === 'guest' && activeRoom.current_turn === 'white'))));

  const handleExitRoom = () => {
    setActiveRoomId(null);
    setActiveRoom(null);
    void fetchRooms();
  };

  const handleDeleteRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa bàn cờ này?')) return;
    if (!supabase) return;
    try {
      const { error } = await supabase.from('game_rooms').delete().eq('id', roomId);
      if (error) throw error;
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (activeRoomId === roomId) {
        setActiveRoomId(null);
        setActiveRoom(null);
      }
    } catch (err) {
      console.error('Failed to delete room:', err);
      alert('Không thể xóa bàn cờ.');
    }
  };

  const handleAdjustTime = async (newHostSeconds: number, newGuestSeconds: number, newLimitMinutes?: number) => {
    if (!activeRoomId || !activeRoom || !supabase) return;
    try {
      const updates: any = {
        host_time_remaining: Math.max(0, newHostSeconds),
        guest_time_remaining: Math.max(0, newGuestSeconds),
      };
      if (newLimitMinutes !== undefined) {
        updates.time_limit_minutes = newLimitMinutes;
      }
      const { error } = await supabase.from('game_rooms').update(updates).eq('id', activeRoomId);
      if (error) throw error;

      setActiveRoom((prev) => (prev ? { ...prev, ...updates } : null));

      // Broadcast chat announcement
      const channel = supabase.channel(`game_chat_${activeRoomId}`);
      void channel.send({
        type: 'broadcast',
        event: 'chat_msg',
        payload: {
          id: Math.random().toString(),
          sender_id: 'system',
          sender_name: 'Hệ Thống',
          message: `⏱️ Đã cập nhật thời gian thi đấu (${newLimitMinutes === 0 ? 'Chế độ Không giới hạn' : `Trắng/Đỏ/Đen: ${Math.floor(newHostSeconds / 60)}p vs ${Math.floor(newGuestSeconds / 60)}p`})`,
          created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      });
    } catch (err) {
      console.error('Failed to adjust time:', err);
    }
  };

  // --- ACTIVE ROOM VIEW ---
  if (activeRoomId && activeRoom) {
    const hostName = activeRoom.host_profile?.name || activeRoom.host_profile?.username || 'Host';
    const guestName = activeRoom.guest_profile?.name || activeRoom.guest_profile?.username || (activeRoom.guest_user_id ? 'Đối thủ' : undefined);
    const winnerName =
      activeRoom.winner_user_id === activeRoom.host_user_id
        ? hostName
        : activeRoom.winner_user_id === activeRoom.guest_user_id
        ? guestName
        : undefined;

    const lastMove =
      activeRoom.move_history.length > 0
        ? activeRoom.move_history[activeRoom.move_history.length - 1]
        : null;

    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 'calc(100vh - 110px)',
          minHeight: '660px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#0A0F1D',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Left Game Viewport: occupies remaining width (full screen - 340px) */}
        <div
          style={{
            flex: '1 1 0',
            width: 'calc(100% - 340px)',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top-left Floating Back Button */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '6px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <button
              onClick={handleExitRoom}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F1F5F9',
                borderRadius: '6px',
                padding: '0.4rem 0.8rem',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.8rem',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowLeft size={14} /> Sảnh Cờ
            </button>
            <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
              Vai trò: <strong style={{ color: '#00df89' }}>{myRole === 'host' ? 'Chủ phòng (Host)' : myRole === 'guest' ? 'Đối thủ (Guest)' : 'Khán giả'}</strong>
            </span>
          </div>

          {/* Full-width 3D Canvas / 2D Board Layer */}
          <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}>
            {activeRoom.game_type === 'chess' ? (
              <ChessBoardView
                fen={activeRoom.fen}
                myColor={myChessColor}
                isMyTurn={isMyTurn}
                onMove={handleChessMove}
                lastMove={lastMove}
                disabled={activeRoom.status !== 'in_progress'}
              />
            ) : activeRoom.game_type === 'xiangqi' ? (
              <XiangqiBoardView
                fen={activeRoom.fen}
                myColor={myXiangqiColor}
                isMyTurn={isMyTurn}
                onMove={handleXiangqiMove}
                lastMove={lastMove}
                disabled={activeRoom.status !== 'in_progress'}
              />
            ) : (
              <GoBoardView
                fen={activeRoom.fen}
                myColor={myGoColor}
                isMyTurn={isMyTurn}
                onMove={handleGoMove}
                onPass={handleGoPass}
                lastMove={lastMove}
                disabled={activeRoom.status !== 'in_progress'}
              />
            )}
          </div>
        </div>

        {/* Right Docked Sidebar: GameControls with Live Chat & Moves History */}
        <div
          style={{
            width: '340px',
            flex: '0 0 340px',
            height: '100%',
            backgroundColor: '#111827',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10,
          }}
        >
          <GameControls
            roomId={activeRoom.id}
            gameType={activeRoom.game_type}
            roomName={activeRoom.room_name}
            hostName={hostName}
            guestName={guestName}
            myRole={myRole}
            currentTurn={activeRoom.current_turn}
            status={activeRoom.status}
            winnerName={winnerName}
            winReason={activeRoom.win_reason}
            timeLimitMinutes={activeRoom.time_limit_minutes}
            hostTimeRemaining={activeRoom.host_time_remaining}
            guestTimeRemaining={activeRoom.guest_time_remaining}
            moveHistory={activeRoom.move_history}
            drawOfferedBy={activeRoom.draw_offered_by}
            rematchRequestedBy={activeRoom.rematch_requested_by}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onOfferDraw={handleOfferDraw}
            onAcceptDraw={handleAcceptDraw}
            onResign={handleResign}
            onRequestRematch={handleRematch}
            onLeaveRoom={handleExitRoom}
            onAdjustTime={handleAdjustTime}
            onPassTurn={activeRoom.game_type === 'go' ? handleGoPass : undefined}
          />
        </div>
      </div>
    );
  }

  // --- LOBBY LIST VIEW ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Lobby Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: '#1E293B',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Swords size={24} color="#00df89" /> Khu Giải Trí & Kỳ Đài (Game Lounge)
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>
            Giao lưu, thi đấu Cờ Vua, Cờ Tướng & Cờ Vây trực tuyến thời gian thực giữa các thành viên CMS.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => fetchRooms()}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#334155',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F1F5F9',
              borderRadius: '8px',
              padding: '0.55rem 1rem',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85rem',
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
          <button
            onClick={() => setIsCreating(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#098f64',
              border: 'none',
              color: '#FFF',
              borderRadius: '8px',
              padding: '0.55rem 1.25rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(9, 143, 100, 0.3)',
            }}
          >
            <Plus size={16} /> Tạo Bàn Cờ Mới
          </button>
        </div>
      </div>

      {/* Create Room Modal / Drawer */}
      {isCreating && (
        <div
          style={{
            backgroundColor: '#0F172A',
            borderRadius: '12px',
            border: '2px solid #098f64',
            padding: '1.5rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', color: '#F1F5F9', fontSize: '1.15rem' }}>
            Tạo Bàn Cờ Thi Đấu Mới
          </h3>

          <form onSubmit={handleCreateRoom} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>
                Loại Cờ:
              </label>
              <select
                value={newGameType}
                onChange={(e) => setNewGameType(e.target.value as 'chess' | 'xiangqi' | 'go')}
                style={{
                  width: '100%',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: '6px',
                  padding: '0.6rem',
                  fontSize: '0.9rem',
                }}
              >
                <option value="chess">♟️ Cờ Vua Quốc Tế (Chess)</option>
                <option value="xiangqi">🀄 Cờ Tướng Cổ Truyền (Xiangqi)</option>
                <option value="go">⚪⚫ Cờ Vây (Weiqi / Go)</option>
              </select>
            </div>

            {newGameType === 'go' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>
                  Kích Thước Bàn Cờ Vây:
                </label>
                <select
                  value={newGoSize}
                  onChange={(e) => setNewGoSize(Number(e.target.value) as 19 | 13 | 9)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    borderRadius: '6px',
                    padding: '0.6rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value={19}>19 x 19 (Tiêu Chuẩn Thi Đấu Quốc Tế)</option>
                  <option value={13}>13 x 13 (Trung Bình - Luyện Tập)</option>
                  <option value={9}>9 x 9 (Nhanh - Nhập Môn)</option>
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>
                Tên Bàn Cờ:
              </label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="VD: Cao thủ đàm đạo #1"
                required
                style={{
                  width: '100%',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: '6px',
                  padding: '0.6rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '4px' }}>
                Thời Gian Mỗi Bên:
              </label>
              <select
                value={newTimeLimit}
                onChange={(e) => setNewTimeLimit(Number(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: '6px',
                  padding: '0.6rem',
                  fontSize: '0.9rem',
                }}
              >
                <option value={0}>♾️ Không giới hạn thời gian (Đánh tự do)</option>
                <option value={5}>⚡ 5 Phút (Cờ Chớp)</option>
                <option value={10}>⏱️ 10 Phút (Tiêu Chuẩn)</option>
                <option value={15}>⏳ 15 Phút</option>
                <option value={30}>☕ 30 Phút (Cờ Chậm)</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                style={{
                  backgroundColor: '#334155',
                  color: '#E2E8F0',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={creatingLoading}
                style={{
                  backgroundColor: '#098f64',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1.5rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {creatingLoading ? 'Đang tạo…' : 'Xác Nhận Tạo Bàn'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Room Grid List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
          Đang tải danh sách bàn cờ…
        </div>
      ) : rooms.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem',
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.1)',
          }}
        >
          <Swords size={40} color="#64748B" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ margin: 0, color: '#F1F5F9', fontSize: '1.1rem' }}>Chưa có bàn cờ nào đang hoạt động</h4>
          <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px' }}>
            Hãy bấm nút <strong>"Tạo Bàn Cờ Mới"</strong> ở góc trên để mở bàn và so tài cùng đồng nghiệp!
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {rooms.map((room) => {
            const hostName = room.host_profile?.name || room.host_profile?.username || 'Host';
            const guestName = room.guest_profile?.name || room.guest_profile?.username || (room.guest_user_id ? 'Đối thủ' : undefined);
            const isWaiting = room.status === 'waiting';
            const isInProgress = room.status === 'in_progress';

            const gameTypeLabel =
              room.game_type === 'chess'
                ? '♟️ Cờ Vua'
                : room.game_type === 'xiangqi'
                ? '🀄 Cờ Tướng'
                : '⚪⚫ Cờ Vây';

            return (
              <div
                key={room.id}
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
              >
                {/* Header card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#F1F5F9', fontSize: '1rem' }}>{room.room_name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      {gameTypeLabel} • {room.time_limit_minutes === 0 ? '♾️ Không giới hạn' : `${room.time_limit_minutes} Phút`}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                      backgroundColor: isWaiting
                        ? 'rgba(234, 179, 8, 0.2)'
                        : isInProgress
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(100, 116, 139, 0.2)',
                      color: isWaiting ? '#FDE047' : isInProgress ? '#34D399' : '#94A3B8',
                    }}
                  >
                    {isWaiting ? 'Chờ đối thủ' : isInProgress ? 'Đang thi đấu' : 'Đã kết thúc'}
                  </span>
                </div>

                {/* Players info */}
                <div style={{ backgroundColor: '#0F172A', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E2E8F0' }}>
                    <span>🔴 {room.game_type === 'chess' ? 'Trắng' : room.game_type === 'xiangqi' ? 'Đỏ' : 'Đen'} (Host):</span>
                    <strong>{hostName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>⚪ {room.game_type === 'go' ? 'Trắng' : 'Đen'} (Guest):</span>
                    <strong>{guestName || '— (Trống)'}</strong>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                  <button
                    onClick={() => handleJoinRoom(room)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: isWaiting ? '#098f64' : '#334155',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Play size={14} />
                    {room.host_user_id === currentUserId
                      ? 'Vào Lại Bàn'
                      : room.guest_user_id === currentUserId
                      ? 'Vào Lại Bàn'
                      : isWaiting
                      ? 'Tham Gia Đấu'
                      : 'Vào Xem (Khán Giả)'}
                  </button>

                  {room.host_user_id === currentUserId && (
                    <button
                      onClick={(e) => handleDeleteRoom(room.id, e)}
                      title="Xóa bàn cờ này"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
