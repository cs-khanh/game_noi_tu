const logger = require('../utils/logger');
const dictionaryService = require('./dictionary.service');

class GameService {
  /**
   * Validate if a word can connect to the previous word
   * @param {string} newWord - The new word (e.g., "táo tàu")
   * @param {string} previousWord - The previous word (e.g., "quả táo")
   * @returns {boolean}
   */
  canConnect(newWord, previousWord) {
    if (!newWord || !previousWord) return false;
    
    // Split words
    const newWords = newWord.trim().split(' ');
    const prevWords = previousWord.trim().split(' ');
    
    // Must be exactly 2 words each
    if (newWords.length !== 2 || prevWords.length !== 2) {
      return false;
    }
    
    // First word of new phrase must match last word of previous phrase
    const firstWordOfNew = newWords[0].toLowerCase();
    const lastWordOfPrev = prevWords[1].toLowerCase();
    
    return firstWordOfNew === lastWordOfPrev;
  }

  /**
   * Check if word is already used in the game
   * @param {string} word - Word to check
   * @param {Array} wordsChain - Array of previously used words
   * @returns {boolean}
   */
  isWordUsed(word, wordsChain) {
    const normalizedWord = word.toLowerCase().trim();
    return wordsChain.some(item => 
      item.word.toLowerCase().trim() === normalizedWord
    );
  }

  /**
   * Validate a word submission
   * @param {string} word - The submitted word
   * @param {string} previousWord - The previous word in chain
   * @param {Array} wordsChain - Array of all previously used words
   * @returns {Object} - {valid: boolean, reason: string}
   */
  async validateWordSubmission(word, previousWord, wordsChain) {
    // Check if word format is correct (2 words)
    const words = word.trim().split(' ');
    if (words.length !== 2) {
      return {
        valid: false,
        reason: 'Từ phải có đúng 2 chữ'
      };
    }

    // Check if word connects with previous word
    if (!this.canConnect(word, previousWord)) {
      return {
        valid: false,
        reason: 'Từ không nối được với từ trước'
      };
    }

    // Check if word was already used
    if (this.isWordUsed(word, wordsChain)) {
      return {
        valid: false,
        reason: 'Từ đã được sử dụng'
      };
    }

    // Check if word exists in dictionary
    const existsInDictionary = await dictionaryService.validateWord(word);
    
    if (!existsInDictionary) {
      return {
        valid: false,
        reason: 'Từ không có trong từ điển',
        needsVoting: true
      };
    }

    return {
      valid: true,
      reason: 'Từ hợp lệ'
    };
  }

  /**
   * Get suggestions for next word
   * @param {string} currentWord - Current word in the chain
   * @returns {Array} - Array of suggested words
   */
  async getSuggestions(currentWord) {
    try {
      const words = currentWord.trim().split(' ');
      if (words.length !== 2) return [];
      
      const lastWord = words[1];
      const suggestions = await dictionaryService.getWordsStartingWith(lastWord);
      
      return suggestions.map(w => w.full_word);
    } catch (error) {
      logger.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Calculate active players (not disabled)
   * @param {Array} players - Array of player objects
   * @returns {Array} - Array of active players
   */
  getActivePlayers(players) {
    return players.filter(p => !p.isDisabled);
  }

  /**
   * Get next player in turn
   * @param {Array} players - Array of all players
   * @param {number} currentTurnIndex - Current turn index
   * @returns {Object} - Next player and new turn index
   */
  getNextPlayer(players, currentTurnIndex) {
    const activePlayers = this.getActivePlayers(players);
    
    if (activePlayers.length === 0) {
      return { player: null, nextIndex: -1 };
    }
    
    if (activePlayers.length === 1) {
      return { player: activePlayers[0], nextIndex: currentTurnIndex, isWinner: true };
    }
    
    // Find next active player
    let nextIndex = (currentTurnIndex + 1) % players.length;
    let iterations = 0;
    
    while (players[nextIndex].isDisabled && iterations < players.length) {
      nextIndex = (nextIndex + 1) % players.length;
      iterations++;
    }
    
    return {
      player: players[nextIndex],
      nextIndex: nextIndex,
      isWinner: false
    };
  }

  /**
   * Process voting result
   * @param {number} votesFor - Number of votes for
   * @param {number} votesAgainst - Number of votes against
   * @returns {boolean} - True if word is approved
   */
  processVotingResult(votesFor, votesAgainst) {
    const totalVotes = votesFor + votesAgainst;
    if (totalVotes === 0) return false;
    
    const approvalRate = votesFor / totalVotes;
    return approvalRate > 0.5;
  }

  /**
   * Split word into two parts
   * @param {string} fullWord - Full word to split
   * @returns {Object} - {word1, word2}
   */
  splitWord(fullWord) {
    const words = fullWord.trim().split(' ');
    return {
      word1: words[0] || '',
      word2: words[1] || ''
    };
  }
}

module.exports = new GameService();

