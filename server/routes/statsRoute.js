import { parse } from "url";
import { asyncHandler } from "../utils/asyncHandler.js";
import { protectRoute } from "../middlewares/protect.js";
import {handleAdminStats} from "../controllers/statsController.js";
import { sendJson } from "../utils/json.js";

export async function statsRoute(req, res) {
  const { pathname } = parse(req.url, true);
  const { method } = req;

  if (method === "GET" && pathname === "/api/stats") {
    return asyncHandler(protectRoute(handleAdminStats))(req, res, 'admin');
  }
  sendJson(res, 405, { error: "Method Not Allowed" });
}
