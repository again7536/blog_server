import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import formidable from 'formidable';
import fs from 'fs';
import idRoute from './post';
import passport from 'lib/auth';

const router = express.Router();
router
  .use('/:id', idRoute)
  .use(passport.initialize())
  .get('/', async (req, res, next) => {
    try {
      // Open DB
      const db = await open({
        filename: 'db/blog.db',
        driver: sqlite3.Database,
      });
      const rows = await db.all('SELECT * FROM posts');
      db.close();

      res.status(200).json(rows);
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

        const id: [{ seq: number }] = await db.all(
          'SELECT * FROM SQLITE_SEQUENCE'
        );
        const seq = id[0]?.seq ?? 0;

        const basePath = 'uploads/' + (seq + 1);
        fs.mkdirSync(basePath);
        const form = formidable({
          uploadDir: basePath,
          filter: function ({ name }) {
            return (
              !!name && (name.includes('img') || name.includes('markdown'))
            );
          },
          filename: function (name, ext, part, form) {
            return `${new Date().getTime()}-${part.originalFilename}`;
          },
        });

        //resolve parsing with Promise
        const [fields, files] = await new Promise((resolve, reject) => {
          form.parse(req, (err, fields, files) => {
            if (err) {
              reject(err);
            }
            resolve([fields, files]);
          });
        });

        const { title, summary } = fields;
        const imgUrl = basePath + '/' + files.img.newFilename;
        const fileUrl = basePath + '/' + files.markdown.newFilename;

        const result = await db.all(
          `INSERT INTO posts (title, imgUrl, summary, fileUrl) VALUES ('${title}', '${imgUrl}', '${summary}', '${fileUrl}')`
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
