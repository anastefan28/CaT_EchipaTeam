import { parse }    from 'url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { handleGetMedia } from '../controllers/mediaController.js';
import { sendJson } from '../utils/json.js';
import { protectRoute } from '../middlewares/protect.js';
export async function mediaRoute(req, res) {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');          
  if (req.method === 'GET' && parts.length === 4 && parts[3]) {
    return asyncHandler(protectRoute(handleGetMedia))(req, res, parts[3]);
  }
  sendJson(res, 405, { error: 'Method Not Allowed' });
}
