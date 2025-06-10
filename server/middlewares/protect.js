import { getJWT, verifyJWT } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';
import { getUserById } from '../models/userModel.js';

export const protectRoute = (handler) => async (req, res) => {
	const token = getJWT(req);
	if (!token) throw new AppError('Not authenticated.', 401);

	const payload = verifyJWT(token);
	const user = await getUserById(payload.id);
	if (!user) throw new AppError('User not found.', 401);

	req.user = user;
	return handler(req, res);
};
