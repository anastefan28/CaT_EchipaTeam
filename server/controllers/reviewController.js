import { getReviewsByCampsiteId } from '../models/reviewModel.js';
import { sendJson, json } from '../utils/json.js';
import { AppError } from '../utils/appError.js';
import { parse } from 'url';
import { createReview } from '../models/reviewModel.js';
import { isValidId } from '../utils/valid.js';


export async function handleGetReviewsByCampsite(req, res) {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const campsiteId = parts[3];
  if (!isValidId(campsiteId)) 
    throw new AppError('Invalid campsite id', 400);

  const rows = await getReviewsByCampsiteId(campsiteId);
  sendJson(res, 200, rows);
}

export async function handlePostReview(req, res) {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const campsiteId = parts[3];
  if (!isValidId(campsiteId)) 
    throw new AppError('Invalid campsite id', 400);
  const { rating, body_md } = await json(req);
  if (![1, 2, 3, 4, 5].includes(rating))
    throw new AppError('rating must be 1-5', 400);

  try {
    const review = await createReview({
      campsiteId,
      userId : req.user.id,
      rating,
      body: body_md.trim()
    });
    return sendJson(res, 201, review);        

  } catch (err) {
    if (err.code === '23505')
      throw new AppError('You have already reviewed this campsite', 409);
    throw err;                              
  }
}