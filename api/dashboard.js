const { kv } = require('@vercel/kv');
const { authMiddleware, adminMiddleware } = require('./middleware');

module.exports = async (req, res) => {
  const authenticated = await authMiddleware(req, res);
  if (!authenticated) return;
  if (!adminMiddleware(req, res)) return;

  try {
    const keys = await kv.keys('issue:*');
    const issues = [];
    for (const key of keys) {
      const issue = await kv.hgetall(key);
      if (issue) issues.push(issue);
    }
    const total = issues.length;
    const open = issues.filter(i => i.status === 'open').length;
    const byCategory = {};
    const bySeverity = {};
    issues.forEach(i => {
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    });
    res.json({ total, open, byCategory, bySeverity });
  } catch (err) {
    res.status(500).json({ error: 'Dashboard error' });
  }
};
