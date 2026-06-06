const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');

const SECRET_KEY = 'your_secret_key_here'; // In a real app, use environment variables
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Register User
router.post('/register', async (req, res) => {
  const { userId, password, age, healthStatus, educationLevel, phq1, phq2, weight, height, bmi } = req.body;

  // Validation
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

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
        if (err.message && err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'This User ID is already taken. Please choose a different one or login.' });
        }
        return res.status(400).json({ error: 'Registration failed: ' + err.message });
      }
      res.status(201).json({ message: 'User registered successfully', id: this.lastID });
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }
});

// Login User
router.post('/login', (req, res) => {
  const { userId, password } = req.body;

  // Validation
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }
  
  const sql = 'SELECT * FROM users WHERE userId = ?';
  db.get(sql, [userId], async (err, user) => {
    if (err) {
      console.error('[DB Login Error]', err);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
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
    } catch (error) {
      console.error('[Login Error]', error);
      res.status(500).json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') });
    }
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

// OAuth Login/Registration (Google + Mock Developer Mode)
router.post('/oauth/google', async (req, res) => {
  const { credential, isMock, mockEmail, mockName, mockSub } = req.body;

  try {
    let email = '';
    let name = '';
    let sub = '';

    if (isMock) {
      // Mock flow for local dev/testing
      email = mockEmail || 'mockuser@example.com';
      name = mockName || 'Mock User';
      sub = mockSub || `mock_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    } else {
      // Real Google validation
      if (!GOOGLE_CLIENT_ID) {
        return res.status(400).json({ error: 'Google Client ID is not configured on the server. Please use Mock Mode or configure VITE_GOOGLE_CLIENT_ID.' });
      }
      
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(400).json({ error: 'Invalid ID Token payload.' });
      }
      email = payload.email;
      name = payload.name || payload.given_name || 'Google User';
      sub = payload.sub;
    }

    if (!email) {
      return res.status(400).json({ error: 'OAuth login failed: email not provided by authentication provider.' });
    }

    // Check if user already exists with this oauthProvider & oauthId
    const sqlSelectOAuth = 'SELECT * FROM users WHERE oauthProvider = ? AND oauthId = ?';
    db.get(sqlSelectOAuth, ['google', sub], async (err, oauthUser) => {
      if (err) {
        console.error('[OAuth DB Error]', err);
        return res.status(500).json({ error: 'Database query error.' });
      }

      if (oauthUser) {
        // User exists - return token
        const token = jwt.sign({ id: oauthUser.id, userId: oauthUser.userId }, SECRET_KEY, { expiresIn: '2h' });
        return res.json({
          token,
          user: {
            id: oauthUser.id,
            userId: oauthUser.userId,
            age: oauthUser.age,
            healthStatus: oauthUser.healthStatus,
            educationLevel: oauthUser.educationLevel,
            phq1: oauthUser.phq1,
            phq2: oauthUser.phq2,
            weight: oauthUser.weight,
            height: oauthUser.height,
            bmi: oauthUser.bmi,
            oauthProvider: oauthUser.oauthProvider,
            oauthId: oauthUser.oauthId
          }
        });
      }

      // Check if email already exists as standard userId
      const sqlSelectEmail = 'SELECT * FROM users WHERE userId = ?';
      db.get(sqlSelectEmail, [email], async (err, existingEmailUser) => {
        if (err) {
          console.error('[OAuth DB Error Check Email]', err);
          return res.status(500).json({ error: 'Database check error.' });
        }

        if (existingEmailUser) {
          // Link OAuth to existing account
          const sqlLinkOAuth = 'UPDATE users SET oauthProvider = ?, oauthId = ? WHERE id = ?';
          db.run(sqlLinkOAuth, ['google', sub, existingEmailUser.id], function(updateErr) {
            if (updateErr) {
              console.error('[OAuth DB Link Error]', updateErr);
              return res.status(500).json({ error: 'Failed to link OAuth provider to existing user.' });
            }

            const token = jwt.sign({ id: existingEmailUser.id, userId: existingEmailUser.userId }, SECRET_KEY, { expiresIn: '2h' });
            return res.json({
              token,
              user: {
                id: existingEmailUser.id,
                userId: existingEmailUser.userId,
                age: existingEmailUser.age,
                healthStatus: existingEmailUser.healthStatus,
                educationLevel: existingEmailUser.educationLevel,
                phq1: existingEmailUser.phq1,
                phq2: existingEmailUser.phq2,
                weight: existingEmailUser.weight,
                height: existingEmailUser.height,
                bmi: existingEmailUser.bmi,
                oauthProvider: 'google',
                oauthId: sub
              }
            });
          });
          return;
        }

        // Brand new user - create with null clinical parameters (forces complete profile flow)
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const sqlInsert = `INSERT INTO users (
          userId, password, age, healthStatus, educationLevel, 
          phq1, phq2, weight, height, bmi, oauthProvider, oauthId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.run(sqlInsert, [
          email,
          hashedPassword,
          null,   // null age forces complete profile flow
          null,   // null healthStatus forces complete profile flow
          null,
          0,
          0,
          null,
          null,
          null,
          'google',
          sub
        ], function(insertErr) {
          if (insertErr) {
            console.error('[OAuth Register Error]', insertErr);
            return res.status(400).json({ error: 'OAuth registration failed.' });
          }

          const newUserId = this.lastID;
          const token = jwt.sign({ id: newUserId, userId: email }, SECRET_KEY, { expiresIn: '2h' });
          
          res.status(201).json({
            token,
            user: {
              id: newUserId,
              userId: email,
              age: null,
              healthStatus: null,
              educationLevel: null,
              phq1: 0,
              phq2: 0,
              weight: null,
              height: null,
              bmi: null,
              oauthProvider: 'google',
              oauthId: sub
            }
          });
        });
      });
    });

  } catch (error) {
    console.error('[Google OAuth Error]', error);
    res.status(500).json({ error: 'Google OAuth authentication failed.' });
  }
});

module.exports = router;
