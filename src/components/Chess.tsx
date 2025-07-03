import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import {Chessboard, type PieceDropHandlerArgs} from 'react-chessboard';
import { findBestMove } from './MinimaxAgent';

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

  // State for custom FEN input
  const [customFen, setCustomFen] = useState('');
  const [fenError, setFenError] = useState<string | null>(null);

  // Store the initial FEN
  const [initialFen, setInitialFen] = useState(game.fen());

  // State to track move history
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);

  // State to track if the game is over
  const [gameOver, setGameOver] = useState<string | null>(null);

  // State for computer player
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w'); // Player is white by default
  const [computerThinking, setComputerThinking] = useState(false);
  const [searchDepth, setSearchDepth] = useState(3); // Default search depth
  const computerTimeoutRef = useRef<number | null>(null);

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

  // Function to make the computer move
  const makeComputerMove = useCallback(() => {
    if (gameOver || game.turn() === playerColor) return;

    setComputerThinking(true);

    // Use a timeout to give the UI time to update and show the "thinking" state
    computerTimeoutRef.current = window.setTimeout(() => {
      try {
        // Find the best move using minimax
        // Pass the opposite of playerColor as the computerColor
        const computerColor = playerColor === 'w' ? 'b' : 'w';
        const bestMoveSan = findBestMove(game, searchDepth, computerColor);

        if (bestMoveSan) {
          // Convert SAN to move object
          const gameCopy = new Chess(game.fen());
          const moveObj = gameCopy.move(bestMoveSan);

          if (moveObj) {
            // Make the move
            makeMove({
              from: moveObj.from,
              to: moveObj.to,
              promotion: moveObj.promotion
            });
          }
        }
      } catch (error) {
        console.error('Error making computer move:', error);
      } finally {
        setComputerThinking(false);
        computerTimeoutRef.current = null;
      }
    }, 500); // Small delay to show "thinking" state
  }, [game, gameOver, playerColor, searchDepth, makeMove]);
  // Check if the game is over after each move and trigger computer move if needed
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
      // Clear any pending computer move
      if (computerTimeoutRef.current) {
        window.clearTimeout(computerTimeoutRef.current);
        computerTimeoutRef.current = null;
      }
      setComputerThinking(false);
    } else {
      setGameOver(null);

      // If it's computer's turn, make a move
      if (game.turn() !== playerColor && !computerThinking) {
        makeComputerMove();
      }
    }
  }, [game, playerColor, computerThinking, makeComputerMove]);



  // Function to handle piece drop (drag and drop)
  const onDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    // If targetSquare is null (dropped outside the board), don't make a move
    if (targetSquare === null) return false;

    // Prevent moves if it's not the player's turn or if the computer is thinking
    if (game.turn() !== playerColor || computerThinking || gameOver) {
      return false;
    }

    // Check if promotion is needed
    const moveObj = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // Always promote to queen for simplicity
    };

    const move = makeMove(moveObj);
    return move;
  };

  // Function to validate FEN string
  const validateFen = (fen: string): boolean => {
    try {
      // Try to create a new Chess instance with the provided FEN
      new Chess(fen);
      setFenError(null);
      return true;
    } catch (e) {
      // If there's an error, the FEN is invalid
      setFenError('Invalid FEN string. Please check your input.');
      return false;
    }
  };

  // Function to reset the game
  const resetGame = () => {
    // Clear any pending computer move
    if (computerTimeoutRef.current) {
      window.clearTimeout(computerTimeoutRef.current);
      computerTimeoutRef.current = null;
    }
    setComputerThinking(false);

    let newGame;

    // If custom FEN is provided and valid, use it
    if (customFen.trim() !== '') {
      if (validateFen(customFen)) {
        newGame = new Chess(customFen);
        // Update the initial FEN
        setInitialFen(customFen);
      } else {
        // If FEN is invalid, use default position
        newGame = new Chess();
      }
    } else {
      // If no custom FEN is provided, use default position
      newGame = new Chess();
      // Update the initial FEN to the default position
      setInitialFen(newGame.fen());
    }

    setGame(newGame);
    setMoveHistory([]);
    setGameOver(null);

    // If it's computer's turn (black and player is white, or white and player is black),
    // trigger computer move
    if (newGame.turn() !== playerColor) {
      // Use a short timeout to allow the UI to update first
      setTimeout(() => makeComputerMove(), 500);
    }
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

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Computer Settings</h3>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">
              Play as:
            </label>
            <div className="flex gap-2">
              <button
                className={`px-3 py-2 rounded ${playerColor === 'w' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => {
                  if (playerColor !== 'w') {
                    setPlayerColor('w');
                    resetGame();
                  }
                }}
              >
                White
              </button>
              <button
                className={`px-3 py-2 rounded ${playerColor === 'b' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => {
                  if (playerColor !== 'b') {
                    setPlayerColor('b');
                    resetGame();
                  }
                }}
              >
                Black
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="depth-slider" className="block text-sm font-medium mb-1">
              Computer Strength (Depth: {searchDepth})
            </label>
            <input
              id="depth-slider"
              type="range"
              min="1"
              max="5"
              step="1"
              value={searchDepth}
              onChange={(e) => setSearchDepth(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Weaker (Faster)</span>
              <span>Stronger (Slower)</span>
            </div>
          </div>

          {computerThinking && (
            <div className="bg-yellow-800 text-yellow-100 p-2 rounded flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Computer is thinking...
            </div>
          )}
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
          <div className="relative">
            <Chessboard 
              options={{
                position: game.fen(),
                onPieceDrop: onDrop,
                boardOrientation: playerColor === 'w' ? 'white' : 'black',
                boardStyle: {
                  borderRadius: '4px',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
                },
                allowDragging: !gameOver && game.turn() === playerColor && !computerThinking
              }}
            />
            {computerThinking && (
              <div className="absolute top-2 right-2 z-10">
                <div className="bg-gray-800 text-white px-3 py-1 rounded shadow-lg flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Thinking...
                </div>
              </div>
            )}
            {!computerThinking && !gameOver && game.turn() !== playerColor && (
              <div className="absolute top-2 left-2 z-10">
                <div className="bg-gray-800 text-white px-3 py-1 rounded shadow-lg">
                  Computer's turn
                </div>
              </div>
            )}
          </div>

          {gameOver && (
            <div className="mt-4 p-2 bg-blue-900 text-blue-100 rounded">
              <p className="text-xl">{gameOver}</p>

              <div className="mt-4">
                <label htmlFor="fen-input-gameover" className="block text-sm font-medium mb-1">
                  Custom FEN for new game (optional):
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    id="fen-input-gameover"
                    type="text"
                    value={customFen}
                    onChange={(e) => setCustomFen(e.target.value)}
                    placeholder="Enter FEN string"
                    className="flex-grow p-2 bg-blue-800 border border-blue-700 rounded text-white"
                  />
                  <button
                    className="px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
                    onClick={() => validateFen(customFen)}
                  >
                    Validate
                  </button>
                  <button
                    className="px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
                    onClick={() => setCustomFen('')}
                    title="Clear custom FEN and use default starting position"
                  >
                    Clear
                  </button>
                </div>
                {fenError && (
                  <p className="text-red-300 text-sm mb-2">{fenError}</p>
                )}
                {customFen && !fenError && (
                  <p className="text-green-300 text-sm mb-2">Valid FEN</p>
                )}
              </div>

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

              <div className="mt-4">
                <label htmlFor="fen-input" className="block text-sm font-medium mb-1">
                  Custom FEN (optional):
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    id="fen-input"
                    type="text"
                    value={customFen}
                    onChange={(e) => setCustomFen(e.target.value)}
                    placeholder="Enter FEN string"
                    className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                  <button
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                    onClick={() => validateFen(customFen)}
                  >
                    Validate
                  </button>
                  <button
                    className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                    onClick={() => setCustomFen('')}
                    title="Clear custom FEN and use default starting position"
                  >
                    Clear
                  </button>
                </div>
                {fenError && (
                  <p className="text-red-400 text-sm mb-2">{fenError}</p>
                )}
                {customFen && !fenError && (
                  <p className="text-green-400 text-sm mb-2">Valid FEN</p>
                )}
              </div>

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
