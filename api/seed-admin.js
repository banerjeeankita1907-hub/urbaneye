const { kv } = require('@vercel/kv');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  // Only for seeding, protect or remove in production
  const email = 'admin@urbaneye.com';
  const exists = await kv.hgetall(`user:${email}`);
  if (exists) return res.json({ message: 'Admin already exists' });
  const hashed = bcrypt.hashSync('admin123', 10);
  await kv.hset(`user:${email}`, {
    id: 'admin_001',
    name: 'City Admin',
    email,
    password: hashed,
    role: 'admin'
  });
  res.json({ message: 'Admin seed created' });
};
