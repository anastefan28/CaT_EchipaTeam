import { handleMe, handlePatchMe } from "../controllers/userController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protectRoute } from "../middlewares/protect.js";
import { sendJson } from "../utils/json.js";
import { parse } from "url";
import { handleGetMyBookings } from '../controllers/bookingController.js';
import { handleGetRecommendations } from '../controllers/campsiteController.js';
import { handleGetAllUsers, handleCreateUser, handleDeleteUser, handleGetUserById, handleUpdateUser } from '../controllers/userController.js';
import { validateBody } from '../middlewares/validate.js';
import { userSchema, userUpdateSchema, userPatchSchema } from '../schemas/userSchema.js';
export async function userRoute(req, res) {
  const { pathname } = parse(req.url, true);
  const { method } = req;

  if (method === "GET" && pathname === "/api/me") {
    return asyncHandler(protectRoute()(handleMe))(req, res);
  }
  if (method === "PATCH" && pathname==="/api/me") {
    return asyncHandler(protectRoute()(validateBody(userPatchSchema)(handlePatchMe)))(req, res);
  }
  if (method === 'GET' && pathname === '/api/me/bookings') {
    return asyncHandler(protectRoute()(handleGetMyBookings))(req, res);
  }
  if(method==='GET' && pathname.startsWith('/api/me/recommendations')) {
    return asyncHandler(protectRoute()(handleGetRecommendations))(req, res);
  }
  if (method === "GET" && pathname.startsWith("/api/users/")) {
    return asyncHandler(protectRoute('admin')(handleGetUserById))(req, res);
  }
   if (method === "GET" && pathname === "/api/users") {
    return  asyncHandler(protectRoute('admin')(handleGetAllUsers))(req, res);
  }
  if (method === "POST" && pathname === "/api/users") {
    return asyncHandler(protectRoute('admin')(validateBody(userSchema)
            (handleCreateUser)))(req, res);
  }
  if (method === "DELETE" && pathname.startsWith("/api/users/")) {
    return asyncHandler(protectRoute('admin')(handleDeleteUser))(req, res);
  }
  if (method === "PUT" && pathname.startsWith("/api/users/")) {
      return asyncHandler(protectRoute('admin')(validateBody(userUpdateSchema)
              (handleUpdateUser)))(req, res);
    }
  sendJson(res, 405, { error: "Method Not Allowed" });
}
