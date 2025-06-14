import { getCampsites } from '../models/campsiteModel.js';
import { AppError } from '../utils/appError.js';
import { sendJson } from '../utils/json.js';
import { isIso, isValidId } from '../utils/valid.js';

export async function handleGetCampsites(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const filters = {
    location: url.searchParams.get('location')?.trim() || undefined,
    guests: url.searchParams.get('guests') ? parseInt(url.searchParams.get('guests')) : undefined,
    checkin: url.searchParams.get('checkin') || undefined,
    checkout: url.searchParams.get('checkout') || undefined,
    sort: url.searchParams.get('sort') || 'newest',
  };
  const errors = [];

  if (filters.location && filters.location.length > 100)
    errors.push('location must be ≤ 100 characters');

  if (filters.guests && (!Number.isInteger(filters.guests) || filters.guests < 1 || filters.guests > 20))
    errors.push('guests must be an integer between 1 and 20');

  const bothDates = filters.checkin && filters.checkout;
  if (bothDates) {
    if (!isIso(filters.checkin) || !isIso(filters.checkout))
      errors.push('dates must be yyyy-mm-dd');
    else if (filters.checkin > filters.checkout)
      errors.push('checkout must be after checkin');
  } else if (filters.checkin || filters.checkout) {
    errors.push('both checkin and checkout must be provided together');
  }
  if (filters.sort) {
    const validSorts = ['popular', 'price-low', 'price-high', 'rating', 'newest'];
    if (!validSorts.includes(filters.sort)) {
      errors.push(`sort must be one of: ${validSorts.join(', ')}`);
    }
  }
  if (errors.length) 
    throw new AppError(errors.join(', '), 400);

  const campsites = await getCampsites(filters);
  sendJson(res, 200, campsites);
}


export async function handleGetCampsite(req, res) {
  const parts = req.url.split('/');
  const id = parts[3];
  if (isValidId(id) === false) {
    throw new AppError('Invalid campsite id', 400);
  }
  try {
    const campsites = await getCampsites({ id });
    if (!campsites || campsites.length === 0) {
      throw new AppError('Campsite not found', 404);
    }
    sendJson(res, 200, campsites[0]);
  } catch (err) {
    console.error('Error fetching campsite:', err);
    throw new AppError('Internal Server Error', 500);
  }
}