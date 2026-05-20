const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const transcribeRoutes = require('./routes/transcribe');

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/transcribe', transcribeRoutes);

app.get('/', (req, res) => {
  res.send('Dementia Detection API is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
