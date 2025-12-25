const { query } = require('../config/database');
const logger = require('../utils/logger');

class DictionaryService {
  // Get all words with pagination
  async getAllWords(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    try {
      const result = await query(
        'SELECT * FROM dictionary ORDER BY id LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      const countResult = await query('SELECT COUNT(*) FROM dictionary');
      const total = parseInt(countResult.rows[0].count);
      
      return {
        words: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all words:', error);
      throw error;
    }
  }

  // Search words
  async searchWords(searchTerm) {
    try {
      const result = await query(
        `SELECT * FROM dictionary 
         WHERE full_word LIKE $1 OR word1 LIKE $1 OR word2 LIKE $1 
         LIMIT 20`,
        [`%${searchTerm}%`]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error searching words:', error);
      throw error;
    }
  }

  // Check if word exists
  async wordExists(fullWord) {
    try {
      const result = await query(
        'SELECT id FROM dictionary WHERE full_word = $1',
        [fullWord]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking word exists:', error);
      throw error;
    }
  }

  // Check if word exists in community words
  async wordExistsInCommunity(fullWord) {
    try {
      const result = await query(
        "SELECT id FROM community_words WHERE full_word = $1 AND status = 'approved'",
        [fullWord]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking community word:', error);
      throw error;
    }
  }

  // Validate word for game
  async validateWord(fullWord) {
    const existsInDict = await this.wordExists(fullWord);
    const existsInCommunity = await this.wordExistsInCommunity(fullWord);
    return existsInDict || existsInCommunity;
  }

  // Get word by full_word
  async getWordByFullWord(fullWord) {
    try {
      const result = await query(
        'SELECT * FROM dictionary WHERE full_word = $1',
        [fullWord]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting word:', error);
      throw error;
    }
  }

  // Get words starting with a specific word
  async getWordsStartingWith(word) {
    try {
      const result = await query(
        'SELECT * FROM dictionary WHERE word1 = $1 LIMIT 10',
        [word]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting words starting with:', error);
      throw error;
    }
  }

  // Add community word
  async addCommunityWord(fullWord, word1, word2, meaning, userId, approved = false) {
    try {
      const status = approved ? 'approved' : 'pending';
      const approvedAt = approved ? 'NOW()' : 'NULL';
      
      const result = await query(
        `INSERT INTO community_words (word1, word2, full_word, meaning, submitted_by_user_id, status, approved_at)
         VALUES ($1, $2, $3, $4, $5, $6, ${approvedAt})
         RETURNING *`,
        [word1, word2, fullWord, meaning, userId, status]
      );
      
      // If approved, also add to main dictionary immediately
      if (approved) {
        const word = result.rows[0];
        try {
          await query(
            `INSERT INTO dictionary (word1, word2, full_word, meaning, frequency, is_approved)
             VALUES ($1, $2, $3, $4, 'rare', true)
             ON CONFLICT (full_word) DO NOTHING`,
            [word.word1, word.word2, word.full_word, word.meaning]
          );
          logger.info(`Added community word to dictionary: ${word.full_word}`);
        } catch (dictError) {
          logger.error('Error adding to main dictionary:', dictError);
          // Continue even if dictionary insert fails
        }
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding community word:', error);
      throw error;
    }
  }

  // Approve community word (after voting)
  async approveCommunityWord(wordId) {
    try {
      const result = await query(
        `UPDATE community_words 
         SET status = 'approved', approved_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [wordId]
      );
      
      // Also add to main dictionary
      if (result.rows[0]) {
        const word = result.rows[0];
        await query(
          `INSERT INTO dictionary (word1, word2, full_word, meaning, frequency, is_approved)
           VALUES ($1, $2, $3, $4, 'rare', true)`,
          [word.word1, word.word2, word.full_word, word.meaning]
        );
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error approving community word:', error);
      throw error;
    }
  }

  // Get community words
  async getCommunityWords(status = 'approved') {
    try {
      const result = await query(
        'SELECT * FROM community_words WHERE status = $1 ORDER BY created_at DESC LIMIT 50',
        [status]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting community words:', error);
      throw error;
    }
  }

  // Get random starting word
  async getRandomStartingWord() {
    try {
      const result = await query(
        'SELECT * FROM dictionary ORDER BY RANDOM() LIMIT 1'
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting random word:', error);
      throw error;
    }
  }
}

module.exports = new DictionaryService();

