import { googleClient, nonce } from '../config/google.js';
import { findUserByOAuthSub, createOAuthUser } from '../models/userModel.js';
import { generateJWT } from '../utils/jwt.js';
import { serialize } from 'cookie';

export async function handleGoogleCallback(req, res) {
  const params = googleClient.callbackParams(req);

  const tokenSet = await googleClient.callback(
    'http://localhost:8000/api/auth/google/callback',
    params,
    { nonce }
  );
  const userinfo = await googleClient.userinfo(tokenSet.access_token);

  let user = await findUserByOAuthSub(userinfo.sub);
  if (!user) {
    user = await createOAuthUser({
      email: userinfo.email,
      username: userinfo.name,
      oauth_provider: 'google',
      oauth_sub: userinfo.sub,
    });
  }

  const jwtToken = generateJWT(user);
  res.writeHead(302, {
    'Set-Cookie': serialize('token', jwtToken, {
      httpOnly: true,
      path: '/',
      maxAge: 3600,
    }),
    Location: '/dashboard'
  });
  res.end();
}
