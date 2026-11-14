const { kv } = require("@vercel/kv");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { validateRegistration } = require("./validation");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const checked = validateRegistration(req.body);
  if (checked.error) return res.status(400).json({ error: checked.error });

  try {
    const { name, email, password } = checked.value;
    const existing = await kv.hgetall(`user:${email}`);
    if (existing && existing.id) return res.status(409).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    await kv.hset(`user:${email}`, {
      id: userId,
      name,
      email,
      password: hashed,
      role: "citizen",
    });
    return res.status(201).json({ message: "User registered" });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ error: "Registration service is temporarily unavailable" });
  }
};
