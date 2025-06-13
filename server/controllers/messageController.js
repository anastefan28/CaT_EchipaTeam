import { getMessagesByCampsiteId } from '../models/messageModel.js';
import { sendJson ,json}                from '../utils/json.js';
import { AppError }                from '../utils/appError.js';
import { parse }                   from 'url';
import { createMessage }          from '../models/messageModel.js';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleGetMessagesByCampsite(req, res) {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const campsiteId = parts[3];
  if (!UUID_RE.test(campsiteId)) throw new AppError('Invalid campsite id', 400);

  const rows = await getMessagesByCampsiteId(campsiteId);
  sendJson(res, 200, rows);
}

export async function handlePostMessage(req, res) {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const campsiteId = parts[3];
  if (!UUID_RE.test(campsiteId)) 
    throw new AppError('Invalid campsite id', 400);
  const { body_md } = await json(req);
  if (!body_md?.trim()) 
    throw new AppError('body_md required', 400);

  const msg = await createMessage({
    campsiteId,
    userId : req.user.id,
    body   : body_md.trim()
  });
  sendJson(res, 201, msg);
}