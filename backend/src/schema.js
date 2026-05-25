import db from "./db.js";

export const DEFAULT_COMMENT_COLUMNS = [
  "SHAHAR SAMPLES COMMENTS 10-MAR-26 I",
  "SHAHAR SAMPLES COMMENTS 10-MAR-26 II",
  "SHAHAR SAMPLES COMMENTS 10-MAR-26 III",
  "SHAHAR SAMPLES COMMENTS 10-MAR-26 IV",
  "SHAHAR SAMPLES COMMENTS 10-MAR-26 V",
  "SHAHAR COMMENTS 17/05/26 I",
  "SHAHAR COMMENTS 17/05/26 II",
  "SHAHAR COMMENTS 17/05/26 III",
  "SHAHAR COMMENTS 17/05/26 IV",
  "SHAHAR COMMENTS 17/05/26 V",
];

export const ITEM_DATA_COLUMNS = [
  { key: "edge_sole_total_thickness", label: "EDGE SOLE TOTAL THICKNES" },
  { key: "upper_color", label: "UPPER COLOR" },
  { key: "outsole", label: "OUTSOLE" },
  { key: "outsole_thickness", label: "OUTSOLE THICKNES" },
  { key: "mid_sole_footbed_thickness", label: "MID SOLE FOOTBED THICKNESS" },
  { key: "new_updated_carry_over", label: "NEW|UPDATED|CARRY OVER" },
  { key: "gender", label: "GENDER" },
  { key: "upper_color_pantones", label: "UPPER COLOR PANTHONES" },
  { key: "footbed_material", label: "FOOTBED Material" },
  { key: "footbed_color", label: "FOOTBED COLOR" },
  { key: "outsole_color", label: "OUTSOLE COLOR" },
  { key: "size_range", label: "SIZE RANGE" },
  { key: "original_sole_shape", label: "ORIGINAL SOLE SHAPE" },
  { key: "new_sole_shape_code", label: "NEW SOLE SHAPE CODE" },
  { key: "logo", label: "LOGO" },
  { key: "straps_upper_material", label: "STRAPS|UPPERR MATIRAIL" },
  { key: "straps_upper_comments", label: "STRAPS|UPPERR COMENTS" },
  { key: "toe_post", label: "TOE PSOT" },
  { key: "shoe_box", label: "SHOE BOX" },
];

const ITEM_COLUMN_MIGRATIONS = [
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
];

function existingColumns(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
}

export function runMigrations() {
  const itemCols = existingColumns("items");
  for (const [name, type] of ITEM_COLUMN_MIGRATIONS) {
    if (!itemCols.includes(name)) {
      db.exec(`ALTER TABLE items ADD COLUMN ${name} ${type}`);
    }
  }

  const commentCols = existingColumns("comments");
  if (!commentCols.includes("column_label")) {
    db.exec("ALTER TABLE comments ADD COLUMN column_label TEXT");
  }
}

export function getAllCommentColumnLabels() {
  const fromDb = db
    .prepare(
      `SELECT DISTINCT column_label FROM comments
       WHERE column_label IS NOT NULL AND trim(column_label) != ''
       ORDER BY column_label`
    )
    .all()
    .map((r) => r.column_label.trim());

  const seen = new Set();
  const ordered = [];
  for (const label of [...DEFAULT_COMMENT_COLUMNS, ...fromDb]) {
    const key = label.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    ordered.push(key);
  }
  return ordered;
}

export function getCommentCells(itemId) {
  const rows = db
    .prepare(
      `SELECT column_label, body FROM comments
       WHERE item_id = ? AND column_label IS NOT NULL AND trim(column_label) != ''`
    )
    .all(itemId);
  const cells = {};
  for (const row of rows) {
    cells[row.column_label.trim()] = row.body;
  }
  return cells;
}

export const ITEM_DATA_KEYS = ITEM_DATA_COLUMNS.map((c) => c.key);
