import { parse } from 'url';
import {
  handleGetAllBookings,
  handlePostBooking,
  handleDeleteBooking,
  handleGetBooking,
  handleUpdateBooking,
} from "../controllers/bookingController.js";
import { asyncHandler } from '../utils/asyncHandler.js';
import { protectRoute } from '../middlewares/protect.js';
import { sendJson } from '../utils/json.js';
import { validateBody } from '../middlewares/validate.js';
import { bookingSchema} from '../schemas/bookingSchema.js';

export async function bookingRoute(req, res) {
  const { pathname } = parse(req.url, true);
  if (req.method === 'POST' && pathname === '/api/bookings')
    return asyncHandler(protectRoute()(validateBody(bookingSchema)
            (handlePostBooking)))(req, res);
  
  if (req.method === "GET" && pathname === "/api/bookings") {
    return asyncHandler(protectRoute('admin')(handleGetAllBookings))(req, res);
  }

  if (req.method === "GET" && pathname.startsWith("/api/bookings/")) {
    return asyncHandler(protectRoute('admin')(handleGetBooking))(req, res);

  }
  if (req.method === "DELETE" && pathname.startsWith("/api/bookings/")) {
    return asyncHandler(protectRoute()(handleDeleteBooking))(req, res);
  }

  if (req.method === "PUT" && pathname.startsWith("/api/bookings/")) {
    return asyncHandler(protectRoute('admin')(validateBody(bookingSchema)
          (handleUpdateBooking)))(req, res);
  }
  sendJson(res, 405, { error: 'Method Not Allowed' });
}