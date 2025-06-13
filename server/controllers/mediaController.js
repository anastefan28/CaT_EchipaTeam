import { AppError } from '../utils/appError.js';
import { getMediaById } from '../models/mediaModel.js';
import { parse }    from 'url';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function handleGetMedia(req, res) {
    const { pathname } = parse(req.url, true);
    const parts = pathname.split('/');    
    const id = parts[3];
    if (!UUID_RE.test(id)) {
    throw new AppError('Invalid media id', 400);
  }
  const media = await getMediaById(id);

  const { data, mime, uploaded_at } = media;
  console.log(`Serving media ${id} (${mime})`);
  res.writeHead(200, {
    'Content-Type' : mime  || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Last-Modified': new Date(uploaded_at).toUTCString(),
    'ETag'         : `"${id}"`,
  });
  res.end(data);        
}
