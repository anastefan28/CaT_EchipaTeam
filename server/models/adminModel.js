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


