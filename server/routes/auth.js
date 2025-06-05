import { generateAuthUrl } from '../config/google.js';
import { handleGoogleCallback, handleLogin, handleRegister } from '../controllers/authController.js';
import { parse } from 'url';

export async function authRoute(req, res) {
  const { pathname } = parse(req.url, true);

  if (pathname === '/api/auth/google') {
    const url = generateAuthUrl();
    res.writeHead(302, { Location: url });
    return res.end();
  }

  if (pathname === '/api/auth/google/callback') {
    return handleGoogleCallback(req, res);
  }

  if(pathname === '/api/auth/login')
    return handleLogin(req, res);

  if(pathname === '/api/auth/register')
    return handleRegister(req, res);
}
