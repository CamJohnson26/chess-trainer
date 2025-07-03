import { Chess } from 'chess.js';

// Piece values for evaluation (in centipawns)
const PIECE_VALUES = {
  p: -100,  // black pawn
  n: -320,  // black knight
  b: -330,  // black bishop
  r: -500,  // black rook
  q: -900,  // black queen
  k: -20000, // black king
  P: 100,   // white pawn
  N: 320,   // white knight
  B: 330,   // white bishop
  R: 500,   // white rook
  Q: 900,   // white queen
  K: 20000,  // white king
};

// Position bonuses to encourage good piece placement
const POSITION_BONUSES = {
  // Pawns are encouraged to advance
  P: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ],
  // Knights are better in the center and terrible at the edges
  N: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50]
  ],
  // Bishops prefer diagonals
  B: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20]
  ],
  // Rooks prefer open files and 7th rank
  R: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0]
  ],
  // Queens combine rook and bishop mobility
  Q: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20]
  ],
  // Kings prefer safety and castling
  K: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20]
  ]
};

// Mirror the position bonuses for black pieces
const getPositionBonus = (piece: string, row: number, col: number): number => {
  const pieceType = piece.toUpperCase();
  const bonus = POSITION_BONUSES[pieceType];

  if (!bonus) return 0;

  // For white pieces, use the table as is
  if (piece === piece.toUpperCase()) {
    return bonus[7 - row][col];
  }
  // For black pieces, mirror the table
  else {
    return -bonus[row][col];
  }
};

// Evaluate the current board position
export const evaluateBoard = (game: Chess): number => {
  if (game.isCheckmate()) {
    // If checkmate, return a very high/low score depending on who won
    return game.turn() === 'w' ? -100000 : 100000;
  }

  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
    // Draws are neutral
    return 0;
  }

  // Get the board representation
  const board = game.board();

  let score = 0;

  // Calculate material and position score
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = board[row][col];
      if (square) {
        // Add material value
        score += PIECE_VALUES[square.type] * (square.color === 'w' ? 1 : -1);

        // Add position bonus
        score += getPositionBonus(square.type, row, col);
      }
    }
  }

  // Add mobility score (number of legal moves)
  const moves = game.moves({ verbose: true });
  score += moves.length * (game.turn() === 'w' ? 1 : -1) * 5;

  return score;
};

// Minimax algorithm with alpha-beta pruning
export const minimax = (
  game: Chess, 
  depth: number, 
  alpha: number = -Infinity, 
  beta: number = Infinity, 
  isMaximizingPlayer: boolean = true
): { score: number; move?: string } => {
  // Base case: if depth is 0 or game is over, evaluate the board
  if (depth === 0 || game.isGameOver()) {
    return { score: evaluateBoard(game) };
  }

  const moves = game.moves({ verbose: true });
  let bestMove;

  if (isMaximizingPlayer) {
    let maxScore = -Infinity;

    for (const move of moves) {
      // Make the move
      game.move(move);

      // Recursively evaluate the position
      const evaluation = minimax(game, depth - 1, alpha, beta, false);

      // Undo the move
      game.undo();

      // Update max score and best move
      if (evaluation.score > maxScore) {
        maxScore = evaluation.score;
        bestMove = move;
      }

      // Alpha-beta pruning
      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) {
        break;
      }
    }

    return { score: maxScore, move: bestMove?.san };
  } else {
    let minScore = Infinity;

    for (const move of moves) {
      // Make the move
      game.move(move);

      // Recursively evaluate the position
      const evaluation = minimax(game, depth - 1, alpha, beta, true);

      // Undo the move
      game.undo();

      // Update min score and best move
      if (evaluation.score < minScore) {
        minScore = evaluation.score;
        bestMove = move;
      }

      // Alpha-beta pruning
      beta = Math.min(beta, minScore);
      if (beta <= alpha) {
        break;
      }
    }

    return { score: minScore, move: bestMove?.san };
  }
};

// Find the best move for the current position
export const findBestMove = (game: Chess, depth: number = 3, computerColor: 'w' | 'b' = 'b'): string | null => {
  // Create a copy of the game to avoid modifying the original
  const gameCopy = new Chess(game.fen());

  // Use minimax to find the best move
  // If it's the computer's turn, we want to maximize if computer is white, minimize if computer is black
  // If it's the opponent's turn, we want to simulate their best move (opposite of computer's goal)
  const isMaximizingPlayer = gameCopy.turn() === computerColor;

  const { move } = minimax(gameCopy, depth, -Infinity, Infinity, isMaximizingPlayer);

  return move || null;
};
