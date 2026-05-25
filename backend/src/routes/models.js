import { Router } from "express";
import db from "../db.js";
import { authMiddleware } from "../auth.js";
import { getAllCommentColumnLabels } from "../schema.js";
import { mapItemRow } from "../itemMapper.js";
import { deleteItemsByIds, itemIdsForModel } from "../deleteItem.js";

const router = Router();
router.use(authMiddleware);

router.get("/", (_req, res) => {
  const models = db
    .prepare(
      `SELECT model_number, COUNT(*) AS color_count, MAX(updated_at) AS updated_at
       FROM items
       WHERE model_number IS NOT NULL AND trim(model_number) != ''
       GROUP BY model_number
       ORDER BY
         CASE WHEN model_number IS NULL OR trim(model_number) = '' THEN 1 ELSE 0 END,
         trim(model_number) COLLATE NOCASE`
    )
    .all();
  res.json(models);
});

router.delete("/:modelNumber", async (req, res, next) => {
  try {
    const ids = itemIdsForModel(req.params.modelNumber);
    if (!ids.length) return res.status(404).json({ error: "Model not found" });
    await deleteItemsByIds(ids);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get("/:modelNumber", (req, res) => {
  const modelNumber = decodeURIComponent(req.params.modelNumber);
  const rows = db
    .prepare(
      `SELECT i.*,
        (SELECT COUNT(*) FROM item_images WHERE item_id = i.id) AS image_count,
        (SELECT COUNT(*) FROM comments WHERE item_id = i.id) AS comment_count
       FROM items i
       WHERE i.model_number = ?
       ORDER BY trim(i.sn) COLLATE NOCASE, i.title COLLATE NOCASE`
    )
    .all(modelNumber);

  res.json({
    model_number: modelNumber,
    comment_columns: getAllCommentColumnLabels(),
    items: rows.map((row) =>
      mapItemRow(row, {
        image_count: row.image_count,
        comment_count: row.comment_count,
      })
    ),
  });
});

export default router;
