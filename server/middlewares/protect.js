import { getJWT, verifyJWT } from '../utils/jwt.js';
import { AppError }         from '../utils/appError.js';
import { getUserById }      from '../models/userModel.js';

export const protectRoute = (handler) => async (req, res,requiredRole, next) => {

    const token = getJWT(req);
    if (!token) {
      throw new AppError('Not authenticated.', 401);
    }
    let payload;
    try {
      payload = verifyJWT(token);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Your session has expired. Please log in again.'
          : 'Invalid authentication token.';
      throw new AppError(message, 401);
    }
    if(!requiredRole || requiredRole === undefined) {
      requiredRole = 'member';
    }
    const user = await getUserById(payload.id);
    if (!user) {
      throw new AppError('Unauthorized.', 403);
    }
    if (user.role !== requiredRole && user.role !== 'admin') {
      throw new AppError('Forbidden: You do not have permission to access this resource.', 403);
    }
    req.user = user;
    return handler(req, res, next);

};