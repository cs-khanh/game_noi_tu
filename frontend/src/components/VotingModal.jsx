import { useState, useEffect } from 'react'

function VotingModal({ votingData, onVote, myId }) {
  const [hasVoted, setHasVoted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(votingData.timeLeft)
  
  const truncateName = (name, maxLength = 15) => {
    if (!name || name.length <= maxLength) return name
    return name.substring(0, maxLength) + '...'
  }
  
  // Check if current user is the proposer
  const isProposer = myId === votingData.proposedById

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleVote = (vote) => {
    if (isProposer) return // Người đề xuất không được vote
    onVote(vote)
    setHasVoted(true)
  }

  const totalVotes = votingData.votesFor + votingData.votesAgainst
  const percentFor = totalVotes > 0 ? Math.round((votingData.votesFor / totalVotes) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-4">🗳️ Voting: Từ mới!</h2>

        {/* Word */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-6 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Từ đề xuất:</p>
          <p className="text-3xl font-bold text-gray-800 mb-2">&quot;{votingData.word}&quot;</p>
          <p className="text-sm text-gray-600" title={votingData.proposedBy}>bởi {truncateName(votingData.proposedBy)}</p>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className={`text-4xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}>
            ⏱️ {timeLeft}s
          </div>
        </div>

        {/* Voting Stats */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>✅ Chấp nhận: {votingData.votesFor}</span>
            <span>{percentFor}%</span>
            <span>❌ Từ chối: {votingData.votesAgainst}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-300"
              style={{ width: `${percentFor}%` }}
            />
          </div>
        </div>

        {/* Vote Buttons */}
        {isProposer ? (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
            <p className="text-yellow-700 font-semibold text-black">💡 Đây là từ của bạn!</p>
            <p className="text-sm text-gray-600 text-black">Đang chờ người chơi khác vote...</p>
          </div>
        ) : !hasVoted ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleVote('accept')}
              className="bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all shadow-lg"
            >
              ✅ Chấp nhận
            </button>
            <button
              onClick={() => handleVote('reject')}
              className="bg-red-500 hover:bg-red-600 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all shadow-lg"
            >
              ❌ Từ chối
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 text-center">
            <p className="text-blue-700 font-semibold text-black">✅ Bạn đã vote!</p>
            <p className="text-sm text-gray-600 text-black">Đang chờ người chơi khác...</p>
          </div>
        )}

        <p className="text-xs text-center text-gray-500 mt-4">
          Cần {'>'}50% vote &quot;Chấp nhận&quot; để từ được thêm vào từ điển
        </p>
      </div>
    </div>
  )
}

export default VotingModal

