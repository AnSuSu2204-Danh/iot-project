const { Pool } = require('pg');
const express = require('express');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err, client, done) => {
  if (err) {
    console.error('Connection error', err.stack);
    process.exit(1);  // Exit the process if the connection fails
  } else {
    console.log('Connected to PostgreSQL');
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint kiểm tra kết nối và hiển thị thời gian hiện tại từ PostgreSQL
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Endpoint hiển thị dữ liệu từ bảng `admin`
app.get('/admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = pool;
