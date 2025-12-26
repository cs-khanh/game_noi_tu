import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')

  const handleCreateRoom = () => {
    if (!username.trim()) {
      alert('Vui lòng nhập tên của bạn!')
      return
    }
    
    // Generate random room ID
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    navigate(`/game/${newRoomId}?username=${encodeURIComponent(username)}`)
  }

  const handleJoinRoom = () => {
    if (!username.trim()) {
      alert('Vui lòng nhập tên của bạn!')
      return
    }
    if (!roomId.trim()) {
      alert('Vui lòng nhập mã phòng!')
      return
    }
    
    navigate(`/game/${roomId}?username=${encodeURIComponent(username)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">
            🎮 Nối Từ Liên Hoàn
          </h1>
          <p className="text-gray-600">
            Game nối từ ghép nhiều người chơi
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Username Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên của bạn
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg mb-4"
          >
            Tạo phòng mới
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">hoặc</span>
            </div>
          </div>

          {/* Join Room */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã phòng
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Nhập mã phòng..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase"
            />
          </div>

          <button
            onClick={handleJoinRoom}
            className="w-full bg-white border-2 border-blue-500 text-blue-500 py-3 px-6 rounded-lg font-semibold hover:bg-blue-50 transition-all"
          >
            Tham gia phòng
          </button>
        </div>

        {/* Rules */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-3">📖 Luật chơi:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">⏱️</span>
              <span>Mỗi lượt có <strong>10 giây</strong> để trả lời</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🎯</span>
              <span>Nối từ cuối của cụm trước thành từ đầu cụm mới</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🗳️</span>
              <span>Từ mới cần {'>'}50% vote để chấp nhận</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🏆</span>
              <span>Người cuối cùng còn lại là Winner!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default HomePage

