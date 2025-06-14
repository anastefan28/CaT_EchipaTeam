import { handleMe } from "../controllers/userController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protectRoute } from "../middlewares/protect.js";
import { sendJson } from "../utils/json.js";
import { parse } from "url";

export async function userRoute(req, res) {
  const { pathname } = parse(req.url, true);
  const { method } = req;

  if (method === "GET" && pathname === "/api/me") {
    return asyncHandler(protectRoute(handleMe))(req, res);
  }

  sendJson(res, 405, { error: "Method Not Allowed" });
}
