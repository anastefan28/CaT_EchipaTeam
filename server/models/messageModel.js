import { pool } from '../utils/db.js';

export async function getMessagesByCampsiteId(campsiteId) {
  const { rows } = await pool.query(
    `SELECT m.*, u.username,COALESCE(md.img_ids,'{}'::uuid[]) AS media_ids
     FROM messages m JOIN users u ON u.id = m.user_id
     LEFT JOIN LATERAL(SELECT array_agg(id ORDER BY uploaded_at) AS img_ids
        FROM media WHERE message_id = m.id) md ON TRUE
     WHERE m.campsite_id = $1 ORDER BY m.created_at`,
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