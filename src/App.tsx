import './App.css'
import ChessGame from './components/Chess'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center">Chess Trainer</h1>
      </header>
      <main className="w-full max-w-4xl mx-auto">
        <ChessGame />
      </main>
      <footer className="mt-8 text-center text-gray-500">
        <p>Built with React, TypeScript, and chess.js</p>
      </footer>
    </div>
  )
}

export default App
