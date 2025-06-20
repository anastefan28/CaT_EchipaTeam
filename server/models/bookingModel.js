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

export async function getBookingsByUserId(userId, status) {
  const vals  = [userId];
  let where = 'WHERE b.user_id = $1';
  if (status) {
    vals.push(status);
    where += ` AND b.status = $${vals.length}`;
  }
  const { rows } = await pool.query( `SELECT b.id,b.period,lower(b.period) AS checkin,
    (upper(b.period)-INTERVAL '1 day')::date AS checkout,
      b.guests,b.status,b.created_at,cs.id AS campsite_id,
      cs.name AS campsite_name,cs.price,cs.county,cs.type
    FROM bookings  b JOIN campsites cs ON cs.id = b.campsite_id
    ${where} ORDER BY b.created_at DESC `, vals);
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