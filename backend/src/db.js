import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

export const UPLOADS_DIR = uploadsDir;

const db = new Database(path.join(dataDir, "shoe-dev.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT,
    serial_number TEXT,
    upper_color TEXT,
    main_image TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS item_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS item_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_value TEXT,
    UNIQUE(item_id, field_name)
  );

  CREATE TABLE IF NOT EXISTS item_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    caption TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comment_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL
  );
`);

const itemCols = () => db.prepare("PRAGMA table_info(items)").all().map((c) => c.name);
for (const [name, type] of [
  ["model_number", "TEXT"],
  ["sn", "TEXT"],
  ["edge_sole_total_thickness", "TEXT"],
  ["outsole", "TEXT"],
  ["outsole_thickness", "TEXT"],
  ["mid_sole_footbed_thickness", "TEXT"],
  ["new_updated_carry_over", "TEXT"],
  ["gender", "TEXT"],
  ["upper_color_pantones", "TEXT"],
  ["footbed_material", "TEXT"],
  ["footbed_color", "TEXT"],
  ["outsole_color", "TEXT"],
  ["size_range", "TEXT"],
  ["original_sole_shape", "TEXT"],
  ["new_sole_shape_code", "TEXT"],
  ["logo", "TEXT"],
  ["straps_upper_material", "TEXT"],
  ["straps_upper_comments", "TEXT"],
  ["toe_post", "TEXT"],
  ["shoe_box", "TEXT"],
]) {
  if (!itemCols().includes(name)) db.exec(`ALTER TABLE items ADD COLUMN ${name} ${type}`);
}
if (!db.prepare("PRAGMA table_info(comments)").all().some((c) => c.name === "column_label")) {
  db.exec("ALTER TABLE comments ADD COLUMN column_label TEXT");
}

if (itemCols().includes("model_number") && itemCols().includes("serial_number")) {
  db.prepare(
    `UPDATE items SET model_number = serial_number
     WHERE (model_number IS NULL OR trim(model_number) = '')
       AND serial_number IS NOT NULL AND trim(serial_number) != ''`
  ).run();
}

export default db;
