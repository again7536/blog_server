import express, { Request } from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import passport from 'lib/auth';
import { extractTitle, extractSummary } from 'lib/extract';

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

        // Open DB
        const db = await open({
          filename: 'db/blog.db',
          driver: sqlite3.Database,
        });

        const { id, markdown, published } = req.body;

        // Upload files
        let imgUrl = null;
        const uploadPath = 'uploads/' + (id + 1);
        if (fs.existsSync(uploadPath)) {
          const images = fs.readdirSync(uploadPath);
          imgUrl = uploadPath + '/' + images[0];
        }

        const title = extractTitle(markdown, 50);
        const summary = extractSummary(markdown, 150);

        const result = await db.all(
          `UPDATE posts 
          SET title='${title}', summary='${summary}', markdown='${markdown}', published=${published}, imgUrl='${imgUrl}'
          WHERE id=${id}
          `
        );
        await db.close();
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).end();
      }
    }
  );

export default router;
