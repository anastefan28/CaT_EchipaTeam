import { getCampsites } from '../models/campsiteModel.js';
import { sendJson } from '../utils/json.js';

export async function handleGetCampsites(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const filters = {
    location: url.searchParams.get('location') || undefined,
    guests: url.searchParams.get('guests') ? parseInt(url.searchParams.get('guests')) : undefined,
    checkin: url.searchParams.get('checkin') || undefined,
    checkout: url.searchParams.get('checkout') || undefined,
    sort: url.searchParams.get('sort') || undefined,
    media : url.searchParams.get('media'),
  };

  const campsites = await getCampsites(filters);
  sendJson(res, 200, campsites);
}