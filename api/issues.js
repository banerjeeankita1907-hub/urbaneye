const { kv } = require("@vercel/kv");
const { v4: uuidv4 } = require("uuid");
const { authMiddleware } = require("./middleware");
const { validateIssue } = require("./validation");

function analyzeSeverity(description) {
  const lower = description.toLowerCase();
  if (/urgent|danger|emergency|fire|flood|accident|collapse|severe|immediate/.test(lower)) return "high";
  if (/broken|damage|hole|leak|blocked|faulty|pothole|waste/.test(lower)) return "medium";
  return "low";
}

module.exports = async (req, res) => {
  if (req.method === "POST") {
    const authenticated = await authMiddleware(req, res);
    if (!authenticated) return;

    const checked = validateIssue(req.body);
    if (checked.error) return res.status(400).json({ error: checked.error });

    try {
      const { description, category, latitude, longitude, photo } = checked.value;
      const id = uuidv4();
      const issue = {
        id,
        description,
        category,
        severity: analyzeSeverity(description),
        latitude,
        longitude,
        photo,
        status: "open",
        reported_by: req.user.id,
        reporter_email: req.user.email,
        created_at: new Date().toISOString(),
      };
      await kv.hset(`issue:${id}`, issue);
      return res.status(201).json({ id, severity: issue.severity, status: issue.status });
    } catch (error) {
      console.error("Issue report error:", error.message);
      return res.status(500).json({ error: "Report could not be saved" });
    }
  }

  if (req.method === "GET") {
    try {
      const keys = await kv.keys("issue:*");
      const issues = [];
      for (const key of keys) {
        const issue = await kv.hgetall(key);
        if (!issue) continue;
        // Public map/list responses intentionally exclude private reporter data
        // and base64 photos to avoid leaking email addresses or huge payloads.
        issues.push({
          id: issue.id,
          description: issue.description,
          category: issue.category,
          severity: issue.severity,
          latitude: Number(issue.latitude),
          longitude: Number(issue.longitude),
          status: issue.status,
          created_at: issue.created_at,
        });
      }
      issues.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      return res.status(200).json(issues);
    } catch (error) {
      console.error("Issue listing error:", error.message);
      return res.status(500).json({ error: "Could not fetch issues" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};
