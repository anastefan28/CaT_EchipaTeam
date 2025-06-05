import { generateAuthUrl } from '../config/google.js';
import { handleGoogleCallback, handleLogin, handleRegister, handleLogout } from '../controllers/authController.js';
import { parse } from 'url';

export async function authRoute(req, res) {
  const { pathname } = parse(req.url, true);
  const { method } = req;
  if (pathname === '/api/auth/google') {
    const url = generateAuthUrl();
    res.writeHead(302, { Location: url });
    return res.end();
  }
  if (pathname === '/api/auth/google/callback') {
    return handleGoogleCallback(req, res);
  }
  if(method === 'POST' && pathname === '/api/auth/login')
    return handleLogin(req, res);

  if(method === 'POST' &&  pathname === '/api/auth/register')
    return handleRegister(req, res);

  if(method === 'POST' && pathname=== '/api/auth/logout')
    return handleLogout(req, res);
}
