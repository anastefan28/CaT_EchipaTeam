import { AppError } from '../utils/appError.js';
import { sendJson, json } from '../utils/json.js';
import { isIso ,isValidId} from '../utils/valid.js';
import { getBookingsByUserId,getBookedRanges,createBooking, deleteBookingById, getBookings } from '../models/bookingModel.js';

export async function handlePostBooking(req,res){
  const { campsite_id, checkin, checkout, guests } = await json(req);
  if (!campsite_id || !isIso(checkin) || !isIso(checkout))
    throw new AppError('campsite_id, checkin, checkout required', 400);
  if (!isValidId(campsite_id))
    throw new AppError('Invalid campsite id', 400);
  if (new Date(checkout) <= new Date(checkin))
    throw new AppError('checkout must be after checkin', 400);
  if (!Number.isInteger(guests) || guests < 1)
    throw new AppError('guests must be positive int', 400);
  console.log('Creating booking', {
    campsite_id,
    userId: req.user.id,
    checkin,
    checkout,
    guests
  });
  try {
    const booking = await createBooking({
      campsiteId : campsite_id,
      userId : req.user.id,
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

export async function handleGetMyBookings(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const status = url.searchParams.get('status');         

  if (status && !['confirmed', 'cancelled'].includes(status)) {
    throw new AppError('status must be "confirmed" or "cancelled"', 400);
  }

  const rows = await getBookingsByUserId(req.user.id, status );
  sendJson(res, 200, rows);
}

export async function handleBookedRanges(req, res) {
  const parts = req.url.split('/');
  const campsiteId = parts[3];
  if (!isValidId(campsiteId)) {
    throw new AppError('Invalid campsite id', 400);
  }

  try {
    const data = await getBookedRanges(campsiteId);
    sendJson(res, 200, data);
  } catch (err) {
    console.error(err);
    throw new AppError('Error fetching booked ranges', 500);
  }
}
export async function handleDeleteBooking(req, res) {
  const id = req.params?.id || req.url.split("/").pop();

  try {
    const deleted = await deleteBookingById(id);

    if (!deleted) {
      return sendJson(res, 404, { error: "Booking not found" });
    }

    return sendJson(res, 200, {
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (err) {
    console.error("Delete booking error:", err);
    return sendJson(res, 500, { error: "Internal server error" });
  }
}

export async function handleGetAllBookings(req, res) {
  const bookings = await getBookings();
  sendJson(res, 200, bookings);
}