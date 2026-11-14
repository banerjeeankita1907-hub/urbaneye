const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("./validation");

async function authMiddleware(req, res) {
  const header = req.headers.authorization || "";
  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer" || !parts[1]) {
    res.status(401).json({ error: "A Bearer token is required" });
    return false;
  }

  try {
    const claims = jwt.verify(parts[1], getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: "urbaneye",
    });
    if (!claims || typeof claims !== "object" || !claims.id || !claims.email || !claims.role) {
      res.status(401).json({ error: "Invalid token claims" });
      return false;
    }
    req.user = claims;
    return true;
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
    return false;
  }
}

function adminMiddleware(req, res) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

module.exports = { authMiddleware, adminMiddleware };
