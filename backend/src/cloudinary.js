import { createRequire } from "module";

const require = createRequire(import.meta.url);
const cloudinary = require("cloudinary").v2;

const FOLDER_ROOT = process.env.CLOUDINARY_FOLDER || "shoe-dev";

export function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function initCloudinary() {
  if (!isCloudinaryConfigured()) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

export function uploadToCloudinary(file, subfolder) {
  return new Promise((resolve, reject) => {
    const folder = `${FOLDER_ROOT}/${subfolder}`;
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}

export function publicIdFromUrl(url) {
  if (!url?.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return null;
  return decodeURIComponent(match[1].replace(/\.[^/.]+$/, ""));
}

export async function destroyCloudinaryAsset(stored) {
  if (!isCloudinaryConfigured() || !stored) return;
  const publicId = stored.startsWith("http") ? publicIdFromUrl(stored) : null;
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Cloudinary delete failed:", publicId, err.message);
  }
}
