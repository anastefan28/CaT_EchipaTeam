import { pool } from "../utils/db.js";
import bcrypt from "bcrypt";

export async function findUserByOAuthSub(sub) {
  const result = await pool.query("SELECT * FROM users WHERE oauth_sub = $1", [
    sub,
  ]);
  return result.rows[0] || null;
}

export async function createOAuthUser({
  email,
  username,
  oauth_provider,
  oauth_sub,
}) {
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
    "SELECT * FROM users WHERE email = LOWER($1)",
    [email]
  );
  return result.rows[0];
}

export async function validatePassword(inputPassword, storedHash) {
  return bcrypt.compare(inputPassword, storedHash);
}

export async function createUser({ username, email, password, role }) {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, role`,
    [username, email, password, role]
  );
  return result.rows[0];
}

export async function getUserById(id) {
  const query = `
    SELECT id, email, username, role, created_at, oauth_provider, password_hash
    FROM users WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function getAllUsers() {
  const query = `
    SELECT id, email, username, role, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

export async function deleteUserById(id) {
  const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return result.rowCount > 0;
}

export async function updateUserById(id, fields, role) {
  let allowed;
  if( role !== 'admin') {
    allowed = ['username', 'password'];
  }
  else {
    allowed = ['username', 'email', 'password', 'role'];
  }
  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      updates.push(`${key === 'password' ? 'password_hash' : key} = $${values.length}`);
    }
  }
  if (updates.length === 0) return;

  values.push(id);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length}`;
  await pool.query(query, values);
}
