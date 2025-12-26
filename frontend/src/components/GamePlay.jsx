import { useState, useEffect } from 'react'

function GamePlay({ currentPlayer, currentWord, timeLeft, isMyTurn, myPlayer, onSubmitWord }) {
  const [inputWord, setInputWord] = useState('')
  const [error, setError] = useState('')

  // Get the last word of current word to know what to start with
  const wordsArray = currentWord.split(' ')
  const lastWord = wordsArray[wordsArray.length - 1]

  useEffect(() => {
    // Auto-fill first word if it's my turn
    if (isMyTurn && lastWord) {
      setInputWord(lastWord + ' ')
    }
  }, [isMyTurn, lastWord])

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

  const isDisabled = myPlayer?.isDisabled

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
            <p className="text-lg font-semibold text-black">
              Lượt của: {currentPlayer?.username || '...'}
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

          <div className="text-center">
            <p className="text-sm text-gray-500">💡 Gợi ý: {lastWord} ăn, {lastWord} uống, {lastWord} chơi...</p>
          </div>
        </form>
      )}
    </div>
  )
}

export default GamePlay

