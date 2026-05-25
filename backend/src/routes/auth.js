import { Router } from "express";
import { authMiddleware, loginUser, registerUser, signToken } from "../auth.js";
import db from "../db.js";

const router = Router();

router.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password || password.length < 4) {
    return res.status(400).json({ error: "Username and password (min 4 chars) required" });
  }
  const result = registerUser(username.trim(), password);
  if (result.error) return res.status(409).json({ error: result.error });
  const token = signToken(result);
  res.status(201).json({ user: { id: result.id, username: result.username }, token });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const result = loginUser(username, password);
  if (result.error) return res.status(401).json({ error: result.error });
  res.json({ user: { id: result.id, username: result.username }, token: result.token });
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

router.get("/users", authMiddleware, (_req, res) => {
  const users = db.prepare("SELECT id, username FROM users ORDER BY username").all();
  res.json(users);
});

export default router;
