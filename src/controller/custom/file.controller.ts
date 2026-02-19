import { Router } from "express";
import multer from "multer";
import path from "path";
import { FileService } from "../../service/custom/file.service";
import fs from "fs";
const UPLOADS_FOLDER = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOADS_FOLDER)) {
      fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
    }
    cb(null, UPLOADS_FOLDER);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });
const router = Router();
const fileService = new FileService();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No File uploaded" });
    }
    const saveFile = await fileService.fileSave(req.file, req.body);
    res.json(saveFile);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});
export default router;
