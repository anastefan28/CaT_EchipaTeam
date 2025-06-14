import { pool } from "../utils/db.js";

export async function getAdminStats() {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM campsites) AS total_campsites,
      (SELECT COUNT(*) FROM bookings) AS total_bookings
  `;
  const result = await pool.query(query);
  return result.rows[0];
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
      c.name AS campsite_name
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN campsites c ON b.campsite_id = c.id
    ORDER BY b.created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}
