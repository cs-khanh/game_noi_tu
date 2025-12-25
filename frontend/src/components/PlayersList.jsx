function PlayersList({ players, currentPlayer, myId }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold mb-4">👥 Người chơi ({players.length})</h3>
      <div className="space-y-3">
        {players.map((player) => {
          const isCurrentPlayer = currentPlayer?.id === player.id
          const isMe = player.id === myId
          const isDisabled = player.isDisabled

          return (
            <div
              key={player.id}
              className={`p-3 rounded-lg border-2 ${
                isCurrentPlayer
                  ? 'border-blue-500 bg-blue-50'
                  : isDisabled
                  ? 'border-gray-300 bg-gray-100 opacity-60'
                  : 'border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={player.avatar}
                  alt={player.username}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-semibold text-black">
                    {player.username}
                    {player.isHost && <span className="ml-1">👑</span>}
                    {isMe && <span className="ml-1 text-xs text-blue-600">(Bạn)</span>}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isDisabled ? (
                      <span className="text-red-600">💀 Bị vô hiệu hóa</span>
                    ) : isCurrentPlayer ? (
                      <span className="text-blue-600">🎯 Đang chơi...</span>
                    ) : (
                      <span>💤 Chờ...</span>
                    )}
                  </p>
                </div>
              </div>
              {player.wordsUsed > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Đã dùng: {player.wordsUsed} từ
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PlayersList

