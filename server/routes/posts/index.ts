import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import idRoute from './post';
import passport from 'lib/auth';
import { extractAndClear, removeUnusedImage } from 'lib/extract';
import { createDir } from 'lib/path-utils';
import fs from 'fs';
import path from 'path';

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
                          WHERE published = true
                          LIMIT ${limit}
                          OFFSET ${offset}`)
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
        const { markdown, published } = req.body;
        const { title, summary, imgUrl, imageNodes } =
          extractAndClear(markdown);

        // Open DB
        const db = await open({
          filename: 'db/blog.db',
          driver: sqlite3.Database,
        });

        let id = req.query.id ? +req.query.id : null;
        const { absolutePath, relativePath, param } = await createDir(db, id);
        id = param;
        removeUnusedImage(relativePath, imageNodes);

        // upsert
        await db.all(`
          INSERT INTO posts (id, title, summary, markdown, published, imgUrl) 
          VALUES(${id}, '${title}', '${summary}', '${markdown}', ${published}, '${imgUrl}')
          ON CONFLICT(id)
          DO UPDATE SET title='${title}', summary='${summary}', markdown='${markdown}', published=${published}, imgUrl='${imgUrl}'
        `);

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
