import { pool } from '../utils/db.js';
import bcrypt from 'bcrypt';

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

export async function findUserByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

export async function validatePassword(inputPassword, storedHash) {
  return bcrypt.compare(inputPassword, storedHash);
}

export async function createUser({ username, email, password}) {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, role`,
    [username, email, password]
  );
  return result.rows[0];
}