import { AppError } from '../utils/appError.js';
import { sendJson, json } from '../utils/json.js';
import { createBooking } from '../models/bookingModel.js';

function isIso(d){ return /^\d{4}-\d{2}-\d{2}$/.test(d); }

export async function handlePostBooking(req,res){
  const { campsite_id, checkin, checkout, guests } = await json(req);

  if (!campsite_id || !isIso(checkin) || !isIso(checkout))
    throw new AppError('campsite_id, checkin, checkout required', 400);
  if (new Date(checkout) <= new Date(checkin))
    throw new AppError('checkout must be after checkin', 400);
  if (!Number.isInteger(guests) || guests < 1)
    throw new AppError('guests must be positive int', 400);

  try {
    const booking = await createBooking({
      campsiteId : campsite_id,
      userId     : req.user.id,
      checkin,
      checkout,
      guests
    });
    sendJson(res, 201, booking);
  } catch (e) {
    if (e.code === '23P01')
      throw new AppError('Selected dates already booked', 409);
    throw e;
  }
}