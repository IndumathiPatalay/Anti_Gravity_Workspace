const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET_KEY = 'your_secret_key_here'; // In a real app, use environment variables

// Register User
router.post('/register', async (req, res) => {
  const { userId, password, age, healthStatus, educationLevel, phq1, phq2, weight, height, bmi } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (userId, password, age, healthStatus, educationLevel, phq1, phq2, weight, height, bmi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [
      userId, 
      hashedPassword, 
      age ? parseInt(age) : null, 
      healthStatus, 
      educationLevel, 
      phq1 !== undefined ? parseInt(phq1) : 0, 
      phq2 !== undefined ? parseInt(phq2) : 0, 
      weight ? parseFloat(weight) : null, 
      height ? parseFloat(height) : null, 
      bmi ? parseFloat(bmi) : null
    ], function(err) {
      if (err) {
        console.error('[DB Register Error]', err);
        return res.status(400).json({ error: 'User already exists or database error.' });
      }
      res.status(201).json({ message: 'User registered successfully', id: this.lastID });
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login User
router.post('/login', (req, res) => {
  const { userId, password } = req.body;
  
  const sql = 'SELECT * FROM users WHERE userId = ?';
  db.get(sql, [userId], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, userId: user.userId }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        userId: user.userId, 
        age: user.age, 
        healthStatus: user.healthStatus,
        educationLevel: user.educationLevel,
        phq1: user.phq1,
        phq2: user.phq2,
        weight: user.weight,
        height: user.height,
        bmi: user.bmi
      } 
    });
  });
});

// Update User Profile
router.put('/profile', (req, res) => {
  const { id, age, healthStatus, educationLevel, phq1, phq2, weight, height, bmi } = req.body;
  
  const sql = `UPDATE users SET 
    age = ?, 
    healthStatus = ?, 
    educationLevel = ?, 
    phq1 = ?, 
    phq2 = ?, 
    weight = ?, 
    height = ?, 
    bmi = ? 
    WHERE id = ?`;
    
  db.run(sql, [
    age ? parseInt(age) : null,
    healthStatus,
    educationLevel,
    phq1 !== undefined ? parseInt(phq1) : 0,
    phq2 !== undefined ? parseInt(phq2) : 0,
    weight ? parseFloat(weight) : null,
    height ? parseFloat(height) : null,
    bmi ? parseFloat(bmi) : null,
    id
  ], function(err) {
    if (err) {
      console.error('[DB Update Profile Error]', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
    
    // Retrieve updated user details
    const selectSql = 'SELECT * FROM users WHERE id = ?';
    db.get(selectSql, [id], (err, user) => {
      if (err || !user) {
        return res.status(500).json({ error: 'Profile updated, but failed to retrieve new details' });
      }
      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          userId: user.userId,
          age: user.age,
          healthStatus: user.healthStatus,
          educationLevel: user.educationLevel,
          phq1: user.phq1,
          phq2: user.phq2,
          weight: user.weight,
          height: user.height,
          bmi: user.bmi
        }
      });
    });
  });
});

module.exports = router;
