import { AppError } from '../utils/appError.js';
import { getMediaById } from '../models/mediaModel.js';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleGetMedia(req, res, id) {
  if (!UUID_RE.test(id)) {
    throw new AppError('Invalid media id', 400);
  }
  const media = await getMediaById(id);

  const { type, data, uploaded_at } = media;
  const mimeMap = {
    jpeg: 'image/jpeg',
    jpg:  'image/jpeg',
    png:  'image/png',
    webp: 'image/webp',
    gif:  'image/gif'
  };
  const mime = mimeMap[type] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type' : mime,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Last-Modified': new Date(uploaded_at).toUTCString(),
    'ETag'         : `"${id}"`,
  });
  res.end(data);        
}
