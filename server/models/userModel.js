import { pool } from '../utils/db.js';

export async function findUserByOAuthSub(sub) {
  const result = await pool.query('SELECT * FROM users WHERE oauth_sub = $1', [sub]);
  return result.rows[0] || null;
}

export async function createOAuthUser({ email, username, oauth_provider, oauth_sub }) {
  const result = await pool.query(
    `INSERT INTO users (email, username, oauth_provider, oauth_sub)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email, username, oauth_provider, oauth_sub]
  );
  return result.rows[0];
}
