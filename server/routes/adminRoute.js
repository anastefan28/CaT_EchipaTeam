import { parse } from "url";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protectRoute } from "../middlewares/protect.js";
import {
  handleAdminUsers,
  handleCreateUser,
  handleAdminCampsites,
  handleAdminStats,
  handleAdminBookings,
  handleDeleteUser,
  handleCreateCampsite,
  handleDeleteCampsite,
  handleGetUserById,
  handleGetCampsiteById,
  handleUpdateUser,
  handleUpdateCampsite,
} from "../controllers/adminController.js";
import { sendJson } from "../utils/json.js";
import path from "path";

export async function adminRoute(req, res) {
  const { pathname } = parse(req.url, true);
  const { method } = req;

  if (method === "GET" && pathname === "/api/admin/users") {
    return asyncHandler(protectRoute(handleAdminUsers))(req, res);
  }

  if (method === "POST" && pathname === "/api/admin/users") {
    return asyncHandler(protectRoute(handleCreateUser))(req, res);
  }

  if (method === "GET" && pathname === "/api/admin/campsites") {
    return asyncHandler(protectRoute(handleAdminCampsites))(req, res);
  }

  if (method === "GET" && pathname === "/api/admin/stats") {
    return asyncHandler(protectRoute(handleAdminStats))(req, res);
  }

  if (method === "GET" && pathname === "/api/admin/bookings") {
    return asyncHandler(protectRoute(handleAdminBookings))(req, res);
  }

  if (method === "DELETE" && pathname.startsWith("/api/admin/users/")) {
    return asyncHandler(protectRoute(handleDeleteUser))(req, res);
  }

  if (method === "POST" && pathname === "/api/admin/campsites") {
    return asyncHandler(protectRoute(handleCreateCampsite))(req, res);
  }

  if (method === "DELETE" && pathname.startsWith("/api/admin/campsites/")) {
    return asyncHandler(protectRoute(handleDeleteCampsite))(req, res);
  }

  if (method === "GET" && pathname.startsWith("/api/admin/users/")) {
    return asyncHandler(protectRoute(handleGetUserById))(req, res);
  }

  if (method === "GET" && pathname.startsWith("/api/admin/campsites/")) {
    return asyncHandler(protectRoute(handleGetCampsiteById))(req, res);
  }

  if (method === "PUT" && pathname.startsWith("/api/admin/users/")) {
    return asyncHandler(protectRoute(handleUpdateUser))(req, res);
  }

  if (method === "PUT" && pathname.startsWith("/api/admin/campsites/")) {
    return asyncHandler(protectRoute(handleUpdateCampsite))(req, res);
  }

  sendJson(res, 405, { error: "Method Not Allowed" });
}
