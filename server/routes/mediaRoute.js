import { parse }    from 'url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { handleGetMedia } from '../controllers/mediaController.js';
import { sendJson } from '../utils/json.js';

export async function mediaRoute(req, res) {
  const { pathname } = parse(req.url, true);
  console.log('Media route pathname:', pathname);
  const parts = pathname.split('/');          
  console.log('Media route parts:', parts);
  if (req.method === 'GET' && parts.length === 4 && parts[3]) {
    return asyncHandler(handleGetMedia)(req, res, parts[3]);
  }
  sendJson(res, 405, { error: 'Method Not Allowed' });
}
