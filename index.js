const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());

const secret = 'your_jwt_secret'; // Thay đổi thành một chuỗi bí mật

// Đăng ký
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO admin (admin_name, admin_email, admin_pwd) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashedPassword]
    );
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Đăng nhập
app.post('/api/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admin WHERE admin_email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.admin_pwd);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '1h' });
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Middleware để kiểm tra token JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ success: false, message: 'Access denied' });

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Endpoint để lấy dữ liệu từ bảng data
app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM data');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Endpoint để lấy dữ liệu từ bảng setting
app.get('/api/setting', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM setting');
    res.status(200).json({ success: true, settings: result.rows });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
