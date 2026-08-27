// Xiangqi (Chinese Chess / Cờ Tướng) Complete Rule Engine in TypeScript
// Standard 9x10 board, FEN support, move validation, check/checkmate detection

export type XiangqiColor = 'r' | 'b'; // 'r' = Red (Đỏ - đi trước), 'b' = Black (Đen)
export type XiangqiPieceType = 'k' | 'a' | 'e' | 'h' | 'r' | 'c' | 'p'; // King/Advisor/Elephant/Horse/Rook/Cannon/Pawn

export interface XiangqiPiece {
  type: XiangqiPieceType;
  color: XiangqiColor;
}

export interface XiangqiMove {
  from: { x: number; y: number }; // x: 0..8, y: 0..9
  to: { x: number; y: number };
  piece: XiangqiPiece;
  captured?: XiangqiPiece;
  notation?: string;
}

export const INITIAL_XIANGQI_FEN = 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r - - 0 1';

export class XiangqiEngine {
  public board: (XiangqiPiece | null)[][] = []; // 10 rows (y=0..9), 9 columns (x=0..8)
  public turn: XiangqiColor = 'r';
  public moveHistory: XiangqiMove[] = [];
  public isGameOver: boolean = false;
  public winner: XiangqiColor | 'draw' | null = null;
  public winReason: string | null = null;

  constructor(fen: string = INITIAL_XIANGQI_FEN) {
    this.loadFen(fen);
  }

  // Load board from FEN
  public loadFen(fen: string): void {
    this.board = Array(10).fill(null).map(() => Array(9).fill(null));
    const parts = fen.trim().split(' ');
    const rows = parts[0].split('/');

    const ALIAS_MAP: Record<string, XiangqiPieceType> = {
      k: 'k', g: 'k', t: 'k',
      a: 'a', s: 'a',
      e: 'e', b: 'e',
      h: 'h', n: 'h', m: 'h',
      r: 'r', x: 'r',
      c: 'c',
      p: 'p',
    };

    for (let y = 0; y < 10; y++) {
      if (!rows[y]) continue;
      let x = 0;
      for (const char of rows[y]) {
        if (/\d/.test(char)) {
          x += parseInt(char, 10);
        } else {
          const isUpper = char === char.toUpperCase();
          const color: XiangqiColor = isUpper ? 'r' : 'b';
          const rawChar = char.toLowerCase();
          const type = ALIAS_MAP[rawChar] || 'p';
          if (x < 9) {
            this.board[y][x] = { type, color };
            x++;
          }
        }
      }
    }

    this.turn = (parts[1] === 'b' ? 'b' : 'r') as XiangqiColor;
    this.checkGameStatus();
  }

  // Export board to standard FEN
  public toFen(): string {
    const rowStrs: string[] = [];
    for (let y = 0; y < 10; y++) {
      let rowStr = '';
      let emptyCount = 0;
      for (let x = 0; x < 9; x++) {
        const piece = this.board[y][x];
        if (!piece) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            rowStr += emptyCount.toString();
            emptyCount = 0;
          }
          const char = piece.type;
          rowStr += piece.color === 'r' ? char.toUpperCase() : char.toLowerCase();
        }
      }
      if (emptyCount > 0) {
        rowStr += emptyCount.toString();
      }
      rowStrs.push(rowStr);
    }
    return `${rowStrs.join('/')} ${this.turn} - - 0 ${Math.floor(this.moveHistory.length / 2) + 1}`;
  }

  public getPiece(x: number, y: number): XiangqiPiece | null {
    if (x < 0 || x > 8 || y < 0 || y > 9) return null;
    return this.board[y][x];
  }

  // Check if position is inside the Palace (Cửu Cung)
  public static isInsidePalace(x: number, y: number, color: XiangqiColor): boolean {
    if (x < 3 || x > 5) return false;
    if (color === 'b') {
      return y >= 0 && y <= 2;
    } else {
      return y >= 7 && y <= 9;
    }
  }

  // Generate pseudo-legal moves for a piece at (x, y)
  public getPseudoMoves(x: number, y: number): { x: number; y: number }[] {
    const piece = this.getPiece(x, y);
    if (!piece) return [];
    const moves: { x: number; y: number }[] = [];
    const { type, color } = piece;

    const addIfValid = (tx: number, ty: number) => {
      if (tx < 0 || tx > 8 || ty < 0 || ty > 9) return;
      const target = this.getPiece(tx, ty);
      if (!target || target.color !== color) {
        moves.push({ x: tx, y: ty });
      }
    };

    switch (type) {
      // TƯỚNG (King)
      case 'k': {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
          const nx = x + dx;
          const ny = y + dy;
          if (XiangqiEngine.isInsidePalace(nx, ny, color)) {
            addIfValid(nx, ny);
          }
        }
        break;
      }

      // SĨ (Advisor)
      case 'a': {
        const diagDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [dx, dy] of diagDirs) {
          const nx = x + dx;
          const ny = y + dy;
          if (XiangqiEngine.isInsidePalace(nx, ny, color)) {
            addIfValid(nx, ny);
          }
        }
        break;
      }

      // TƯỢNG (Elephant / Minister)
      case 'e': {
        const elephantSteps = [
          { to: [2, 2], eye: [1, 1] },
          { to: [2, -2], eye: [1, -1] },
          { to: [-2, 2], eye: [-1, 1] },
          { to: [-2, -2], eye: [-1, -1] },
        ];
        for (const step of elephantSteps) {
          const tx = x + step.to[0];
          const ty = y + step.to[1];
          const eyex = x + step.eye[0];
          const eyey = y + step.eye[1];

          // Cannot cross river (Red river boundary: y >= 5; Black river boundary: y <= 4)
          if (color === 'r' && ty < 5) continue;
          if (color === 'b' && ty > 4) continue;
          if (tx < 0 || tx > 8 || ty < 0 || ty > 9) continue;

          // Check elephant eye block (cản mắt tượng)
          if (!this.getPiece(eyex, eyey)) {
            addIfValid(tx, ty);
          }
        }
        break;
      }

      // MÃ (Horse / Knight)
      case 'h': {
        const horseSteps = [
          { to: [1, 2], leg: [0, 1] },
          { to: [-1, 2], leg: [0, 1] },
          { to: [1, -2], leg: [0, -1] },
          { to: [-1, -2], leg: [0, -1] },
          { to: [2, 1], leg: [1, 0] },
          { to: [2, -1], leg: [1, 0] },
          { to: [-2, 1], leg: [-1, 0] },
          { to: [-2, -1], leg: [-1, 0] },
        ];
        for (const step of horseSteps) {
          const tx = x + step.to[0];
          const ty = y + step.to[1];
          const legx = x + step.leg[0];
          const legy = y + step.leg[1];

          if (tx < 0 || tx > 8 || ty < 0 || ty > 9) continue;
          // Check horse leg block (cản chân mã)
          if (!this.getPiece(legx, legy)) {
            addIfValid(tx, ty);
          }
        }
        break;
      }

      // XE (Rook / Chariot)
      case 'r': {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
          let step = 1;
          while (true) {
            const tx = x + dx * step;
            const ty = y + dy * step;
            if (tx < 0 || tx > 8 || ty < 0 || ty > 9) break;
            const target = this.getPiece(tx, ty);
            if (!target) {
              moves.push({ x: tx, y: ty });
            } else {
              if (target.color !== color) {
                moves.push({ x: tx, y: ty });
              }
              break; // Blocked
            }
            step++;
          }
        }
        break;
      }

      // PHÁO (Cannon)
      case 'c': {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
          let step = 1;
          let jumped = false;
          while (true) {
            const tx = x + dx * step;
            const ty = y + dy * step;
            if (tx < 0 || tx > 8 || ty < 0 || ty > 9) break;
            const target = this.getPiece(tx, ty);

            if (!jumped) {
              if (!target) {
                moves.push({ x: tx, y: ty }); // Normal move
              } else {
                jumped = true; // Found the platform / screen (ngòi)
              }
            } else {
              if (target) {
                if (target.color !== color) {
                  moves.push({ x: tx, y: ty }); // Capture after jump
                }
                break; // Stop after first piece behind platform
              }
            }
            step++;
          }
        }
        break;
      }

      // TỐT / BINH (Pawn / Soldier)
      case 'p': {
        const forward = color === 'r' ? -1 : 1;
        // Move forward
        const fy = y + forward;
        if (fy >= 0 && fy <= 9) {
          addIfValid(x, fy);
        }

        // Check if crossed the river (Red: y <= 4; Black: y >= 5)
        const crossedRiver = color === 'r' ? y <= 4 : y >= 5;
        if (crossedRiver) {
          // Can move horizontal (left/right)
          addIfValid(x - 1, y);
          addIfValid(x + 1, y);
        }
        break;
      }
    }

    return moves;
  }

  // Find position of the General/King
  public findKing(color: XiangqiColor): { x: number; y: number } | null {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = this.board[y][x];
        if (piece && piece.type === 'k' && piece.color === color) {
          return { x, y };
        }
      }
    }
    return null;
  }

  // Check if two Kings are facing each other with no pieces in between (Flying General rule)
  public isFlyingGeneral(): boolean {
    const redKing = this.findKing('r');
    const blackKing = this.findKing('b');
    if (!redKing || !blackKing) return false;

    if (redKing.x === blackKing.x) {
      const x = redKing.x;
      const minY = Math.min(redKing.y, blackKing.y);
      const maxY = Math.max(redKing.y, blackKing.y);
      let countBetween = 0;
      for (let y = minY + 1; y < maxY; y++) {
        if (this.board[y][x]) {
          countBetween++;
          break;
        }
      }
      return countBetween === 0;
    }
    return false;
  }

  // Check if a color is currently in check
  public isCheck(color: XiangqiColor): boolean {
    const kingPos = this.findKing(color);
    if (!kingPos) return true;

    // Check flying general
    if (this.isFlyingGeneral()) return true;

    const opponentColor: XiangqiColor = color === 'r' ? 'b' : 'r';

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = this.board[y][x];
        if (piece && piece.color === opponentColor) {
          const pseudoMoves = this.getPseudoMoves(x, y);
          if (pseudoMoves.some((m) => m.x === kingPos.x && m.y === kingPos.y)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Get strictly legal moves for a piece (that don't leave own King in check)
  public getLegalMoves(x: number, y: number): { x: number; y: number }[] {
    const piece = this.getPiece(x, y);
    if (!piece || piece.color !== this.turn) return [];

    const pseudoMoves = this.getPseudoMoves(x, y);
    const legalMoves: { x: number; y: number }[] = [];

    for (const move of pseudoMoves) {
      // Simulate move
      const targetPiece = this.board[move.y][move.x];
      this.board[move.y][move.x] = piece;
      this.board[y][x] = null;

      const inCheck = this.isCheck(piece.color);

      // Revert move
      this.board[y][x] = piece;
      this.board[move.y][move.x] = targetPiece;

      if (!inCheck) {
        legalMoves.push(move);
      }
    }

    return legalMoves;
  }

  // Generate all legal moves for the current player
  public getAllLegalMoves(color: XiangqiColor = this.turn): XiangqiMove[] {
    const allMoves: XiangqiMove[] = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const piece = this.board[y][x];
        if (piece && piece.color === color) {
          const legalDestinations = this.getLegalMoves(x, y);
          for (const dest of legalDestinations) {
            allMoves.push({
              from: { x, y },
              to: dest,
              piece,
              captured: this.board[dest.y][dest.x] || undefined,
            });
          }
        }
      }
    }
    return allMoves;
  }

  // Make a move
  public makeMove(from: { x: number; y: number }, to: { x: number; y: number }): boolean {
    if (this.isGameOver) return false;
    const piece = this.getPiece(from.x, from.y);
    if (!piece || piece.color !== this.turn) return false;

    const legalMoves = this.getLegalMoves(from.x, from.y);
    const isValid = legalMoves.some((m) => m.x === to.x && m.y === to.y);
    if (!isValid) return false;

    const captured = this.board[to.y][to.x] || undefined;
    this.board[to.y][to.x] = piece;
    this.board[from.y][from.x] = null;

    const notation = this.generateNotation(piece, from, to, !!captured);

    this.moveHistory.push({
      from,
      to,
      piece,
      captured,
      notation,
    });

    // Switch turn
    this.turn = this.turn === 'r' ? 'b' : 'r';
    this.checkGameStatus();
    return true;
  }

  // Check checkmate / stalemate
  private checkGameStatus(): void {
    const legalMoves = this.getAllLegalMoves(this.turn);
    if (legalMoves.length === 0) {
      this.isGameOver = true;
      const inCheck = this.isCheck(this.turn);
      if (inCheck) {
        this.winner = this.turn === 'r' ? 'b' : 'r';
        this.winReason = 'checkmate';
      } else {
        this.winner = 'draw';
        this.winReason = 'stalemate';
      }
    }
  }

  // Notation helper (Vietnamese / Standard Xiangqi move notation)
  private generateNotation(piece: XiangqiPiece, from: { x: number; y: number }, to: { x: number; y: number }, _isCapture: boolean): string {
    const PIECE_NAMES: Record<XiangqiPieceType, { r: string; b: string }> = {
      k: { r: 'Tướng', b: 'Tướng' },
      a: { r: 'Sĩ', b: 'Sĩ' },
      e: { r: 'Tượng', b: 'Tượng' },
      h: { r: 'Mã', b: 'Mã' },
      r: { r: 'Xe', b: 'Xe' },
      c: { r: 'Pháo', b: 'Pháo' },
      p: { r: 'Binh', b: 'Tốt' },
    };
    const pName = PIECE_NAMES[piece.type][piece.color];
    const fromCol = piece.color === 'r' ? 9 - from.x : from.x + 1;
    const toCol = piece.color === 'r' ? 9 - to.x : to.x + 1;

    if (from.y === to.y) {
      return `${pName} ${fromCol} Bình ${toCol}`;
    }
    const isAdvancing = piece.color === 'r' ? to.y < from.y : to.y > from.y;
    const action = isAdvancing ? 'Tấn' : 'Thoái';
    const dist = Math.abs(to.y - from.y);

    if (['h', 'e', 'a'].includes(piece.type)) {
      return `${pName} ${fromCol} ${action} ${toCol}`;
    }
    return `${pName} ${fromCol} ${action} ${dist}`;
  }
}
