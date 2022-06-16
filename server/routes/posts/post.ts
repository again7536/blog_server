import express, { Request } from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import passport from 'lib/auth';

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

      const markdown = fs.readFileSync(rows[0].fileUrl).toString();
      db.close();
      res.status(200).json({ markdown });
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
        const result = await db.all(`DELETE FROM posts WHERE id=${id}`);

        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).end();
      }
    }
  )
  .patch(
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
        const { title, imgUrl, summary, fileUrl } = req.body;
        const result = await db.all(
          `UPDATE posts 
        SET title='${title}', imgUrl='${imgUrl}', summary='${summary}', fileUrl='${fileUrl}') 
        WHERE id=${id}`
        );
        db.close();
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).end();
      }
    }
  );

export default router;
