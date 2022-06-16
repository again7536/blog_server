import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import passport from 'passport';

const cookieExtractor = function (req: any) {
  var token = null;
  if (req && req.cookies) {
    token = req.cookies['jwt'];
  }
  return token;
};

export default passport
  .use(
    new OAuth2Strategy(
      {
        authorizationURL: 'https://github.com/login/oauth/authorize',
        tokenURL: 'https://github.com/login/oauth/access_token',
        clientID: process.env.CLIENT_ID as string,
        clientSecret: process.env.CLIENT_SECRET as string,
        callbackURL:
          process.env.NODE_ENV === 'development'
            ? 'http://lvh.me:3000/api/auth/callback'
            : 'https://shorecrabs.site/api/auth/callback',
        scope: 'read:user',
      },
      function (
        accessToken: string,
        refreshToken: string,
        profile: string,
        cb: (err: null | Error, res: any) => void
      ) {
        cb(null, { accessToken, profile });
      }
    )
  )
  .use(
    new JwtStrategy(
      {
        jwtFromRequest: cookieExtractor,
        secretOrKey: process.env.JWT_PUBLIC_KEY,
        //issuer: 'accounts.examplesoft.com',
        //audience: 'yoursite.net',
        algorithms: ['ES256'],
      },
      function (jwt_payload, done) {
        if (jwt_payload) done(null, jwt_payload);
        else done(Error('no payload'), null);
      }
    )
  );
