import { pool } from '../utils/db.js';
export async function getReviewsByCampsiteId(campsiteId) {
  const { rows } = await pool.query(
    `SELECT r.*,u.username,COALESCE(m.img_ids,'{}'::uuid[]) AS media_ids
     FROM reviews r JOIN users u ON u.id = r.user_id
     LEFT JOIN LATERAL(SELECT array_agg(id ORDER BY uploaded_at) AS img_ids
        FROM media WHERE review_id = r.id) m ON TRUE
     WHERE r.campsite_id = $1 ORDER BY r.created_at DESC`,
    [campsiteId]
  );
  return rows;
}
export async function createMessage({ campsiteId, userId, body }) {
  const { rows } = await pool.query(
    `INSERT INTO messages (campsite_id,user_id,body_md)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [campsiteId, userId, body]
  );
  return rows[0];
}
