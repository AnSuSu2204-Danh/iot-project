const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Thay đổi từ 'bcrypt' sang 'bcryptjs'
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

pool.connect((err, client, done) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to PostgreSQL');
  }
});

// Route để đăng ký
app.post('/register', async (req, res) => {
  const { admin_name, admin_email, admin_pwd } = req.body;
  const hashedPassword = await bcrypt.hash(admin_pwd, 10); // bcryptjs cũng hỗ trợ hàm hash

  try {
    const result = await pool.query(
      'INSERT INTO admin (admin_name, admin_email, admin_pwd) VALUES ($1, $2, $3) RETURNING *',
      [admin_name, admin_email, hashedPassword]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('Error during registration:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Route để đăng nhập
app.post('/login', async (req, res) => {
  const { admin_email, admin_pwd } = req.body;

  try {
    const result = await pool.query('SELECT * FROM admin WHERE admin_email = $1', [admin_email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(admin_pwd, admin.admin_pwd); // bcryptjs cũng hỗ trợ hàm compare

    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }

    res.status(200).json({ status: 'success', message: 'Login successful', data: admin });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Route để lấy dữ liệu từ bảng data
app.get('/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM data ORDER BY time DESC');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('Error fetching data:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Route để lấy cài đặt từ bảng setting
app.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM setting ORDER BY time DESC LIMIT 1');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('Error fetching settings:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Route để nhận dữ liệu từ ESP32 và lưu vào bảng data
app.post('/data', async (req, res) => {
  const { temp, humi, temp1, humi1, temp2, humi2, temp3, humi3, systemstatus } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO data (temp, humi, temp1, humi1, temp2, humi2, temp3, humi3, systemstatus) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [temp, humi, temp1, humi1, temp2, humi2, temp3, humi3, systemstatus]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('Error inserting data:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Route để nhận dữ liệu cài đặt từ ESP32 và lưu vào bảng setting
app.post('/settings', async (req, res) => {
  const { settemp, sethumi } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO setting (settemp, sethumi) VALUES ($1, $2) RETURNING *',
      [settemp, sethumi]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('Error inserting settings:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = pool;
