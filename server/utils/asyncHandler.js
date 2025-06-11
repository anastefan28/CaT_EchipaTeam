import { AppError } from './appError.js';
import { sendJson } from './json.js';

export const asyncHandler = (fn) => (req, res) => {
	Promise.resolve(fn(req, res)).catch((err) => {
		console.error(err);
		if (err instanceof AppError) {
			sendJson(res, err.statusCode, { error: err.message });
		} else {
			sendJson(res, 500, { error: 'Internal Server Error' });
		}
	});
};