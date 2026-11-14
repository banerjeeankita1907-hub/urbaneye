const { kv } = require("@vercel/kv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateLogin, getJwtSecret } = require("./validation");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const checked = validateLogin(req.body);
  if (checked.error) return res.status(400).json({ error: checked.error });

  try {
    const { email, password } = checked.value;
    const user = await kv.hgetall(`user:${email}`);
    if (!user || typeof user.password !== "string" || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { algorithm: "HS256", expiresIn: "7d", issuer: "urbaneye" }
    );
    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: "Login service is not configured or temporarily unavailable" });
  }
};
