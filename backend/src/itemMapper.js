import { resolveImageUrl } from "./upload.js";
import { ITEM_DATA_KEYS, getCommentCells } from "./schema.js";

export function mapItemRow(row, extras = {}) {
  const base = {
    id: row.id,
    model_number: row.model_number ?? null,
    sn: row.sn ?? null,
    title: row.title,
    main_image: resolveImageUrl(row.main_image),
    created_at: row.created_at,
    updated_at: row.updated_at,
    comment_cells: getCommentCells(row.id),
  };

  for (const key of ITEM_DATA_KEYS) {
    base[key] = row[key] ?? null;
  }

  return { ...base, ...extras };
}

export function pickItemBody(body) {
  const data = {};
  if (body.model_number !== undefined) {
    data.model_number = body.model_number?.trim() || null;
  }
  if (body.sn !== undefined) data.sn = body.sn?.trim()?.slice(0, 8) || null;
  if (body.title !== undefined) data.title = body.title?.trim() || "";
  for (const key of ITEM_DATA_KEYS) {
    if (body[key] !== undefined) data[key] = body[key]?.trim() || null;
  }
  return data;
}

/** Merge request body onto existing row for PUT (all sent fields are applied). */
export function mergeItemUpdate(row, body) {
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
  const merged = {
    model_number: has("model_number")
      ? body.model_number?.trim() || null
      : row.model_number,
    title: has("title") ? body.title?.trim() || row.title : row.title,
    sn: has("sn") ? body.sn?.trim()?.slice(0, 8) || null : row.sn,
  };
  for (const key of ITEM_DATA_KEYS) {
    merged[key] = has(key) ? body[key]?.trim() || null : row[key];
  }
  return merged;
}
