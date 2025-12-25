const express = require('express');
const router = express.Router();

// Placeholder routes
router.get('/daily', (req, res) => {
  res.status(501).json({ message: 'Leaderboard routes not implemented yet' });
});

router.get('/weekly', (req, res) => {
  res.status(501).json({ message: 'Leaderboard routes not implemented yet' });
});

router.get('/alltime', (req, res) => {
  res.status(501).json({ message: 'Leaderboard routes not implemented yet' });
});

module.exports = router;

