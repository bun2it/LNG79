export type GoColor = 'B' | 'W';
export type GoPoint = { x: number; y: number };

export interface GoMoveResult {
  valid: boolean;
  captured: GoPoint[];
  error?: string;
  isPass?: boolean;
}

export class GoEngine {
  public size: number;
  public turn: GoColor;
  public grid: (GoColor | null)[][];
  public capturesB: number;
  public capturesW: number;
  public consecutivePasses: number;
  public koPoint: GoPoint | null;
  public moveHistory: string[];

  constructor(fenOrSize: string | number = 19) {
    if (typeof fenOrSize === 'number') {
      this.size = [9, 13, 19].includes(fenOrSize) ? fenOrSize : 19;
      this.turn = 'B';
      this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(null));
      this.capturesB = 0;
      this.capturesW = 0;
      this.consecutivePasses = 0;
      this.koPoint = null;
      this.moveHistory = [];
    } else {
      this.size = 19;
      this.turn = 'B';
      this.grid = Array.from({ length: 19 }, () => Array(19).fill(null));
      this.capturesB = 0;
      this.capturesW = 0;
      this.consecutivePasses = 0;
      this.koPoint = null;
      this.moveHistory = [];
      this.loadFen(fenOrSize);
    }
  }

  // Initial standard FEN generator
  public static initialFen(size: number = 19): string {
    const s = [9, 13, 19].includes(size) ? size : 19;
    const boardStr = '.'.repeat(s * s);
    return `${s}:B:0:0:0:${boardStr}:-`;
  }

  // Serialize to FEN string: "size:turn:passes:capB:capW:boardStr:ko"
  public toFen(): string {
    let boardStr = '';
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const cell = this.grid[y][x];
        boardStr += cell === 'B' ? 'B' : cell === 'W' ? 'W' : '.';
      }
    }
    const koStr = this.koPoint ? `${this.koPoint.x},${this.koPoint.y}` : '-';
    return `${this.size}:${this.turn}:${this.consecutivePasses}:${this.capturesB}:${this.capturesW}:${boardStr}:${koStr}`;
  }

  // Load from FEN string
  public loadFen(fen: string): void {
    if (!fen || typeof fen !== 'string') return;
    const parts = fen.split(':');
    if (parts.length < 6) return;

    this.size = parseInt(parts[0], 10) || 19;
    this.turn = parts[1] === 'W' ? 'W' : 'B';
    this.consecutivePasses = parseInt(parts[2], 10) || 0;
    this.capturesB = parseInt(parts[3], 10) || 0;
    this.capturesW = parseInt(parts[4], 10) || 0;

    const boardStr = parts[5] || '';
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(null));

    let idx = 0;
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (idx < boardStr.length) {
          const char = boardStr[idx++];
          if (char === 'B') this.grid[y][x] = 'B';
          else if (char === 'W') this.grid[y][x] = 'W';
        }
      }
    }

    if (parts[6] && parts[6] !== '-') {
      const [kx, ky] = parts[6].split(',').map((v) => parseInt(v, 10));
      if (!isNaN(kx) && !isNaN(ky)) {
        this.koPoint = { x: kx, y: ky };
      } else {
        this.koPoint = null;
      }
    } else {
      this.koPoint = null;
    }
  }

  public get(x: number, y: number): GoColor | null {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return null;
    return this.grid[y][x];
  }

  // Get neighboring points
  private getNeighbors(x: number, y: number): GoPoint[] {
    const neighbors: GoPoint[] = [];
    const deltas = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];
    for (const { dx, dy } of deltas) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    return neighbors;
  }

  // Find all stones in a connected group and its liberties
  public getGroup(
    startX: number,
    startY: number,
    tempGrid?: (GoColor | null)[][]
  ): { stones: GoPoint[]; liberties: Set<string> } {
    const grid = tempGrid || this.grid;
    const color = grid[startY][startX];
    if (!color) return { stones: [], liberties: new Set() };

    const stones: GoPoint[] = [];
    const visited = new Set<string>();
    const liberties = new Set<string>();
    const queue: GoPoint[] = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
      const pt = queue.shift()!;
      stones.push(pt);

      for (const n of this.getNeighbors(pt.x, pt.y)) {
        const nKey = `${n.x},${n.y}`;
        const nColor = grid[n.y][n.x];

        if (nColor === null) {
          liberties.add(nKey);
        } else if (nColor === color && !visited.has(nKey)) {
          visited.add(nKey);
          queue.push(n);
        }
      }
    }

    return { stones, liberties };
  }

  // Validate and execute a stone placement
  public play(x: number, y: number): GoMoveResult {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      return { valid: false, captured: [], error: 'Nước đi ngoài bàn cờ' };
    }

    if (this.grid[y][x] !== null) {
      return { valid: false, captured: [], error: 'Vị trí này đã có quân' };
    }

    // Check Ko rule
    if (this.koPoint && this.koPoint.x === x && this.koPoint.y === y) {
      return { valid: false, captured: [], error: 'Phạm luật Cướp Cò (Ko Rule) - Không được lặp lại ngay' };
    }

    const myColor = this.turn;
    const oppColor: GoColor = myColor === 'B' ? 'W' : 'B';

    // Create temporary board to simulate move
    const tempGrid = this.grid.map((row) => [...row]);
    tempGrid[y][x] = myColor;

    // Check captured opponent groups
    const capturedStones: GoPoint[] = [];
    const capturedKeys = new Set<string>();

    for (const n of this.getNeighbors(x, y)) {
      if (tempGrid[n.y][n.x] === oppColor && !capturedKeys.has(`${n.x},${n.y}`)) {
        const oppGroup = this.getGroup(n.x, n.y, tempGrid);
        if (oppGroup.liberties.size === 0) {
          for (const stone of oppGroup.stones) {
            capturedStones.push(stone);
            capturedKeys.add(`${stone.x},${stone.y}`);
          }
        }
      }
    }

    // Remove captured stones from temp grid
    for (const s of capturedStones) {
      tempGrid[s.y][s.x] = null;
    }

    // Check self group liberties (Suicide Rule check)
    const myGroup = this.getGroup(x, y, tempGrid);
    if (myGroup.liberties.size === 0) {
      return { valid: false, captured: [], error: 'Nước cờ tự sát (Suicide move) - Hết khí' };
    }

    // Move is valid! Apply to real board
    this.grid = tempGrid;

    // Update capture counts
    if (myColor === 'B') {
      this.capturesB += capturedStones.length;
    } else {
      this.capturesW += capturedStones.length;
    }

    // Handle Ko point detection (single stone captured and placed stone has exactly 1 liberty)
    if (capturedStones.length === 1 && myGroup.stones.length === 1 && myGroup.liberties.size === 1) {
      this.koPoint = capturedStones[0];
    } else {
      this.koPoint = null;
    }

    this.consecutivePasses = 0;
    this.turn = oppColor;
    return { valid: true, captured: capturedStones };
  }

  // Pass Turn (Bỏ lượt)
  public pass(): { isGameOver: boolean } {
    this.consecutivePasses += 1;
    this.koPoint = null;
    this.turn = this.turn === 'B' ? 'W' : 'B';
    return { isGameOver: this.consecutivePasses >= 2 };
  }

  // Get Star Points (Hoshi / Thiên nguyên)
  public getStarPoints(): GoPoint[] {
    if (this.size === 19) {
      return [
        { x: 3, y: 3 },
        { x: 9, y: 3 },
        { x: 15, y: 3 },
        { x: 3, y: 9 },
        { x: 9, y: 9 },
        { x: 15, y: 9 },
        { x: 3, y: 15 },
        { x: 9, y: 15 },
        { x: 15, y: 15 },
      ];
    }
    if (this.size === 13) {
      return [
        { x: 3, y: 3 },
        { x: 9, y: 3 },
        { x: 6, y: 6 },
        { x: 3, y: 9 },
        { x: 9, y: 9 },
      ];
    }
    if (this.size === 9) {
      return [
        { x: 2, y: 2 },
        { x: 6, y: 2 },
        { x: 4, y: 4 },
        { x: 2, y: 6 },
        { x: 6, y: 6 },
      ];
    }
    return [];
  }

  // Rough Territory / Score estimation (Chinese / Area scoring)
  public estimateScore(komi: number = 6.5): { scoreB: number; scoreW: number; winner: 'B' | 'W'; diff: number } {
    let territoryB = 0;
    let territoryW = 0;
    const visited = new Set<string>();

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const stone = this.grid[y][x];
        if (stone === 'B') territoryB++;
        else if (stone === 'W') territoryW++;
        else if (!visited.has(`${x},${y}`)) {
          // Flood fill empty region
          const region: GoPoint[] = [];
          const owners = new Set<GoColor>();
          const q: GoPoint[] = [{ x, y }];
          visited.add(`${x},${y}`);

          while (q.length > 0) {
            const pt = q.shift()!;
            region.push(pt);

            for (const n of this.getNeighbors(pt.x, pt.y)) {
              const nStone = this.grid[n.y][n.x];
              if (nStone) {
                owners.add(nStone);
              } else if (!visited.has(`${n.x},${n.y}`)) {
                visited.add(`${n.x},${n.y}`);
                q.push(n);
              }
            }
          }

          if (owners.size === 1) {
            const owner = Array.from(owners)[0];
            if (owner === 'B') territoryB += region.length;
            else if (owner === 'W') territoryW += region.length;
          }
        }
      }
    }

    const totalB = territoryB + this.capturesB;
    const totalW = territoryW + this.capturesW + komi;
    const diff = Math.abs(totalB - totalW);

    return {
      scoreB: totalB,
      scoreW: totalW,
      winner: totalB > totalW ? 'B' : 'W',
      diff,
    };
  }
}
