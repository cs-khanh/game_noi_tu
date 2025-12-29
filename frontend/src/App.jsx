import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'

// Get base path from Vite (set in vite.config.js)
const basename = import.meta.env.BASE_URL || '/'

function App() {
  return (
    <BrowserRouter basename={basename}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App

