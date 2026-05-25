import db from "./db.js";
import { destroyCloudinaryAsset } from "./cloudinary.js";

export function itemIdsForModel(modelNumber) {
  const key = decodeURIComponent(modelNumber);
  if (key === "Unassigned") {
    return db
      .prepare(
        `SELECT id FROM items
         WHERE model_number IS NULL OR trim(model_number) = ''`
      )
      .all()
      .map((r) => r.id);
  }
  return db
    .prepare("SELECT id FROM items WHERE model_number = ?")
    .all(key)
    .map((r) => r.id);
}

export async function deleteItemById(id) {
  const row = db.prepare("SELECT id, main_image FROM items WHERE id = ?").get(id);
  if (!row) return false;

  const images = db
    .prepare("SELECT file_path FROM item_images WHERE item_id = ?")
    .all(row.id);
  const commentImages = db
    .prepare(
      `SELECT ci.file_path FROM comment_images ci
       JOIN comments c ON c.id = ci.comment_id WHERE c.item_id = ?`
    )
    .all(row.id);

  await Promise.all([
    destroyCloudinaryAsset(row.main_image),
    ...images.map((i) => destroyCloudinaryAsset(i.file_path)),
    ...commentImages.map((i) => destroyCloudinaryAsset(i.file_path)),
  ]);

  db.prepare("DELETE FROM items WHERE id = ?").run(row.id);
  return true;
}

export async function deleteItemsByIds(ids) {
  for (const id of ids) {
    await deleteItemById(id);
  }
}
