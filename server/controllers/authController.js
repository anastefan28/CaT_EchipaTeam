import { googleClient, nonce } from '../config/google.js';
import { findUserByOAuthSub, createOAuthUser } from '../models/userModel.js';
import { generateJWT } from '../utils/jwt.js';
import { serialize } from 'cookie';
import { findUserByEmail, validatePassword, createUser } from '../models/userModel.js';
import { sendJson, json } from '../utils/json.js';
import bcrypt from 'bcrypt';

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


export async function handleLogin(req, res) {
  try {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const { email, password } = JSON.parse(body);

      if (!email || !password) {
        sendJson(res, 400,{error: 'Email and password are required.' });
      }

      const user = await findUserByEmail(email);
      if (!user || !(await validatePassword(password, user.password))) {
        sendJson(res, 401, { error: 'Invalid credentials. If you don’t have an account, please register first.' });
      }
      const token = generateJWT(user);

      res.writeHead(302, {
        'Set-Cookie': serialize('token', token, {
          httpOnly: true,
          path: '/',
          maxAge: 3600,
        }),
        Location: '/dashboard'
      });
      res.end();
    });
  } catch (err) {
    console.error(err);
    sendJson(res,500,{ error: 'Server error' });
  }
}

export async function handleRegister(req, res) {
  try {
    const body = await json(req);
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return sendJson(res, 400, { error: 'All fields are required.' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return sendJson(res, 409, { error: 'Email is already registered.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({ username, email, password: hashed });
    const token = generateJWT(user);

    res.writeHead(302, {
      'Set-Cookie': serialize('token', token, {
        httpOnly: true,
        path: '/',
        maxAge: 3600
      }),
      Location: '/dashboard'
    });
    res.end();
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: 'Internal server error' });
  }
}