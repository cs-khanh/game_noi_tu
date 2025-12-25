const express = require('express');
const router = express.Router();
const dictionaryService = require('../services/dictionary.service');
const logger = require('../utils/logger');

// Get all words with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await dictionaryService.getAllWords(page, limit);
    res.json(result);
  } catch (error) {
    logger.error('Error getting words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search words
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search term required' });
    }

    const words = await dictionaryService.searchWords(q);
    res.json({ words });
  } catch (error) {
    logger.error('Error searching words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get words starting with
router.get('/suggestions', async (req, res) => {
  try {
    const { word } = req.query;
    if (!word) {
      return res.status(400).json({ error: 'Word parameter required' });
    }

    const suggestions = await dictionaryService.getWordsStartingWith(word);
    res.json({ suggestions });
  } catch (error) {
    logger.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get community words
router.get('/community', async (req, res) => {
  try {
    const status = req.query.status || 'approved';
    const words = await dictionaryService.getCommunityWords(status);
    res.json({ words });
  } catch (error) {
    logger.error('Error getting community words:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suggest new word
router.post('/suggest', async (req, res) => {
  try {
    const { fullWord, word1, word2, meaning, userId } = req.body;
    
    if (!fullWord || !word1 || !word2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const word = await dictionaryService.addCommunityWord(
      fullWord,
      word1,
      word2,
      meaning,
      userId
    );
    
    res.status(201).json({ word });
  } catch (error) {
    logger.error('Error suggesting word:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

