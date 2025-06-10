
import { getCampsites } from '../models/campsiteModel.js';
import { sendJson } from '../utils/json.js';

export async function getCampsites(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  const filters = {
    region: url.searchParams.get('region') || undefined,
    type: url.searchParams.get('type') || undefined,
    location: url.searchParams.get('location') || undefined,
    minPrice: url.searchParams.get('minPrice') ? parseFloat(url.searchParams.get('minPrice')) : undefined,
    maxPrice: url.searchParams.get('maxPrice') ? parseFloat(url.searchParams.get('maxPrice')) : undefined,
    capacity: url.searchParams.get('capacity') || undefined,
    minRating: url.searchParams.get('minRating') ? parseFloat(url.searchParams.get('minRating')) : undefined,
    amenities: url.searchParams.getAll('amenities'),
    checkin: url.searchParams.get('checkin') || undefined,
    checkout: url.searchParams.get('checkout') || undefined,
    sortBy: url.searchParams.get('sort') || undefined
  };

  const campsites = await getCampsites(filters);
  sendJson(res, 200, campsites);
}
