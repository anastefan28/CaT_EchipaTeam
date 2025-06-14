import {pool} from '../utils/db.js';

export async function createBooking({ campsiteId, userId, checkin, checkout, guests }) {
  const { rows } = await pool.query(
    `INSERT INTO bookings (campsite_id,user_id,period,guests)
       VALUES ($1,$2, daterange($3::date,$4::date,'[]'), $5)
     RETURNING *`,
    [campsiteId, userId, checkin, checkout, guests]
  );
  return rows[0];
}

export async function getBookingsByUser(userId) {
  const { rows } = await pool.query(
    `SELECT b.*, cs.name AS campsite_name,cs.county AS campsite_county,
            cs.type AS campsite_type,cs.price AS campsite_price
       FROM bookings b JOIN campsites cs ON cs.id = b.campsite_id
      WHERE b.user_id =$1 ORDER BY b.created_at DESC`,
    [userId]
  );
  return rows;
}