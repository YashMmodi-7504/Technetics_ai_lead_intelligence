// Multer CSV upload middleware — memory storage, 10 MB limit, CSV files only.
import multer from "multer";
import type { RequestHandler } from "express";

const _multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
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
      res.status(400).json({ error: `Upload error: ${err.message}` });
      return;
    }
    if (err) {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
    next();
  });
};
