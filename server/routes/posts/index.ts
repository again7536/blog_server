import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import idRoute from './post';
import passport from 'lib/auth';
import fs from 'fs';
import { extractSummary, extractTitle } from 'lib/extract';

const router = express.Router();
router
  .use(passport.initialize())
  .get('/count', async (req, res, next) => {
    try {
      // Open DB
      const db = await open({
        filename: 'db/blog.db',
        driver: sqlite3.Database,
      });
      // Get Highest Sequence from DB
      const id: [{ count: number }] = await db.all(
        'SELECT COUNT(*) AS count FROM posts'
      );
      const count = id[0]?.count ?? 0;

      await db.close();
      res.status(200).json(count);
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  })
  .get('/', async (req, res, next) => {
    try {
      const { limit, offset } = req.query;

      // Open DB
      const db = await open({
        filename: 'db/blog.db',
        driver: sqlite3.Database,
      });

      // get paginated posts or all posts
      const rows =
        limit && offset
          ? await db.all(`SELECT * FROM posts 
                          WHERE id > ${offset}
                          ORDER BY id
                          LIMIT ${limit}`)
          : await db.all('SELECT * FROM posts');

      await db.close();
      res.status(200).json({ posts: rows });
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  })
  .post(
    '/',
    passport.authenticate('jwt', {
      failureRedirect: '/',
      session: false,
    }),
    async (req, res, next) => {
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

        // Get Highest Sequence from DB
        const id: [{ seq: number }] = await db.all(
          'SELECT * FROM SQLITE_SEQUENCE'
        );
        const seq = id[0]?.seq ?? 0;

        // Upload files
        let imgUrl = null;
        const uploadPath = 'uploads/' + (seq + 1);
        if (fs.existsSync(uploadPath)) {
          const images = fs.readdirSync(uploadPath);
          imgUrl = uploadPath + '/' + images[0];
        }

        const { markdown, published } = req.body;
        const title = extractTitle(markdown, 50);
        const summary = extractSummary(markdown, 150);

        const result = await db.all(
          `INSERT INTO posts (title, summary, markdown, published, imgUrl) 
          VALUES ('${title}', '${summary}', '${markdown}', ${published}, '${imgUrl}')`
        );
        await db.close();

        res.status(200).json(id);
      } catch (err) {
        console.error(err);
        res.status(500).end();
      }
    }
  )
  .use('/:id', idRoute);

export default router;
