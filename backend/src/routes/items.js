import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "../auth.js";
import { upload, saveUploadedFile, saveUploadedFiles, resolveImageUrl } from "../upload.js";
import { destroyCloudinaryAsset } from "../cloudinary.js";
import {
  getAllCommentColumnLabels,
  ITEM_DATA_KEYS,
} from "../schema.js";
import { mapItemRow, pickItemBody, mergeItemUpdate } from "../itemMapper.js";
import { buildCsvTemplate, importItemsFromCsv } from "../csvImport.js";
import { deleteItemById } from "../deleteItem.js";
import multer from "multer";

const router = Router();
router.use(authMiddleware);

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();
    const ok =
      name.endsWith(".csv") ||
      mime.includes("csv") ||
      mime === "text/plain" ||
      mime === "application/octet-stream" ||
      mime === "application/vnd.ms-excel";
    if (!ok) return cb(new Error("Only CSV files are allowed"));
    cb(null, true);
  },
});

router.get("/import/template", (_req, res) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="shoe-dev-import-template.csv"');
  res.send(buildCsvTemplate());
});

router.post("/import/csv", (req, res, next) => {
  csvUpload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      if (!req.file) return res.status(400).json({ error: "CSV file is required" });
      const result = importItemsFromCsv(req.file.buffer);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });
});

router.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT i.*,
        (SELECT COUNT(*) FROM item_images WHERE item_id = i.id) AS image_count,
        (SELECT COUNT(*) FROM comments WHERE item_id = i.id) AS comment_count
       FROM items i
       ORDER BY
         CASE WHEN i.model_number IS NULL OR trim(i.model_number) = '' THEN 1 ELSE 0 END,
         trim(i.model_number) COLLATE NOCASE,
         trim(i.sn) COLLATE NOCASE,
         i.title COLLATE NOCASE`
    )
    .all();

  res.json({
    comment_columns: getAllCommentColumnLabels(),
    items: rows.map((row) =>
      mapItemRow(row, {
        image_count: row.image_count,
        comment_count: row.comment_count,
      })
    ),
  });
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Item not found" });

  const images = db
    .prepare(
      "SELECT id, file_path, caption, created_at FROM item_images WHERE item_id = ? ORDER BY created_at DESC"
    )
    .all(row.id)
    .map((img) => ({
      id: img.id,
      url: resolveImageUrl(img.file_path),
      caption: img.caption,
      created_at: img.created_at,
    }));

  const comments = db
    .prepare(
      `SELECT c.id, c.body, c.column_label, c.created_at, u.username
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.item_id = ? ORDER BY c.created_at DESC`
    )
    .all(row.id);

  const commentsWithImages = comments.map((c) => {
    const imgs = db
      .prepare("SELECT id, file_path FROM comment_images WHERE comment_id = ?")
      .all(c.id)
      .map((img) => ({ id: img.id, url: resolveImageUrl(img.file_path) }));
    return { ...c, images: imgs };
  });

  res.json({
    ...mapItemRow(row),
    comment_columns: getAllCommentColumnLabels(),
    images,
    comments: commentsWithImages,
  });
});

router.post("/", upload.single("main_image"), async (req, res, next) => {
  try {
    const fields = pickItemBody(req.body);
    if (!fields.model_number) {
      return res.status(400).json({ error: "Model number is required" });
    }
    if (!fields.title) return res.status(400).json({ error: "Updated model name is required" });

    const mainImage = req.file ? await saveUploadedFile(req.file, "main") : null;
    const cols = ["model_number", "title", "main_image", "sn", ...ITEM_DATA_KEYS];
    const values = [
      fields.model_number,
      fields.title,
      mainImage,
      fields.sn ?? null,
      ...ITEM_DATA_KEYS.map((k) => fields[k] ?? null),
    ];

    const placeholders = cols.map(() => "?").join(", ");
    const result = db
      .prepare(`INSERT INTO items (${cols.join(", ")}) VALUES (${placeholders})`)
      .run(...values);

    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(mapItemRow(item));
  } catch (err) {
    next(err);
  }
});

async function updateItemHandler(req, res, next) {
  try {
    const row = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Item not found" });

    const fields = mergeItemUpdate(row, req.body);
    if (!fields.title?.trim()) {
      return res.status(400).json({ error: "Updated model name is required" });
    }

    let mainImage = row.main_image;
    if (req.file) {
      await destroyCloudinaryAsset(row.main_image);
      mainImage = await saveUploadedFile(req.file, "main");
    }

    const sets = [
      "model_number = ?",
      "title = ?",
      "main_image = ?",
      "sn = ?",
      ...ITEM_DATA_KEYS.map((k) => `${k} = ?`),
    ];
    const values = [
      fields.model_number,
      fields.title,
      mainImage,
      fields.sn,
      ...ITEM_DATA_KEYS.map((k) => fields[k]),
      row.id,
    ];

    db.prepare(
      `UPDATE items SET ${sets.join(", ")}, updated_at = datetime('now') WHERE id = ?`
    ).run(...values);

    const updated = db.prepare("SELECT * FROM items WHERE id = ?").get(row.id);
    res.json(mapItemRow(updated));
  } catch (err) {
    next(err);
  }
}

router.put("/:id", (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    upload.single("main_image")(req, res, (err) => {
      if (err) return next(err);
      updateItemHandler(req, res, next);
    });
  } else {
    updateItemHandler(req, res, next);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await deleteItemById(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Item not found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/:id/images", upload.array("images", 20), async (req, res, next) => {
  try {
    const row = db.prepare("SELECT id FROM items WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Item not found" });
    if (!req.files?.length) return res.status(400).json({ error: "No images uploaded" });

    const urls = await saveUploadedFiles(req.files, "gallery");
    const insert = db.prepare(
      "INSERT INTO item_images (item_id, file_path, caption) VALUES (?, ?, ?)"
    );
    const caption = req.body.caption?.trim() || null;
    const inserted = urls.map((url) => {
      const r = insert.run(req.params.id, url, caption);
      return {
        id: r.lastInsertRowid,
        url: resolveImageUrl(url),
        caption,
        created_at: new Date().toISOString(),
      };
    });

    db.prepare("UPDATE items SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    res.status(201).json(inserted);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/images/:imageId", async (req, res, next) => {
  try {
    const img = db
      .prepare("SELECT file_path FROM item_images WHERE id = ? AND item_id = ?")
      .get(req.params.imageId, req.params.id);
    if (!img) return res.status(404).json({ error: "Image not found" });

    await destroyCloudinaryAsset(img.file_path);
    db.prepare("DELETE FROM item_images WHERE id = ? AND item_id = ?").run(
      req.params.imageId,
      req.params.id
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post("/:id/comments", upload.array("images", 10), async (req, res, next) => {
  try {
    const row = db.prepare("SELECT id FROM items WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Item not found" });

    const body = req.body.body?.trim();
    if (!body) return res.status(400).json({ error: "Comment text is required" });

    const column_label =
      req.body.column_label?.trim() ||
      `NOTE ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;

    const commentResult = db
      .prepare(
        "INSERT INTO comments (item_id, user_id, body, column_label) VALUES (?, ?, ?, ?)"
      )
      .run(req.params.id, req.user.id, body, column_label);

    const commentId = commentResult.lastInsertRowid;
    const urls = await saveUploadedFiles(req.files || [], "comments");
    const imgInsert = db.prepare(
      "INSERT INTO comment_images (comment_id, file_path) VALUES (?, ?)"
    );
    const images = urls.map((url) => {
      const r = imgInsert.run(commentId, url);
      return { id: r.lastInsertRowid, url: resolveImageUrl(url) };
    });

    db.prepare("UPDATE items SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);

    res.status(201).json({
      id: commentId,
      body,
      column_label,
      username: req.user.username,
      images,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
