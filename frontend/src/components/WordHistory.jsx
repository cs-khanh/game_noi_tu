import { useState } from 'react'

function WordHistory({ words }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredWords = words.filter((item) =>
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">📜 Lịch sử từ đã dùng ({words.length})</h3>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm từ..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Words List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredWords.length > 0 ? (
          filteredWords.map((item, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                index === filteredWords.length - 1
                  ? 'bg-blue-50 border-2 border-blue-300'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-black">{index + 1}. {item.word}</span>
                  {item.isNew && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⭐ Mới</span>}
                </div>
                <span className="text-sm text-black">👤 {item.playerName}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">
            {searchTerm ? 'Không tìm thấy từ nào' : 'Chưa có từ nào'}
          </p>
        )}
      </div>

      {words.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-gray-700">
            ❌ <strong>Lưu ý:</strong> Các từ đã dùng không được lặp lại!
          </p>
        </div>
      )}
    </div>
  )
}

export default WordHistory

