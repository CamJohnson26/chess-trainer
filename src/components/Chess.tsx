import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import {Chessboard, type PieceDropHandlerArgs} from 'react-chessboard';

// Define Square type as string since that's how it's used in react-chessboard
type Square = string;

const ChessGame: React.FC = () => {
  // Initialize the chess game
  const [game, setGame] = useState(new Chess());

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
    setGame(new Chess());
    setGameOver(null);
  };

  return (
    <div className="chess-container flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Chess Game</h1>

      <div className="w-full max-w-md mb-4">
        <Chessboard 
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
            boardStyle: {
              borderRadius: '4px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
            }
          }}
        />
      </div>

      {gameOver && (
        <div className="mt-4 p-2 bg-blue-100 text-blue-800 rounded">
          <p className="text-xl">{gameOver}</p>
          <button 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={resetGame}
          >
            New Game
          </button>
        </div>
      )}

      {!gameOver && (
        <div className="mt-4">
          <p className="text-xl">Current turn: {game.turn() === 'w' ? 'White' : 'Black'}</p>
          <button 
            className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={resetGame}
          >
            Reset Game
          </button>
        </div>
      )}
    </div>
  );
};

export default ChessGame;
