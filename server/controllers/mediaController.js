import { AppError } from '../utils/appError.js';
import { getMediaById , createMedia} from '../models/mediaModel.js';
import { parse }    from 'url';
import { isValidId } from '../utils/valid.js';
import {sendJson} from '../utils/json.js'
import { MAX_SIZE } from '../utils/valid.js';

export async function handleGetMedia(req, res) {
    const { pathname } = parse(req.url, true);
    const parts = pathname.split('/');    
    const id = parts[3];
    if (!isValidId(id)) {
      throw new AppError('Invalid media id', 400);
  }
  const media = await getMediaById(id);

  const { data, mime, uploaded_at } = media;
  res.writeHead(200, {
    'Content-Type' : mime  || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  res.end(data);        
}
export async function handlePostMedia(req, res) {
 const fullURL = new URL(req.url, `http://${req.headers.host}`);
  const webReq  = new Request(fullURL, { method:req.method, headers:req.headers, body:req, duplex : 'half' });
  const form = await webReq.formData();             
  const campsiteId = form.get('campsite_id')?.trim();
  const reviewId = form.get('review_id')   || null;
  const messageId = form.get('message_id')  || null;

  const errors = [];
  if (!isValidId(campsiteId))          
    errors.push('bad campsite_id');
  if (reviewId  && !isValidId(reviewId))  
    errors.push('bad review_id');
  if (messageId && !isValidId(messageId))  
    errors.push('bad message_id');

  const files = form.getAll('data');   
  if (!files.length) 
    errors.push('no files uploaded');
  for (const f of files) {
    if (f.size > MAX_SIZE)
      errors.push(`${f.name || 'file'} exceeds ${Math.round(MAX_SIZE/1_048_576)} MB`);
  }
  if (errors.length) 
    throw new AppError(errors.join(', '), 400);

  const media_ids = [];
  for (const blob of files) {
    const buf = Buffer.from(await blob.arrayBuffer());
    const mime = blob.type || 'application/octet-stream';
    const type = mime.split('/')[0];       
    const id = await createMedia({
      campsiteId,
      reviewId,
      messageId,
      type,
      mime,
      buffer: buf
    });
    media_ids.push(id);
  }
  return sendJson(res, 201, { media_ids });
}