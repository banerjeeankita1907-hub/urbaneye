const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeEmail,
  validateRegistration,
  validateLogin,
  validateIssue,
  getJwtSecret,
} = require("../api/validation");

test("email normalization is deterministic", () => {
  assert.equal(normalizeEmail("  USER@Example.COM "), "user@example.com");
});

test("registration enforces name, email and bcrypt-safe password bounds", () => {
  assert.deepEqual(
    validateRegistration({ name: " Citizen ", email: "USER@example.com", password: "correct horse battery" }).value,
    { name: "Citizen", email: "user@example.com", password: "correct horse battery" }
  );
  assert.ok(validateRegistration({ name: "", email: "x", password: "short" }).error);
  assert.ok(validateRegistration({ name: "A".repeat(81), email: "a@b.com", password: "correct horse battery" }).error);
  assert.ok(validateRegistration({ name: "A", email: "a@b.com", password: "x".repeat(73) }).error);
});

test("login rejects missing and malformed credentials", () => {
  assert.deepEqual(validateLogin({ email: "A@B.com", password: "x" }).value, {
    email: "a@b.com",
    password: "x",
  });
  assert.ok(validateLogin({ email: "not-an-email", password: "x" }).error);
  assert.ok(validateLogin({ email: "a@b.com" }).error);
});

test("issue validation accepts legitimate zero coordinates", () => {
  const result = validateIssue({
    description: "Drain cover is missing",
    category: "water",
    latitude: "0",
    longitude: "0",
  });
  assert.deepEqual(result.value, {
    description: "Drain cover is missing",
    category: "water",
    latitude: 0,
    longitude: 0,
    photo: null,
  });
});

test("issue validation rejects invalid coordinates and categories", () => {
  const base = { description: "Road damage", category: "road", latitude: 22.5, longitude: 88.3 };
  assert.ok(validateIssue({ ...base, latitude: 91 }).error);
  assert.ok(validateIssue({ ...base, longitude: -181 }).error);
  assert.ok(validateIssue({ ...base, category: "admin" }).error);
  assert.ok(validateIssue({ ...base, description: " " }).error);
  assert.ok(validateIssue({ ...base, description: "x".repeat(2001) }).error);
});

test("issue photos must be small supported image data URLs", () => {
  const base = { description: "Leak", category: "water", latitude: 22, longitude: 88 };
  assert.ok(validateIssue({ ...base, photo: "javascript:alert(1)" }).error);
  assert.ok(validateIssue({ ...base, photo: "data:image/svg+xml;base64,PHN2Zy8+" }).error);
  assert.ok(validateIssue({ ...base, photo: "x".repeat(2_000_001) }).error);
  assert.equal(validateIssue({ ...base, photo: "data:image/png;base64,aGVsbG8=" }).value.photo, "data:image/png;base64,aGVsbG8=");
});

test("JWT secret refuses defaults and short secrets", () => {
  const original = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => getJwtSecret(), /at least 32/);
    process.env.JWT_SECRET = "too-short";
    assert.throws(() => getJwtSecret(), /at least 32/);
    process.env.JWT_SECRET = "a-strong-secret-with-more-than-32-bytes";
    assert.equal(getJwtSecret(), process.env.JWT_SECRET);
  } finally {
    if (original === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = original;
  }
});
