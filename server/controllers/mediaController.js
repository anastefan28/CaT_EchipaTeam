import { AppError } from '../utils/appError.js';
import { getMediaById } from '../models/mediaModel.js';
import { parse }    from 'url';
import { isValidId } from '../utils/valid.js';

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
export async function handlePostMedia(req, res) {}