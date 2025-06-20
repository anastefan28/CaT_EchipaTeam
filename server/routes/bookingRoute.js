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

export async function bookingRoute(req, res) {
  const { pathname } = parse(req.url, true);
  if (req.method === 'POST' && pathname === '/api/bookings')
    return asyncHandler(protectRoute(handlePostBooking))(req, res);
  
  if (req.method === "GET" && pathname === "/api/bookings") {
    return asyncHandler(protectRoute(handleGetAllBookings))(req, res, "admin");
  }

  if (req.method === "GET" && pathname.startsWith("/api/bookings/")) {
    return asyncHandler(protectRoute(handleGetBooking))(req, res, 'admin');

  }


  if (req.method === "DELETE" && pathname.startsWith("/api/bookings/")) {
    return asyncHandler(protectRoute(handleDeleteBooking))(req, res);
  }

  if (req.method === "PUT" && pathname.startsWith("/api/bookings/")) {
    return asyncHandler(protectRoute(handleUpdateBooking))(req, res);
  }

  sendJson(res, 405, { error: 'Method Not Allowed' });
}