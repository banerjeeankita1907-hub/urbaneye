const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tsoc2026_default_secret';

function authMiddleware(req, res) {
  return new Promise((resolve) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return resolve(false);
    }
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      resolve(true);
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
      resolve(false);
    }
  });
}

function adminMiddleware(req, res) {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return false;
  }
  return true;
}

module.exports = { authMiddleware, adminMiddleware };
