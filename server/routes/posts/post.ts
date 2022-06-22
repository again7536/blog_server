import express, { Request } from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import passport from 'lib/auth';
import fs from 'fs';

const router = express.Router({ mergeParams: true });

router
  .use(passport.initialize())
  .get('/', async (req: Request<{ id: string }>, res, next) => {
    try {
      // Open DB
      const db = await open({
        filename: 'db/blog.db',
        driver: sqlite3.Database,
      });

      const { id } = req.params;
      const rows = await db.all(`SELECT * FROM posts WHERE id=${id}`);
      await db.close();
      res.status(200).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  })
  .delete(
    '/',
    passport.authenticate('jwt', {
      failureRedirect: '/',
      session: false,
    }),
    async (req: Request<{ id: string }>, res, next) => {
      try {
        if ((req.user as any | undefined)?.authLevel !== 'admin') {
          res.status(500).end();
          throw Error('Unauthorized access occured');
        }

        const db = await open({
          filename: 'db/blog.db',
          driver: sqlite3.Database,
        });

        const { id } = req.params;
        fs.rmSync(`uploads/${id}`, { recursive: true, force: true });

        const result = await db.all(`DELETE FROM posts WHERE id=${id}`);

        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).end();
      }
    }
  );

export default router;
