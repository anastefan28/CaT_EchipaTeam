import { getMessagesByCampsiteId } from '../models/messageModel.js';
import { sendJson } from '../utils/json.js';
import { AppError } from '../utils/appError.js';
import { parse } from 'url';
import { createMessage } from '../models/messageModel.js';
import { isValidId } from '../utils/valid.js';

export async function handleGetMessagesByCampsite(req, res) {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const campsiteId = parts[3];
  if (!isValidId(campsiteId)) 
    throw new AppError('Invalid campsite id', 400);

  const rows = await getMessagesByCampsiteId(campsiteId);
  sendJson(res, 200, rows);
}

export async function handlePostMessage(req, res) {
  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/');
  const campsiteId = parts[3];
  if (!isValidId(campsiteId)) 
    throw new AppError('Invalid campsite id', 400);
  const { body_md } = req.body;
  const msg = await createMessage({campsiteId,userId : req.user.id,body: body_md.trim()});
  sendJson(res, 201, msg);
}