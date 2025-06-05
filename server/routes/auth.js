import { generateAuthUrl } from '../config/google.js';
import { handleGoogleCallback } from '../controllers/authController.js';
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
}
