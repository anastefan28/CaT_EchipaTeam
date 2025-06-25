import { parse }    from 'url';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  handleGetMedia,
  handlePostMedia,
  handleDeleteMedia,
} from "../controllers/mediaController.js";
import { sendJson } from '../utils/json.js';
import { protectRoute } from '../middlewares/protect.js';
import { validateBody } from '../middlewares/validate.js';
import { mediaSchema } from '../schemas/mediaSchema.js';

export async function mediaRoute(req, res) {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');          
  if (req.method === 'GET' && parts.length === 4 && parts[3]) {
    return asyncHandler(protectRoute()(handleGetMedia))(req, res, parts[3]);
  }
  if(req.method==='POST') {
    return asyncHandler(protectRoute() (handlePostMedia))(req, res);
  }

  if (req.method === "DELETE" && parts.length === 4 && parts[3]) {
    return asyncHandler(protectRoute('admin')(handleDeleteMedia))(req, res);
  }

  sendJson(res, 405, { error: 'Method Not Allowed' });
}
