import { handleGetCampsites, handleGetCampsite} from '../controllers/campsiteController.js';
import { handleGetMessagesByCampsite } from '../controllers/messageController.js';
import { handleGetReviewsByCampsite } from '../controllers/reviewController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protectRoute } from '../middlewares/protect.js';
import { sendJson } from '../utils/json.js';
import { parse } from 'url';
import { handlePostReview } from '../controllers/reviewController.js';
import { handlePostMessage } from '../controllers/messageController.js';  
export async function campsiteRoute(req, res) {
  const { pathname } = parse(req.url, true);
  const { method } = req;

  if (method === 'GET' && pathname === '/api/campsites') {
    return asyncHandler(protectRoute(handleGetCampsites))(req, res);
  }
  if(method=== 'GET' && pathname.startsWith('/api/campsites/')) {
    const parts = pathname.split('/');
    if (parts.length === 4 && parts[3]) {
      return asyncHandler(protectRoute(handleGetCampsite))(req, res);
    }
    if( parts.length === 5 && parts[3] && parts[4] === 'messages') {
      return asyncHandler(protectRoute(handleGetMessagesByCampsite))(req, res);
    }
    if( parts.length === 5 && parts[3] && parts[4] === 'reviews') {
      return asyncHandler(protectRoute(handleGetReviewsByCampsite))(req, res);
    }
  }
  if(method === 'POST' && pathname.startsWith('/api/campsites/')) {
    const parts = pathname.split('/');
    if (parts.length === 5 && parts[3]) {
      return asyncHandler(protectRoute(handlePostReview))(req, res);
    }
    if (parts.length === 5 && parts[3] && parts[4] === 'messages') {
      return asyncHandler(protectRoute(handlePostMessage))(req, res);
    }
  }
  sendJson(res, 405, { error: 'Method Not Allowed' });
}
