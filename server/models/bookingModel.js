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

export async function getBookingsByUserId(userId) {
  const vals  = [userId];
  const { rows } = await pool.query( `SELECT b.id,b.period,lower(b.period) AS checkin,
    (upper(b.period)-INTERVAL '1 day')::date AS checkout,
      b.guests,b.status,b.created_at,cs.id AS campsite_id,
      cs.name AS campsite_name,cs.price,cs.county,cs.type
    FROM bookings  b JOIN campsites cs ON cs.id = b.campsite_id
    WHERE b.user_id = $1 ORDER BY b.created_at DESC `, vals);
  return rows;
}

export async function getBookedRanges(campsiteId) {
  const sql = `SELECT (LOWER(period)+ INTERVAL '1 day')::date AS checkin,
    UPPER(period)  AS checkout
    FROM bookings WHERE campsite_id = $1 AND  status = 'confirmed'
      AND  UPPER(period) >= CURRENT_DATE ORDER BY checkin;
  `;
  const { rows } = await pool.query(sql, [campsiteId]);
  return rows.map(r => ({
    checkin : r.checkin .toISOString().slice(0, 10),
    checkout: r.checkout.toISOString().slice(0, 10)
  }));
}

export async function deleteBookingById(id) {
  const result = await pool.query(
    "DELETE FROM bookings WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rowCount > 0;
}

export async function getBookings() {
  const query = `
    SELECT
      b.id,
      b.user_id,
      b.campsite_id,
      LOWER(b.period) AS start_date,
      UPPER(b.period) AS end_date,
      b.guests,
      b.status,
      b.created_at,
      u.username AS user_name,
      c.name AS campsite_name,
      c.price AS campsite_price
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN campsites c ON b.campsite_id = c.id
    ORDER BY b.created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;

}

export async function getBooking(id) {
  const query = `
    SELECT
      b.id,
      b.user_id,
      b.campsite_id,
      LOWER(b.period) AS start_date,
      UPPER(b.period) AS end_date,
      b.guests,
      b.status,
      b.created_at,
      u.username AS user_name,
      c.name AS campsite_name,
      c.price AS campsite_price
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN campsites c ON b.campsite_id = c.id
    WHERE b.id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

export async function updateBooking(id, updates) {
  const { checkin, checkout, guests } = updates;

  if (!checkin || !checkout || guests === undefined) {
    throw new Error("Missing required fields: checkin, checkout, guests");
  }

  const query = `
    UPDATE bookings 
    SET 
      period = daterange($1::date, $2::date, '[]'),
      guests = $3
    WHERE id = $4
    RETURNING *;
  `;

  const values = [checkin, checkout, guests, id];

  const { rows } = await pool.query(query, values);
  if (!rows.length) throw new Error("Booking not found");

  return rows[0];
}

export async function isBookingOwnedByUser(bookingId, userId) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM bookings WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [bookingId, userId]
  );
  return rowCount === 1;
}