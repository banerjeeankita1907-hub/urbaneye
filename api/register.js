const { kv } = require('@vercel/kv');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const existing = await kv.hgetall(`user:${email}`);
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const hashed = bcrypt.hashSync(password, 10);
    const userId = `user_${Date.now()}`;
    await kv.hset(`user:${email}`, { id: userId, name, email, password: hashed, role: 'citizen' });
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};
