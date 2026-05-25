import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { UPLOADS_DIR } from "./db.js";
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
} from "./cloudinary.js";

const imageFilter = (_req, file, cb) => {
  if (/^image\//.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

/** Returns URL stored in DB (full Cloudinary URL or local filename). */
export async function saveUploadedFile(file, subfolder = "misc") {
  if (isCloudinaryConfigured()) {
    const result = await uploadToCloudinary(file, subfolder);
    return result.secure_url;
  }

  const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), file.buffer);
  return filename;
}

export async function saveUploadedFiles(files, subfolder = "misc") {
  if (!files?.length) return [];
  return Promise.all(files.map((f) => saveUploadedFile(f, subfolder)));
}

export function resolveImageUrl(stored) {
  if (!stored) return null;
  if (stored.startsWith("http://") || stored.startsWith("https://")) return stored;
  return `/uploads/${stored}`;
}

/** @deprecated use resolveImageUrl */
export function fileUrl(stored) {
  return resolveImageUrl(stored);
}
