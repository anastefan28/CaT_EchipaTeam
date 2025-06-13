import { pool } from '../utils/db.js';
import { AppError } from '../utils/appError.js';

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