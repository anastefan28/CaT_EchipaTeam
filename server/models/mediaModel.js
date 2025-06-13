import { pool } from '../utils/db.js';
export async function getMediaById(id) {
        const { rows } = await pool.query(
        'SELECT type, data, uploaded_at FROM media WHERE id = $1',
        [id]
      );
      if (!rows.length) {
        throw new AppError('Media not found', 404);
      }
}