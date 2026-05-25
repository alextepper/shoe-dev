import db from "./db.js";
import { hashPassword } from "./auth.js";
import { DEFAULT_COMMENT_COLUMNS } from "./schema.js";

const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
if (userCount === 0) {
  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(
    "admin",
    hashPassword("admin")
  );
  console.log("Created default user: admin / admin");
}

const itemCount = db.prepare("SELECT COUNT(*) AS c FROM items").get().c;
if (itemCount === 0) {
  const insert = db.prepare(
    `INSERT INTO items (
      model_number, sn, title, upper_color, outsole, gender, new_updated_carry_over
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const r1a = insert.run("4521", "A1", "Runner Prototype A — Navy", "Navy Blue", "Rubber", "M", "NEW");
  const r1b = insert.run("4521", "A2", "Runner Prototype A — White", "White", "Rubber", "M", "NEW");
  const r2a = insert.run("8830", "B1", "Court Classic V2 — White/Red", "White/Red", "Rubber", "U", "UPDATED");
  const r3a = insert.run("9012", "C1", "Trail Explorer — Olive", "Olive Green", "EVA", "M", "CARRY OVER");

  const commentInsert = db.prepare(
    "INSERT INTO comments (item_id, user_id, body, column_label) VALUES (?, 1, ?, ?)"
  );
  commentInsert.run(
    r1a.lastInsertRowid,
    "Navy upper approved.",
    DEFAULT_COMMENT_COLUMNS[0]
  );
  commentInsert.run(
    r1b.lastInsertRowid,
    "White colorway sample requested.",
    DEFAULT_COMMENT_COLUMNS[1]
  );

  console.log("Seeded models 4521 (2 colors), 8830, 9012");
}

console.log("Seed complete");
