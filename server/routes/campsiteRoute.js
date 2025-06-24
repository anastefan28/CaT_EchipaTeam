import { handleGetCampsites, handleGetCampsite, handleCreateCampsite, 
  handleDeleteCampsite ,handleUpdateCampsite} from '../controllers/campsiteController.js';
import { handleGetMessagesByCampsite } from '../controllers/messageController.js';
import { handleGetReviewsByCampsite } from '../controllers/reviewController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protectRoute } from '../middlewares/protect.js';
import { sendJson } from '../utils/json.js';
import { parse } from 'url';
import { handlePostReview } from '../controllers/reviewController.js';
import { handlePostMessage } from '../controllers/messageController.js';
import { handleBookedRanges } from '../controllers/bookingController.js';
import { validateBody} from '../middlewares/validate.js';
import { campsiteSchema} from '../schemas/campsiteSchema.js';
import{reviewSchema} from '../schemas/reviewSchema.js';
import { messageSchema } from '../schemas/messageSchema.js';

export async function campsiteRoute(req, res) {
  const { pathname } = parse(req.url, true);
  const { method } = req;

  if (method === 'GET' && pathname === '/api/campsites') {
    return asyncHandler(protectRoute()(handleGetCampsites))(req, res);
  }

  if (method === 'GET' && pathname.startsWith('/api/campsites/')) {
    const parts = pathname.split('/');
    if (parts.length === 4 && parts[3]) {
      return asyncHandler(protectRoute()(handleGetCampsite))(req, res);
    }
    if (parts.length === 5 && parts[3] && parts[4] === 'messages') {
      return asyncHandler(protectRoute()(handleGetMessagesByCampsite))(req, res);
    }
    if (parts.length === 5 && parts[3] && parts[4] === 'reviews') {
      return asyncHandler(protectRoute()(handleGetReviewsByCampsite))(req, res);
    }
    if (parts.length === 5 && parts[3] && parts[4] === 'booked') {
      return asyncHandler(protectRoute()(handleBookedRanges))(req, res);
    }
  }

  if (method === 'POST') {
    if (pathname === "/api/campsites") {
      return asyncHandler(protectRoute('admin')(validateBody(campsiteSchema)
              (handleCreateCampsite)))(req, res);
    }
    const parts = pathname.split('/');
    if (parts.length === 5 && parts[3] && parts[4] === 'reviews') {
      return asyncHandler(protectRoute()(validateBody(reviewSchema)
            (handlePostReview)))(req, res);
    }
    if (parts.length === 5 && parts[3] && parts[4] === 'messages') {
      return asyncHandler(protectRoute()(validateBody(messageSchema)
              (handlePostMessage)))(req, res);
    }
  }

  if (method === "DELETE" && pathname.startsWith("/api/campsites/")) {
    return asyncHandler(protectRoute('admin')(handleDeleteCampsite))(req, res);
  }

  if (method === "PUT" && pathname.startsWith("/api/campsites/")) {
    return asyncHandler(protectRoute('admin')( validateBody(campsiteSchema)
            (handleUpdateCampsite)))(req, res);
  }
  sendJson(res, 405, { error: 'Method Not Allowed' });
}
