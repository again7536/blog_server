import express from 'express';
import passport from '../../../lib/auth';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const router = express.Router();
router
  .use(passport.initialize())
  .get('/', passport.authenticate('oauth2'), async (req, res, next) => {
    res.end();
  })
  .get(
    '/callback',
    passport.authenticate('oauth2', {
      failureRedirect: '/',
      session: false,
    }),
    async (req, res, next) => {
      try {
        const { accessToken } = req.user as any;

        const result = await axios.get('https://api.github.com/user', {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        });

        const payload = jwt.sign(
          {
            accessToken,
            authLevel:
              result.data.login === process.env.ADMIN_ID ? 'admin' : 'user',
          },
          process.env.JWT_PRIVATE_KEY as string,
          { algorithm: 'ES256' }
        );

        res
          .cookie('jwt', payload, {
            maxAge: 7200000,
            sameSite: 'strict',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
          })
          .redirect('/');
      } catch (err) {
        console.error(err);
        res.redirect('/login');
      }
    }
  )
  .get(
    '/verify',
    passport.authenticate('jwt', { session: false }),
    async (req, res, next) => {
      if (!req.user) {
        res.status(403).end();
        return;
      }
      try {
        const { accessToken, authLevel } = req.user as any;

        res.status(200).json({
          authLevel,
        });
      } catch (err) {
        //console.error(err);
        res.status(500).end();
      }
    }
  );

export default router;
