const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      age INTEGER,
      healthStatus TEXT,
      educationLevel TEXT,
      phq1 INTEGER,
      phq2 INTEGER,
      weight REAL,
      height REAL,
      bmi REAL
    )`);

    // Self-healing migration for existing databases
    db.run(`ALTER TABLE users ADD COLUMN educationLevel TEXT`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN phq1 INTEGER`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN phq2 INTEGER`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN weight REAL`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN height REAL`, (err) => {});
    db.run(`ALTER TABLE users ADD COLUMN bmi REAL`, (err) => {});

    // Create Sessions table
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      theme TEXT,
      transcript TEXT,
      fillersCount INTEGER,
      estimatedPauses INTEGER,
      duration INTEGER,
      fillerInstances TEXT,
      pauseInstances TEXT,
      compositeScore INTEGER,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`);

    // Self-healing migration for sessions table
    db.run(`ALTER TABLE sessions ADD COLUMN fillerInstances TEXT`, (err) => {});
    db.run(`ALTER TABLE sessions ADD COLUMN pauseInstances TEXT`, (err) => {});
    db.run(`ALTER TABLE sessions ADD COLUMN compositeScore INTEGER`, (err) => {});
  }
});

module.exports = db;
