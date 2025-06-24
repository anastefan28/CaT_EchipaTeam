import { AppError } from '../utils/appError.js';
import { json }     from '../utils/json.js';

export const validateBody =
  (schema) => (handler) => async (req, res) => {
    const data = await json(req);
    let msg;
    try {
      const parsed = schema.parse(data);   
      req.body = parsed;                  
    } catch (err) {
      msg = err.errors
        ? err.errors.map(e => e.message).join(', ')
        : err.message;
      throw new AppError(msg, 400);
    }
    return handler(req, res);
  };
