import { pool } from "../utils/db.js";
import { AppError } from "../utils/appError.js";

export async function getMediaById(id) {

        const { rows } = await pool.query(
        'SELECT mime, data, uploaded_at FROM media WHERE id = $1',
        [id]
      );
      if (!rows || rows.length===0) {
        throw new AppError('Media not found', 404);
      }
      return rows[0];
}

export async function createMedia({ campsiteId, reviewId, messageId,
                                    type, mime, buffer }) {
  const { rows } = await pool.query(
    `INSERT INTO media (campsite_id, review_id, message_id,type, mime, data)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [campsiteId, reviewId, messageId, type, mime, buffer]
  );
  if (!rows || rows.length === 0) {
    throw new AppError('Failed to create media', 500);
  }
  return rows[0].id;                 
}

