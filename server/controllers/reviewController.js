import { getReviewsByCampsiteId } from '../models/reviewModel.js';
import { sendJson } from '../utils/json.js';
import { AppError } from '../utils/appError.js';
import { parse } from 'url';
import { createReview } from '../models/reviewModel.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleGetReviewsByCampsite(req, res) {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const campsiteId = parts[3];
  if (!UUID_RE.test(campsiteId)) throw new AppError('Invalid campsite id', 400);

  const rows = await getReviewsByCampsiteId(campsiteId);
  sendJson(res, 200, rows);
}

export async function handlePostReview(req, res) {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const campsiteId = parts[3];
  if (!UUID_RE.test(campsiteId)) 
    throw new AppError('Invalid campsite id', 400);
  const { rating, body_md } = await json(req);
  //TO DO: check params
  if (![1, 2, 3, 4, 5].includes(rating))
    throw new AppError('rating must be 1-5', 400);

  const review = await createReview({
    campsiteId,
    userId: req.user.id,
    rating,
    body: body_md?.trim() ?? ''
  });

  sendJson(res, 201, review);
}