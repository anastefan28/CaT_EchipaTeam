import { verifyJWT , getJWT} from "../utils/jwt.js";
import { getUserById } from "../models/userModel.js";
import { sendJson } from "../utils/json.js";
import { AppError } from "../utils/appError.js";

export async function handleMe(req, res) {
  const token = getJWT(req);
  const payload = verifyJWT(token);
  if (!payload) {
    throw new AppError('Invalid token', 401);
  }

  const user = await getUserById(payload.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  sendJson(res, 200, user);
}

