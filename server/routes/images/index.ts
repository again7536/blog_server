import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import passport from 'lib/auth';
import multer from 'multer';
import { createDir } from 'lib/path-utils';

const storage = multer.diskStorage({
  async destination(req, file, cb) {
    // Open DB
    const db = await open({
      filename: 'db/blog.db',
      driver: sqlite3.Database,
    });

    let id = req.query.id ? +req.query.id : null;
    const { absolutePath, relativePath } = await createDir(db, id);

    await db.close();
    cb(null, relativePath);
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
