import { handleMe, handlePatchMe } from "../controllers/userController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protectRoute } from "../middlewares/protect.js";
import { sendJson } from "../utils/json.js";
import { parse } from "url";
import { handleGetMyBookings } from '../controllers/bookingController.js';
import { handleGetAllUsers, handleCreateUser, handleDeleteUser, handleGetUserById, handleUpdateUser } from '../controllers/userController.js';
export async function userRoute(req, res) {
  const { pathname } = parse(req.url, true);
  const { method } = req;

  if (method === "GET" && pathname === "/api/me") {
    return asyncHandler(protectRoute(handleMe))(req, res);
  }
  if (method === "PATCH" && pathname==="/api/me") {
    return asyncHandler(protectRoute(handlePatchMe))(req, res);
  }
  if (method === 'GET' && pathname === '/api/me/bookings') {
    return asyncHandler(protectRoute(handleGetMyBookings))(req, res);
  }
  if (method === "GET" && pathname === "/api/users") {
    return asyncHandler(protectRoute(handleGetAllUsers))(req, res, 'admin');
  }
  if (method === "GET" && pathname.startsWith("/api/users/")) {
    return asyncHandler(protectRoute(handleGetUserById))(req, res, 'admin');
  }
  if (method === "POST" && pathname === "/api/users") {
    return asyncHandler(protectRoute(handleCreateUser))(req, res, 'admin');
  }
  if (method === "DELETE" && pathname.startsWith("/api/users/")) {
    return asyncHandler(protectRoute(handleDeleteUser))(req, res, 'admin');
  }
  if (method === "PUT" && pathname.startsWith("/api/users/")) {
      return asyncHandler(protectRoute(handleUpdateUser))(req, res);
    }
  sendJson(res, 405, { error: "Method Not Allowed" });
}
