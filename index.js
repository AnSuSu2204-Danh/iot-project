const { Pool } = require('pg');
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Log DATABASE_URL to ensure it is correctly loaded
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Connect to PostgreSQL and handle any connection errors
pool.connect((err, client, done) => {
  if (err) {
    console.error('Connection error', err.stack);
    process.exit(1);  // Exit the process if the connection fails
  } else {
    console.log('Connected to PostgreSQL');
  }
});

// Endpoint to test database connection and show current time
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Endpoint to fetch and display data from the 'admin' table
app.get('/admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = pool;
