const express = require('express');
const router = express.Router();
const db = require('../db');

// Save a session result
router.post('/', (req, res) => {
  const { 
    userId, 
    theme, 
    transcript, 
    fillersCount, 
    estimatedPauses, 
    duration,
    fillerInstances,
    pauseInstances,
    compositeScore
  } = req.body;
  
  const sql = 'INSERT INTO sessions (userId, theme, transcript, fillersCount, estimatedPauses, duration, fillerInstances, pauseInstances, compositeScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.run(sql, [
    userId, 
    theme, 
    transcript, 
    fillersCount, 
    estimatedPauses, 
    duration,
    fillerInstances ? JSON.stringify(fillerInstances) : '[]',
    pauseInstances ? JSON.stringify(pauseInstances) : '[]',
    compositeScore || 0
  ], function(err) {
    if (err) {
      console.error('[DB Save Session Error]', err);
      return res.status(500).json({ error: 'Failed to save session' });
    }
    res.status(201).json({ message: 'Session saved', id: this.lastID });
  });
});

// Get user history
router.get('/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = 'SELECT * FROM sessions WHERE userId = ? ORDER BY timestamp DESC';
  
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
    
    // Parse stringified JSON fields
    const parsed = rows.map(r => {
      try {
        r.fillerInstances = r.fillerInstances ? JSON.parse(r.fillerInstances) : [];
      } catch(e) {
        r.fillerInstances = [];
      }
      try {
        r.pauseInstances = r.pauseInstances ? JSON.parse(r.pauseInstances) : [];
      } catch(e) {
        r.pauseInstances = [];
      }
      return r;
    });
    
    res.json(parsed);
  });
});

// Get a single session details by ID
router.get('/detail/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM sessions WHERE id = ?';
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Parse stringified JSON fields
    try {
      row.fillerInstances = row.fillerInstances ? JSON.parse(row.fillerInstances) : [];
    } catch(e) {
      row.fillerInstances = [];
    }
    try {
      row.pauseInstances = row.pauseInstances ? JSON.parse(row.pauseInstances) : [];
    } catch(e) {
      row.pauseInstances = [];
    }
    
    res.json(row);
  });
});

module.exports = router;
