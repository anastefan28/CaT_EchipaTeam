import { getAdminStats } from "../models/statsModel.js";
import { sendJson } from "../utils/json.js";

export async function handleAdminStats(req, res) {
  const stats = await getAdminStats();
  sendJson(res, 200, stats);
}






