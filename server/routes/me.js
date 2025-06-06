import { handleMe } from '../controllers/userController.js';

export async function meRoute(req, res) {
  if (req.method === 'GET') {
    return handleMe(req, res);
  }

  res.writeHead(405);
  res.end(JSON.stringify({ error: 'Method Not Allowed' }));
}
