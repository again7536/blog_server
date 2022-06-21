import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import passport from 'lib/auth';
import multer from 'multer';

const storage = multer.diskStorage({
  async destination(req, file, cb) {
    // Open DB
    const db = await open({
      filename: 'db/blog.db',
      driver: sqlite3.Database,
    });
    // Get Highest Sequence from DB
    const id: [{ seq: number }] = await db.all('SELECT * FROM SQLITE_SEQUENCE');
    const seq = id[0]?.seq ?? 0;

    // Upload files
    const uploadPath = 'uploads/' + (seq + 1);
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    await db.close();

    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const router = express.Router();
router.use(passport.initialize()).post(
  '/',
  passport.authenticate('jwt', {
    failureRedirect: '/',
    session: false,
  }),
  upload.single('image'),
  async (req, res, next) => {
    try {
      if ((req.user as any | undefined)?.authLevel !== 'admin') {
        res.status(500).end();
        throw Error('Unauthorized access occured');
      }
      if (!req.file) {
        res.status(500).end();
        return;
      }

      const imgPath = `/${req.file.destination}/${req.file.filename}`;

      res.status(200).json(imgPath);
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  }
);

export default router;
