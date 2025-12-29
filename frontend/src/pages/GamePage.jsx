import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import PlayersList from '../components/PlayersList'
import WordHistory from '../components/WordHistory'
import GamePlay from '../components/GamePlay'
import VotingModal from '../components/VotingModal'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000'

function GamePage() {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const username = searchParams.get('username')

  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [players, setPlayers] = useState([])
  const [wordsHistory, setWordsHistory] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [currentWord, setCurrentWord] = useState('')
  const [timeLeft, setTimeLeft] = useState(10)
  const [gameStarted, setGameStarted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [votingData, setVotingData] = useState(null)
  const [gameEnded, setGameEnded] = useState(false)
  const [winner, setWinner] = useState(null)
  // Generate a simple UUID v4-like string
  const [myId] = useState(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  })

  // Initialize socket connection
  useEffect(() => {
    if (!username) {
      navigate('/')
      return
    }

    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)

      // Join room
      socket.emit('join_room', {
        roomId,
        userId: myId,
        username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      })
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    // Room updated
    socket.on('room_updated', ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers || [])
    })

    // Game started
    socket.on('game_started', ({ firstWord, currentPlayer: cp, timeLeft: tl }) => {
      console.log('Game started!')
      setGameStarted(true)
      setWordsHistory([{ word: firstWord, playerName: 'System', timestamp: new Date().toISOString() }])
      setCurrentPlayer(cp)
      setCurrentWord(firstWord)
      setTimeLeft(tl)
    })

    // Turn changed
    socket.on('turn_changed', ({ currentPlayer: cp, wordToMatch, timeLeft: tl }) => {
      setCurrentPlayer(cp)
      setCurrentWord(wordToMatch)
      setTimeLeft(tl)
    })

    // Word submitted
    socket.on('word_submitted', ({ word, wordsChain }) => {
      setWordsHistory(wordsChain || [])
      setCurrentWord(word)
    })

    // Timer tick
    socket.on('timer_tick', ({ timeLeft: tl }) => {
      setTimeLeft(tl)
    })

    // Player disabled
    socket.on('player_disabled', ({ playerId, reason }) => {
      console.log(`Player ${playerId} disabled: ${reason}`)
      // Players list will be updated via room_updated
    })

    // Voting started
    socket.on('voting_started', ({ word, proposedBy, proposedByName, timeLeft: tl }) => {
      setVotingData({
        word,
        proposedById: proposedBy,
        proposedBy: proposedByName,
        votesFor: 0,
        votesAgainst: 0,
        timeLeft: tl
      })
    })

    // Vote update
    socket.on('vote_update', ({ votesFor, votesAgainst }) => {
      setVotingData(prev => prev ? { ...prev, votesFor, votesAgainst } : null)
    })

    // Voting ended
    socket.on('voting_ended', () => {
      // Đóng popup ngay khi voting kết thúc
      setVotingData(null)
    })

    // Game ended
    socket.on('game_ended', ({ winner: w, wordsChain }) => {
      setGameEnded(true)
      setWinner(w)
      setWordsHistory(wordsChain || [])
    })

    // Error
    socket.on('error', ({ message }) => {
      alert(`Lỗi: ${message}`)
    })

    return () => {
      socket.disconnect()
    }
  }, [username, roomId, myId, navigate])

  const handleReady = () => {
    if (socketRef.current) {
      socketRef.current.emit('ready', { roomId })
      setIsReady(true)
    }
  }

  const handleStartGame = () => {
    if (socketRef.current) {
      socketRef.current.emit('start_game', { roomId })
    }
  }

  const handleSubmitWord = (word) => {
    if (socketRef.current) {
      socketRef.current.emit('submit_word', { roomId, word })
    }
  }

  const handleVote = (vote) => {
    if (socketRef.current) {
      socketRef.current.emit('vote', { roomId, vote })
    }
  }

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room', { roomId })
    }
    navigate('/')
  }

  const isMyTurn = currentPlayer?.id === myId
  const myPlayer = players.find(p => p.id === myId)
  const isHost = myPlayer?.isHost || false
  const isSpectator = myPlayer?.isSpectator || false

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🎮 Nối Từ Liên Hoàn</h1>
            <p className="text-sm text-gray-600">
              Phòng: <span className="font-mono font-bold">{roomId}</span>
              {isSpectator && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">👁️ Chế độ xem</span>}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">{isConnected ? 'Đã kết nối' : 'Mất kết nối'}</span>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Rời phòng
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto">
        {!gameStarted && !gameEnded ? (
          /* Lobby */
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold mb-4">Phòng chờ</h2>
            
            {isHost && (
              <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                <p className="text-center font-semibold text-yellow-800">
                  👑 Bạn là chủ phòng! Bạn có quyền bắt đầu game.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`p-4 rounded-lg border-2 ${
                    player.isHost 
                      ? 'border-yellow-500 bg-yellow-50' 
                      : player.isReady 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300'
                  }`}
                >
                  <img src={player.avatar} alt={player.username} className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-center font-semibold">
                    {player.username}
                    {player.isHost && <span className="ml-1">👑</span>}
                  </p>
                  <p className="text-center text-sm text-gray-600">
                    {player.isHost 
                      ? '👑 Chủ phòng' 
                      : player.isReady 
                      ? '✅ Sẵn sàng' 
                      : '⏳ Chờ...'}
                  </p>
                </div>
              ))}
            </div>
            
            {isHost ? (
              /* Host - Nút Start Game */
              <div className="space-y-3">
                <button
                  onClick={handleStartGame}
                  disabled={players.length < 2}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white ${
                    players.length >= 2
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {players.length >= 2 ? '🎮 Bắt đầu game' : '⏳ Chờ thêm người chơi...'}
                </button>
                <p className="text-center text-sm text-gray-500">
                  {players.length < 2 
                    ? 'Cần ít nhất 2 người chơi để bắt đầu'
                    : `${players.length} người chơi đã sẵn sàng`}
                </p>
              </div>
            ) : (
              /* Không phải host - Nút Ready */
              <div className="space-y-3">
                {!isReady ? (
                  <button
                    onClick={handleReady}
                    className="w-full bg-green-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600"
                  >
                    ✅ Sẵn sàng
                  </button>
                ) : (
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                    <p className="text-center text-green-700 font-semibold">
                      ✅ Bạn đã sẵn sàng!
                    </p>
                    <p className="text-center text-sm text-gray-600 mt-1">
                      Đang chờ chủ phòng bắt đầu game...
                    </p>
                  </div>
                )}
                <p className="text-center text-sm text-gray-500">
                  Chủ phòng sẽ bắt đầu game khi đủ người chơi
                </p>
              </div>
            )}
          </div>
        ) : gameEnded ? (
          /* Game Ended */
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">🎉 Game kết thúc!</h2>
            {winner && (
              <div className="mb-6">
                <p className="text-xl mb-2">Người chiến thắng:</p>
                <p className="text-3xl font-bold text-yellow-500">{winner.username}</p>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold mb-2">📊 Thống kê:</h3>
              <p>Tổng số từ: {wordsHistory.length}</p>
              <p>Từ mới được thêm: {wordsHistory.filter(w => w.isNew).length}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-green-500 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-600"
              >
                🔄 Quay lại phòng
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-500 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-600"
              >
                🏠 Về trang chủ
              </button>
            </div>
          </div>
        ) : (
          /* In Game */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Players List */}
            <div className="lg:col-span-1">
              <PlayersList players={players} currentPlayer={currentPlayer} myId={myId} />
            </div>

            {/* Game Play Area */}
            <div className="lg:col-span-2 space-y-4">
              {isSpectator && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <p className="text-center font-semibold text-purple-800">
                    👁️ Bạn đang ở chế độ xem. Game đã bắt đầu trước khi bạn vào phòng.
                  </p>
                  <p className="text-center text-sm text-purple-600 mt-1">
                    Bạn sẽ có thể chơi vào ván tiếp theo!
                  </p>
                </div>
              )}
              
              <GamePlay
                currentPlayer={currentPlayer}
                currentWord={currentWord}
                timeLeft={timeLeft}
                isMyTurn={isMyTurn && !isSpectator}
                myPlayer={myPlayer}
                onSubmitWord={handleSubmitWord}
                isSpectator={isSpectator}
              />
              
              <WordHistory words={wordsHistory} />
            </div>
          </div>
        )}
      </div>

      {/* Voting Modal */}
      {votingData && (
        <VotingModal
          votingData={votingData}
          onVote={handleVote}
          myId={myId}
        />
      )}
    </div>
  )
}

export default GamePage

