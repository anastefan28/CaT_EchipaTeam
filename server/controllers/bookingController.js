import { AppError } from '../utils/appError.js';
import { sendJson } from '../utils/json.js';
import {
  getBookingsByUserId,
  getBookedRanges,
  createBooking,
  deleteBookingById,
  getBookings,
  getBooking,
  updateBooking,
  isBookingOwnedByUser
} from "../models/bookingModel.js";
import { isValidId } from '../utils/valid.js';

export async function handlePostBooking(req,res){
  const { campsite_id, checkin, checkout, guests } = req.body;
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
  const rows = await getBookingsByUserId(req.user.id);
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
  if (!isValidId(id)) {
    throw new AppError("Invalid booking id", 400);    
  }
  const userId = req.user?.id;
  const userRole = req.user?.role;
  const owns = await isBookingOwnedByUser(id, userId);
  if(userRole!== 'admin' && !owns) {
    throw new AppError("You are not authorized to delete this booking", 403);
  }
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

export async function handleGetBooking(req, res) {
  const id = req.params?.id || req.url.split("/").pop();
  if (!isValidId(id)) {
    throw new AppError('Invalid booking id', 400);
  }
  const booking = await getBooking(id);
  if (!booking) {
    throw new AppError('Booking not found', 404);
  }
  sendJson(res, 200, booking);
}
export async function handleUpdateBooking(req, res) {
  const id = req.params?.id || req.url.split("/").pop();
  if (!isValidId(id)) {
    throw new AppError("Invalid booking id", 400);
  }
  const { checkin, checkout, guests } = req.body;
  try {
    const updatedBooking = await updateBooking(id, {
      checkin,
      checkout,
      guests,
    });
    sendJson(res, 200, updatedBooking);
  } catch (err) {
    console.error(err);
    throw new AppError("Error updating booking", 500);
  }
}