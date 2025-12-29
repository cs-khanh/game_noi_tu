import { useState, useEffect } from 'react'

function GamePlay({ currentPlayer, currentWord, timeLeft, isMyTurn, myPlayer, onSubmitWord, onChangeWord, onChangeWordStarted, onChangeWordCancelled, votingInProgress = false, isSpectator = false }) {
  const [inputWord, setInputWord] = useState('')
  const [error, setError] = useState('')
  const [showChangeWordModal, setShowChangeWordModal] = useState(false)
  const [changeWordInput, setChangeWordInput] = useState('')
  const [changeWordError, setChangeWordError] = useState('')

  const truncateName = (name, maxLength = 15) => {
    if (!name || name.length <= maxLength) return name
    return name.substring(0, maxLength) + '...'
  }

  // Get the last word of current word to know what to start with
  const wordsArray = currentWord.split(' ')
  const lastWord = wordsArray[wordsArray.length - 1]

  // Calculate derived values before useEffect
  const isDisabled = myPlayer?.isDisabled || isSpectator
  const changeWordUsed = myPlayer?.changeWordUsed || false

  useEffect(() => {
    // Auto-fill first word if it's my turn
    if (isMyTurn && lastWord) {
      setInputWord(lastWord + ' ')
    }
  }, [isMyTurn, lastWord])

  // Close modal when changeWordUsed becomes true (word changed successfully)
  useEffect(() => {
    if (changeWordUsed && showChangeWordModal) {
      setShowChangeWordModal(false)
      setChangeWordInput('')
      setChangeWordError('')
    }
  }, [changeWordUsed, showChangeWordModal])

  // Close modal when voting starts (for change word voting)
  useEffect(() => {
    if (votingInProgress && showChangeWordModal) {
      setShowChangeWordModal(false)
      setChangeWordInput('')
      setChangeWordError('')
    }
  }, [votingInProgress, showChangeWordModal])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!inputWord.trim()) {
      setError('Vui lòng nhập từ!')
      return
    }

    const words = inputWord.trim().split(' ')
    if (words.length !== 2) {
      setError('Từ phải có đúng 2 chữ!')
      return
    }

    if (words[0].toLowerCase() !== lastWord.toLowerCase()) {
      setError(`Từ phải bắt đầu bằng "${lastWord}"!`)
      return
    }

    onSubmitWord(inputWord.trim())
    setInputWord('')
    setError('')
  }

  const handleChangeWord = () => {
    // Emit event to pause timer
    if (onChangeWordStarted) {
      onChangeWordStarted()
    }
    setShowChangeWordModal(true)
    setChangeWordInput('')
    setChangeWordError('')
  }

  const handleChangeWordSubmit = (e) => {
    e.preventDefault()
    
    if (!changeWordInput.trim()) {
      setChangeWordError('Vui lòng nhập từ mới!')
      return
    }

    const words = changeWordInput.trim().split(' ')
    if (words.length !== 2) {
      setChangeWordError('Từ phải có đúng 2 chữ!')
      return
    }

    onChangeWord(changeWordInput.trim())
    setShowChangeWordModal(false)
    setChangeWordInput('')
    setChangeWordError('')
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Current Word Display */}
      <div className="text-center mb-6">
        <h3 className="text-sm text-gray-600 mb-2">Từ hiện tại:</h3>
        <div className="text-4xl font-bold text-gray-800 mb-2">
          {currentWord}
        </div>
        <div className="text-sm text-gray-600">
          → Từ tiếp theo phải bắt đầu bằng: <span className="font-bold text-blue-600">&quot;{lastWord}&quot;</span>
        </div>
      </div>

      {/* Timer */}
      <div className="mb-6">
        <div className="flex justify-center items-center">
          <div className={`text-6xl font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}>
            ⏱️ {timeLeft}s
          </div>
        </div>
      </div>

      {/* Current Player Info */}
      <div className="text-center mb-6">
        {isMyTurn && !isDisabled ? (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <p className="text-lg font-semibold text-green-700">✨ Lượt của bạn!</p>
          </div>
        ) : isDisabled ? (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-lg font-semibold text-red-700">💀 Bạn đã bị vô hiệu hóa</p>
            <p className="text-sm text-gray-600">Lý do: {myPlayer?.disabledReason || 'Không rõ'}</p>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
            <p className="text-lg font-semibold text-black" title={currentPlayer?.username}>
              Lượt của: {truncateName(currentPlayer?.username) || '...'}
            </p>
            <p className="text-sm text-gray-600">Bạn đang chờ...</p>
          </div>
        )}
      </div>

      {/* Input Form */}
      {isMyTurn && !isDisabled && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhập từ của bạn:
            </label>
            <input
              type="text"
              value={inputWord}
              onChange={(e) => {
                setInputWord(e.target.value)
                setError('')
              }}
              placeholder={`${lastWord} ...`}
              className="w-full px-4 py-3 text-xl rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg text-lg"
          >
            Gửi từ
          </button>

          {/* Change Word Button */}
          {!changeWordUsed && (
            <button
              type="button"
              onClick={handleChangeWord}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all shadow-md text-sm mt-2"
            >
              🔄 Đổi từ ({changeWordUsed ? 'Đã dùng' : 'Còn 1 lần'})
            </button>
          )}

          {changeWordUsed && (
            <div className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-lg text-sm text-center mt-2">
              🔄 Đã sử dụng quyền đổi từ
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-500">💡 Gợi ý: {lastWord} ăn, {lastWord} uống, {lastWord} chơi...</p>
          </div>
        </form>
      )}

      {/* Change Word Modal */}
      {showChangeWordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🔄 Đổi từ</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có thể đổi từ cuối cùng của chuỗi nếu không thể nối tiếp được.
              <br />
              <span className="font-semibold">Lưu ý:</span> Từ mới phải hợp lệ và có thể nối tiếp được.
            </p>
            
            <form onSubmit={handleChangeWordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Từ hiện tại: <span className="font-bold">{currentWord}</span>
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập từ mới (2 từ):
                </label>
                <input
                  type="text"
                  value={changeWordInput}
                  onChange={(e) => {
                    setChangeWordInput(e.target.value)
                    setChangeWordError('')
                  }}
                  placeholder="ví dụ: táo tàu"
                  className="w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  autoFocus
                />
                {changeWordError && (
                  <p className="mt-2 text-sm text-red-600">{changeWordError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // Emit event to resume timer
                    if (onChangeWordCancelled) {
                      onChangeWordCancelled()
                    }
                    setShowChangeWordModal(false)
                    setChangeWordInput('')
                    setChangeWordError('')
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all"
                >
                  Đổi từ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GamePlay

