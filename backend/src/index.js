import "dotenv/config";
import express from "express";
import cors from "cors";
import "./db.js";
import { UPLOADS_DIR } from "./db.js";
import { initCloudinary, isCloudinaryConfigured } from "./cloudinary.js";
import authRoutes from "./routes/auth.js";
import itemRoutes from "./routes/items.js";
import modelRoutes from "./routes/models.js";

const PORT = process.env.PORT || 3001;
const cloudinaryReady = initCloudinary();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

if (!isCloudinaryConfigured()) {
  app.use("/uploads", express.static(UPLOADS_DIR));
}
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/models", modelRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    apiVersion: 2,
    features: { modelNumber: true, sheetColumns: true },
    imageStorage: cloudinaryReady ? "cloudinary" : "local",
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`Shoe Dev API running at http://localhost:${PORT}`);
  console.log(
    cloudinaryReady
      ? "Image storage: Cloudinary"
      : "Image storage: local (set CLOUDINARY_* in backend/.env for Cloudinary)"
  );
});
