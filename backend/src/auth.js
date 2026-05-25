import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "shoe-dev-dev-secret-change-in-production";
const JWT_EXPIRES = "7d";

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = db
      .prepare("SELECT id, username FROM users WHERE id = ?")
      .get(payload.sub);
    if (!user) return res.status(401).json({ error: "Invalid token" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function registerUser(username, password) {
  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) return { error: "Username already taken" };
  const hash = hashPassword(password);
  const result = db
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, hash);
  return { id: result.lastInsertRowid, username };
}

export function loginUser(username, password) {
  const user = db
    .prepare("SELECT id, username, password_hash FROM users WHERE username = ?")
    .get(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Invalid username or password" };
  }
  return { id: user.id, username: user.username, token: signToken(user) };
}
