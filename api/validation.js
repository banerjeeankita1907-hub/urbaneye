const ALLOWED_CATEGORIES = new Set(["road", "waste", "water", "electricity", "other"]);

function normalizeEmail(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function isValidEmail(value) {
  return typeof value === "string"
    && value.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateRegistration(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Request body must be a JSON object" };
  }
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = normalizeEmail(input.email);
  const password = input.password;
  if (!name || name.length > 80) return { error: "Name must be 1-80 characters" };
  if (!isValidEmail(email)) return { error: "A valid email address is required" };
  if (typeof password !== "string" || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    return { error: "Password must be at least 12 characters and at most 72 UTF-8 bytes" };
  }
  return { value: { name, email, password } };
}

function validateLogin(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Request body must be a JSON object" };
  }
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email) || typeof input.password !== "string" || input.password.length === 0 || input.password.length > 72) {
    return { error: "Email or password is invalid" };
  }
  return { value: { email, password: input.password } };
}

function validateIssue(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Request body must be a JSON object" };
  }
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim().toLowerCase() : "";
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);

  if (!description || description.length > 2000) {
    return { error: "Description must be 1-2000 characters" };
  }
  if (!ALLOWED_CATEGORIES.has(category)) {
    return { error: "Category is not supported" };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { error: "Latitude must be between -90 and 90" };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: "Longitude must be between -180 and 180" };
  }

  let photo = null;
  if (input.photo !== undefined && input.photo !== null && input.photo !== "") {
    if (typeof input.photo !== "string" || input.photo.length > 2_000_000) {
      return { error: "Photo must be a data URL no larger than approximately 1.5 MB" };
    }
    if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(input.photo)) {
      return { error: "Photo must be a PNG, JPEG or WebP base64 data URL" };
    }
    photo = input.photo;
  }

  return { value: { description, category, latitude, longitude, photo } };
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 UTF-8 bytes");
  }
  return secret;
}

module.exports = {
  ALLOWED_CATEGORIES,
  normalizeEmail,
  validateRegistration,
  validateLogin,
  validateIssue,
  getJwtSecret,
};
