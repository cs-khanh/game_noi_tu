const express = require('express');
const router = express.Router();

// Placeholder routes
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Room routes not implemented yet' });
});

router.post('/', (req, res) => {
  res.status(501).json({ message: 'Room routes not implemented yet' });
});

router.get('/:id', (req, res) => {
  res.status(501).json({ message: 'Room routes not implemented yet' });
});

router.delete('/:id', (req, res) => {
  res.status(501).json({ message: 'Room routes not implemented yet' });
});

module.exports = router;

