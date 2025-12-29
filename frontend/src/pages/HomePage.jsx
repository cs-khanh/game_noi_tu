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
          <h1 className="text-5xl font-bold text-gray-800 mb-2 whitespace-nowrap">
            🎮 Nối Từ Ghép
          </h1>
          <p className="text-gray-600">
            Game nối từ nhiều người chơi
          </p>
        </div>

        {/* Username Input */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
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

        {/* Create Room Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🎮 Tạo phòng mới</h2>
          <button
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
          >
            Tạo phòng mới
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-600 font-semibold rounded-full">hoặc</span>
          </div>
        </div>

        {/* Join Room Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-500">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🚪 Tham gia phòng</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã phòng
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="NHẬP MÃ PHÒNG..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase"
            />
          </div>

          <button
            onClick={handleJoinRoom}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-all"
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

