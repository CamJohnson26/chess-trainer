import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import {Chessboard, type PieceDropHandlerArgs} from 'react-chessboard';

// Define Square type as string since that's how it's used in react-chessboard
type Square = string;

// Define Move type for tracking move history
type Move = {
  from: Square;
  to: Square;
  promotion?: string;
  san: string; // Standard Algebraic Notation
};

const ChessGame: React.FC = () => {
  // Initialize the chess game
  const [game, setGame] = useState(new Chess());

  // Store the initial FEN
  const [initialFen] = useState(game.fen());

  // State to track move history
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);

  // State to track if the game is over
  const [gameOver, setGameOver] = useState<string | null>(null);

  // Check if the game is over after each move
  useEffect(() => {
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        setGameOver(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
      } else if (game.isDraw()) {
        setGameOver('Draw!');
      } else if (game.isStalemate()) {
        setGameOver('Stalemate!');
      } else if (game.isThreefoldRepetition()) {
        setGameOver('Draw by threefold repetition!');
      } else if (game.isInsufficientMaterial()) {
        setGameOver('Draw by insufficient material!');
      }
    } else {
      setGameOver(null);
    }
  }, [game]);

  // Function to make a move
  const makeMove = useCallback((move: { from: Square; to: Square; promotion?: string }) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);

      // If the move is valid, update the game state
      if (result) {
        // Add the move to history with SAN notation
        const newMove: Move = {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: result.san
        };
        setMoveHistory(prev => [...prev, newMove]);

        setGame(newGame);
        return true;
      }
    } catch (e) {
      // Invalid move
      return false;
    }
    return false;
  }, [game]);

  // Function to handle piece drop (drag and drop)
  const onDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    // If targetSquare is null (dropped outside the board), don't make a move
    if (targetSquare === null) return false;

    // Check if promotion is needed
    const moveObj = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // Always promote to queen for simplicity
    };

    const move = makeMove(moveObj);
    return move;
  };

  // Function to reset the game
  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setMoveHistory([]);
    setGameOver(null);
  };

  // Sidebar component to display FEN and move history
  const MoveSidebar = () => {
    return (
      <div className="bg-gray-800 p-4 rounded shadow-md w-full max-w-md text-white">
        <h2 className="text-xl font-bold mb-2">Game Information</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold">Initial Position (FEN)</h3>
          <p className="text-sm font-mono bg-gray-700 p-2 rounded overflow-x-auto text-gray-200">
            {initialFen}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Move History</h3>
          {moveHistory.length === 0 ? (
            <p className="text-gray-400 italic">No moves yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {moveHistory.map((move, index) => (
                <div key={index} className="bg-gray-700 p-2 rounded text-gray-200">
                  <span className="font-bold">{Math.floor(index / 2) + 1}{index % 2 === 0 ? '.' : '...'}</span> {move.san}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chess-container p-4">
      <h1 className="text-3xl font-bold mb-4 text-center text-white">Chess Game</h1>

      <div className="flex flex-col md:flex-row gap-6 items-start justify-center">
        <div className="w-full max-w-md mb-4">
          <Chessboard 
            options={{
              position: game.fen(),
              onPieceDrop: onDrop,
              boardStyle: {
                borderRadius: '4px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
              }
            }}
          />

          {gameOver && (
            <div className="mt-4 p-2 bg-blue-900 text-blue-100 rounded">
              <p className="text-xl">{gameOver}</p>
              <button 
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={resetGame}
              >
                New Game
              </button>
            </div>
          )}

          {!gameOver && (
            <div className="mt-4 text-white">
              <p className="text-xl">Current turn: {game.turn() === 'w' ? 'White' : 'Black'}</p>
              <button 
                className="mt-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                onClick={resetGame}
              >
                Reset Game
              </button>
            </div>
          )}
        </div>

        <MoveSidebar />
      </div>
    </div>
  );
};

export default ChessGame;
