const { kv } = require('@vercel/kv');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('./middleware');
const nlp = require('compromise');

function analyzeSeverity(description) {
  const lower = description.toLowerCase();
  if (/urgent|danger|emergency|fire|flood|accident|collapse|severe|immediate/.test(lower)) return 'high';
  if (/broken|damage|hole|leak|blocked|faulty|pothole|waste/.test(lower)) return 'medium';
  return 'low';
}

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const authenticated = await authMiddleware(req, res);
    if (!authenticated) return;
    try {
      const { description, category, latitude, longitude, photo } = req.body;
      if (!description || !category || !latitude || !longitude) {
        return res.status(400).json({ error: 'Missing fields' });
      }
      const id = uuidv4();
      const severity = analyzeSeverity(description);
      const issue = {
        id,
        description,
        category,
        severity,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        photo: photo || null, // base64 encoded image
        status: 'open',
        reported_by: req.user.id,
        reporter_name: req.user.email,
        created_at: new Date().toISOString()
      };
      await kv.hset(`issue:${id}`, issue);
      res.status(201).json({ id, severity });
    } catch (err) {
      res.status(500).json({ error: 'Report failed' });
    }
  } else if (req.method === 'GET') {
    try {
      const keys = await kv.keys('issue:*');
      const issues = [];
      for (const key of keys) {
        const issue = await kv.hgetall(key);
        if (issue) issues.push(issue);
      }
      issues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      res.json(issues);
    } catch (err) {
      res.status(500).json({ error: 'Could not fetch issues' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
