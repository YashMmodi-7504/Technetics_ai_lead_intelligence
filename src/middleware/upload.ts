// Multer CSV upload middleware — memory storage, 100 MB limit, CSV files only.
import multer from "multer";
import type { RequestHandler } from "express";

// Maximum CSV upload size. Keep in sync with the frontend guard/copy in
// src/pages/ImportLeads.tsx.
const MAX_UPLOAD_MB = 100;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024; // 100 MB

const _multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES }, // 100 MB
  fileFilter: (_req, file, cb) => {
    const okMime = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/csv",
      "text/plain",
    ];
    const okExt = file.originalname.toLowerCase().endsWith(".csv");
    if (okMime.includes(file.mimetype) || okExt) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are accepted (.csv)"));
    }
  },
});

export const csvUpload: RequestHandler = (req, res, next) => {
  _multerInstance.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? `File exceeds the ${MAX_UPLOAD_MB} MB limit.`
          : `Upload error: ${err.message}`;
      res.status(400).json({ error: message });
      return;
    }
    if (err) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
    next();
  });
};
