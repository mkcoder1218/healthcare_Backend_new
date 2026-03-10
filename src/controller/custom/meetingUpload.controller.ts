import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createdModels } from "../../model/db";

const router = Router();
const VIDEO_FOLDER = path.join(__dirname, "../../uploads/video");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(VIDEO_FOLDER)) {
      fs.mkdirSync(VIDEO_FOLDER, { recursive: true });
    }
    cb(null, VIDEO_FOLDER);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const bookingId = req.body?.booking_id;
    if (!bookingId) {
      return res.status(400).json({ message: "booking_id is required" });
    }
    const uploaderUserId = req.body?.uploader_user_id || null;
    const fileUrl = `/uploads/video/${req.file.filename}`;

    const fileRecord = await createdModels.File.create({
      url: fileUrl,
      description: "Meeting recording",
      type: "Video",
    });

    const recording = await createdModels.Recording.create({
      booking_id: bookingId,
      uploader_user_id: uploaderUserId,
      file_id: (fileRecord as any).id,
    });

    return res.status(201).json({
      message: "Video uploaded",
      path: fileUrl,
      recording,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || "Upload failed" });
  }
});

export default router;
